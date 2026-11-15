use serde::{Deserialize, Serialize};

use crate::isa::{ExecutionStage, ExecutionStatus};

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AluFlags {
    pub zero: bool,
    pub negative: bool,
    pub carry: bool,
    pub overflow: bool,
}

#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ControlSignalsState {
    pub pc_write: bool,
    pub ir_write: bool,
    pub reg_write: bool,
    pub mem_read: bool,
    pub mem_write: bool,
    pub alu_op: Option<String>,
    pub branch_taken: bool,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AluOperationState {
    pub operation: String,
    pub operand_a: Option<i32>,
    pub operand_b: Option<i32>,
    pub result: Option<i32>,
}

impl Default for AluOperationState {
    fn default() -> Self {
        Self {
            operation: "NONE".to_string(),
            operand_a: None,
            operand_b: None,
            result: None,
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MemoryCellSnapshot {
    pub address: u16,
    pub value: i32,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuFault {
    pub code: String,
    pub message: String,
    pub line: Option<u32>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CpuSnapshot {
    pub status: ExecutionStatus,
    pub stage: ExecutionStage,
    pub stage_active: bool,
    pub pc: u16,
    pub current_instruction_line: Option<u32>,
    pub ir: Option<String>,
    pub mar: Option<u16>,
    pub mdr: Option<i32>,
    pub registers: [i32; 8],
    pub changed_registers: Vec<u8>,
    pub flags: AluFlags,
    pub alu: AluOperationState,
    pub control_signals: ControlSignalsState,
    pub clock_cycles: u64,
    pub executed_instructions: u64,
    pub non_zero_memory: Vec<MemoryCellSnapshot>,
    pub last_modified_memory_addr: Option<u16>,
    pub active_component_ids: Vec<String>,
    pub active_paths: Vec<String>,
    pub fault: Option<CpuFault>,
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParseError {
    pub code: String,
    pub line: u32,
    pub column: u32,
    pub token: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LoadProgramResult {
    pub ok: bool,
    pub instruction_count: usize,
    pub snapshot: Option<CpuSnapshot>,
    pub errors: Option<Vec<ParseError>>,
}
