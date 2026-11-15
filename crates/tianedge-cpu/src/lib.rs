pub mod alu;
pub mod cpu;
pub mod isa;
pub mod parser;
pub mod snapshot;

use wasm_bindgen::prelude::*;

use crate::cpu::CpuEngine;
use crate::isa::MAX_CYCLES_PER_RUN;
use crate::snapshot::CpuSnapshot;

#[wasm_bindgen]
pub struct WasmCpuHandle {
    engine: CpuEngine,
}

impl Default for WasmCpuHandle {
    fn default() -> Self {
        Self::new()
    }
}

#[wasm_bindgen]
impl WasmCpuHandle {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            engine: CpuEngine::new(),
        }
    }

    pub fn load_program(&mut self, source: &str) -> String {
        let result = self.engine.load_program(source);
        serde_json::to_string(&result).unwrap_or_else(|e| {
            format!(
                "{{\"ok\":false,\"instructionCount\":0,\"errors\":[{{\"code\":\"SERIALIZATION_ERROR\",\"line\":1,\"column\":1,\"token\":\"\",\"message\":\"{}\"}}]}}",
                e.to_string().replace('"', "'")
            )
        })
    }

    pub fn step_stage(&mut self) -> String {
        serialize_snapshot(&self.engine.step_stage())
    }

    pub fn step_instruction(&mut self) -> String {
        serialize_snapshot(&self.engine.step_instruction())
    }

    pub fn step_many(&mut self, max_steps: u32) -> String {
        serialize_snapshot(&self.engine.step_many(max_steps))
    }

    pub fn trigger_watchdog(&mut self) -> String {
        self.engine.trigger_cycle_limit_watchdog();
        serialize_snapshot(&self.engine.get_snapshot())
    }

    pub fn reset(&mut self) -> String {
        serialize_snapshot(&self.engine.reset())
    }

    pub fn set_memory_word(&mut self, addr: u16, value: i32) -> String {
        serialize_snapshot(&self.engine.set_memory_word(addr, value))
    }

    pub fn get_snapshot(&self) -> String {
        serialize_snapshot(&self.engine.get_snapshot())
    }

    pub fn max_cycles_per_run() -> u32 {
        MAX_CYCLES_PER_RUN as u32
    }
}

fn serialize_snapshot(snapshot: &CpuSnapshot) -> String {
    serde_json::to_string(snapshot).expect("CpuSnapshot serialization must succeed")
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::snapshot::{CpuSnapshot, LoadProgramResult};

    #[test]
    fn wasm_handle_json_contract_roundtrip() {
        let mut handle = WasmCpuHandle::new();
        let load_json = handle.load_program("LOAD R1, 10\nLOAD R2, 20\nADD R3, R1, R2\n");
        let load_res: LoadProgramResult = serde_json::from_str(&load_json).expect("valid JSON");
        assert!(load_res.ok);
        assert_eq!(load_res.instruction_count, 3);

        let snap_json = handle.step_many(18);
        let snap: CpuSnapshot = serde_json::from_str(&snap_json).expect("valid CpuSnapshot JSON");
        assert_eq!(snap.registers[3], 30);
        assert_eq!(snap.clock_cycles, 18);
    }
}
