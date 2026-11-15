use crate::alu::{execute_alu, AluOp};
use crate::isa::{
    ExecutionStage, ExecutionStatus, Instruction, Opcode, DATA_MEMORY_SIZE, MAX_CYCLES_PER_RUN,
};
use crate::parser::parse_program;
use crate::snapshot::{
    AluFlags, AluOperationState, ControlSignalsState, CpuFault, CpuSnapshot, LoadProgramResult,
    MemoryCellSnapshot,
};

#[derive(Debug, Clone)]
pub struct CpuEngine {
    program: Vec<Instruction>,
    status: ExecutionStatus,
    stage: ExecutionStage,
    next_stage: ExecutionStage,
    stage_active: bool,
    pc: u16,
    current_instruction_line: Option<u32>,
    ir: Option<String>,
    mar: Option<u16>,
    mdr: Option<i32>,
    registers: [i32; 8],
    changed_registers: Vec<u8>,
    flags: AluFlags,
    alu: AluOperationState,
    control_signals: ControlSignalsState,
    clock_cycles: u64,
    executed_instructions: u64,
    data_memory: Vec<i32>,
    last_modified_memory_addr: Option<u16>,
    active_component_ids: Vec<String>,
    active_paths: Vec<String>,
    fault: Option<CpuFault>,

    // Latched pipeline stage intermediates for current 6-stage instruction
    active_instr: Option<Instruction>,
    latched_op_a: Option<i32>,
    latched_op_b: Option<i32>,
    latched_alu_res: Option<i32>,
    latched_effective_addr: Option<i32>,
    latched_store_val: Option<i32>,
    latched_mem_read_val: Option<i32>,
    latched_branch_taken: bool,
    latched_branch_target: Option<i32>,
}

impl Default for CpuEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl CpuEngine {
    pub fn new() -> Self {
        Self {
            program: Vec::new(),
            status: ExecutionStatus::Idle,
            stage: ExecutionStage::Fetch,
            next_stage: ExecutionStage::Fetch,
            stage_active: false,
            pc: 0,
            current_instruction_line: None,
            ir: None,
            mar: None,
            mdr: None,
            registers: [0; 8],
            changed_registers: Vec::new(),
            flags: AluFlags::default(),
            alu: AluOperationState::default(),
            control_signals: ControlSignalsState::default(),
            clock_cycles: 0,
            executed_instructions: 0,
            data_memory: vec![0; DATA_MEMORY_SIZE],
            last_modified_memory_addr: None,
            active_component_ids: Vec::new(),
            active_paths: Vec::new(),
            fault: None,
            active_instr: None,
            latched_op_a: None,
            latched_op_b: None,
            latched_alu_res: None,
            latched_effective_addr: None,
            latched_store_val: None,
            latched_mem_read_val: None,
            latched_branch_taken: false,
            latched_branch_target: None,
        }
    }

    fn reset_execution_state(&mut self) {
        self.status = if self.program.is_empty() {
            ExecutionStatus::Idle
        } else {
            ExecutionStatus::Ready
        };
        self.stage = ExecutionStage::Fetch;
        self.next_stage = ExecutionStage::Fetch;
        self.stage_active = false;
        self.pc = 0;
        self.current_instruction_line = None;
        self.ir = None;
        self.mar = None;
        self.mdr = None;
        self.registers = [0; 8];
        self.changed_registers.clear();
        self.flags = AluFlags::default();
        self.alu = AluOperationState::default();
        self.control_signals = ControlSignalsState::default();
        self.clock_cycles = 0;
        self.executed_instructions = 0;
        self.data_memory.fill(0);
        self.last_modified_memory_addr = None;
        self.active_component_ids.clear();
        self.active_paths.clear();
        self.fault = None;
        self.clear_latches();
    }

    fn clear_latches(&mut self) {
        self.active_instr = None;
        self.latched_op_a = None;
        self.latched_op_b = None;
        self.latched_alu_res = None;
        self.latched_effective_addr = None;
        self.latched_store_val = None;
        self.latched_mem_read_val = None;
        self.latched_branch_taken = false;
        self.latched_branch_target = None;
    }

    pub fn load_program(&mut self, source: &str) -> LoadProgramResult {
        match parse_program(source) {
            Ok(program) => {
                self.program = program.instructions;
                self.reset_execution_state();
                LoadProgramResult {
                    ok: true,
                    instruction_count: self.program.len(),
                    snapshot: Some(self.snapshot()),
                    errors: None,
                }
            }
            Err(errors) => LoadProgramResult {
                ok: false,
                instruction_count: 0,
                snapshot: None,
                errors: Some(errors),
            },
        }
    }

    pub fn reset(&mut self) -> CpuSnapshot {
        self.reset_execution_state();
        self.snapshot()
    }

    pub fn set_memory_word(&mut self, addr: u16, value: i32) -> CpuSnapshot {
        if (addr as usize) >= DATA_MEMORY_SIZE {
            self.status = ExecutionStatus::Fault;
            self.stage_active = false;
            self.fault = Some(CpuFault {
                code: "MEMORY_OUT_OF_BOUNDS".to_string(),
                message: format!(
                    "Memory write address {addr} is outside valid range 0..{}.",
                    DATA_MEMORY_SIZE - 1
                ),
                line: self.current_instruction_line,
            });
            return self.snapshot();
        }
        self.data_memory[addr as usize] = value;
        self.last_modified_memory_addr = Some(addr);
        self.snapshot()
    }

    pub fn get_snapshot(&self) -> CpuSnapshot {
        self.snapshot()
    }

    pub fn step_stage(&mut self) -> CpuSnapshot {
        if matches!(self.status, ExecutionStatus::Halted | ExecutionStatus::Fault) {
            return self.snapshot();
        }
        if self.program.is_empty() {
            self.status = ExecutionStatus::Idle;
            self.stage_active = false;
            return self.snapshot();
        }

        // Resume from paused state cleanly on single step
        if self.status == ExecutionStatus::Paused {
            self.fault = None;
            self.status = ExecutionStatus::Ready;
        }

        match self.next_stage {
            ExecutionStage::Fetch => self.exec_fetch(),
            ExecutionStage::Decode => self.exec_decode(),
            ExecutionStage::RegisterRead => self.exec_register_read(),
            ExecutionStage::Execute => self.exec_execute(),
            ExecutionStage::MemoryAccess => self.exec_memory_access(),
            ExecutionStage::WriteBack => self.exec_write_back(),
        }

        self.snapshot()
    }

    pub fn step_instruction(&mut self) -> CpuSnapshot {
        if matches!(self.status, ExecutionStatus::Halted | ExecutionStatus::Fault) {
            return self.snapshot();
        }
        if self.program.is_empty() {
            return self.snapshot();
        }

        let target_cycles = if self.next_stage == ExecutionStage::Fetch {
            6
        } else {
            match self.next_stage {
                ExecutionStage::Fetch => 6,
                ExecutionStage::Decode => 5,
                ExecutionStage::RegisterRead => 4,
                ExecutionStage::Execute => 3,
                ExecutionStage::MemoryAccess => 2,
                ExecutionStage::WriteBack => 1,
            }
        };

        for _ in 0..target_cycles {
            self.step_stage();
            if matches!(self.status, ExecutionStatus::Halted | ExecutionStatus::Fault) {
                break;
            }
        }
        self.snapshot()
    }

    pub fn step_many(&mut self, max_steps: u32) -> CpuSnapshot {
        let cap = (max_steps as u64).min(MAX_CYCLES_PER_RUN);
        let mut steps_run: u64 = 0;

        while steps_run < cap {
            if matches!(self.status, ExecutionStatus::Halted | ExecutionStatus::Fault) {
                break;
            }
            if self.program.is_empty() {
                break;
            }
            self.step_stage();
            steps_run += 1;
            if matches!(self.status, ExecutionStatus::Halted | ExecutionStatus::Fault) {
                break;
            }
        }

        if steps_run >= MAX_CYCLES_PER_RUN
            && !matches!(self.status, ExecutionStatus::Halted | ExecutionStatus::Fault)
        {
            self.trigger_cycle_limit_watchdog();
        }

        self.snapshot()
    }

    pub fn trigger_cycle_limit_watchdog(&mut self) {
        self.status = ExecutionStatus::Paused;
        self.stage_active = false;
        self.fault = Some(CpuFault {
            code: "CYCLE_LIMIT_REACHED".to_string(),
            message: format!(
                "Execution paused by safety watchdog after {MAX_CYCLES_PER_RUN} clock cycles without halting."
            ),
            line: self.current_instruction_line,
        });
    }

    fn set_active(&mut self, components: &[&str], paths: &[&str]) {
        self.active_component_ids = components.iter().map(|s| (*s).to_string()).collect();
        self.active_paths = paths.iter().map(|s| (*s).to_string()).collect();
    }

    fn exec_fetch(&mut self) {
        let pc_idx = self.pc as usize;
        if pc_idx >= self.program.len() {
            self.status = ExecutionStatus::Halted;
            self.stage = ExecutionStage::Fetch;
            self.stage_active = false;
            self.ir = None;
            self.current_instruction_line = None;
            self.control_signals = ControlSignalsState::default();
            self.alu = AluOperationState::default();
            self.changed_registers.clear();
            self.set_active(&[], &[]);
            return;
        }

        let instr = self.program[pc_idx].clone();
        self.clear_latches();
        self.changed_registers.clear();
        self.last_modified_memory_addr = None;
        self.alu = AluOperationState::default();
        self.mar = Some(self.pc);
        self.mdr = None;
        self.current_instruction_line = Some(instr.source_line);
        self.ir = Some(instr.raw_text.clone());
        self.active_instr = Some(instr);

        self.clock_cycles += 1;
        self.status = ExecutionStatus::Ready;
        self.stage = ExecutionStage::Fetch;
        self.stage_active = true;
        self.next_stage = ExecutionStage::Decode;
        self.control_signals = ControlSignalsState {
            ir_write: true,
            mem_read: true,
            ..Default::default()
        };
        self.set_active(
            &[
                "core-control-unit",
                "mem-l1-icache",
                "bus-internal-interconnect",
            ],
            &["pc_to_icache", "icache_to_cu"],
        );
    }

    fn exec_decode(&mut self) {
        let Some(instr) = self.active_instr.as_ref() else {
            return;
        };
        let alu_op_name = opcode_to_alu_op(instr.opcode).map(|op| op.as_str().to_string());

        self.clock_cycles += 1;
        self.stage = ExecutionStage::Decode;
        self.stage_active = true;
        self.next_stage = ExecutionStage::RegisterRead;
        self.control_signals = ControlSignalsState {
            alu_op: alu_op_name,
            ..Default::default()
        };
        self.set_active(
            &["core-control-unit", "logic-instruction-decoder"],
            &["cu_control_broadcast"],
        );
    }

    fn exec_register_read(&mut self) {
        let Some(instr) = self.active_instr.clone() else {
            return;
        };

        self.clock_cycles += 1;
        self.stage = ExecutionStage::RegisterRead;
        self.stage_active = true;
        self.next_stage = ExecutionStage::Execute;

        match instr.opcode {
            Opcode::LoadImm => {
                self.latched_op_a = instr.imm;
                self.set_active(&["core-control-unit"], &["cu_control_broadcast"]);
            }
            Opcode::LoadMem => {
                self.latched_effective_addr = instr.addr;
                self.set_active(&["core-control-unit"], &["cu_control_broadcast"]);
            }
            Opcode::LoadMemIndirect => {
                let rs = instr.ra.expect("LOAD indirect requires ra");
                let addr_val = self.registers[rs.index()];
                self.latched_op_a = Some(addr_val);
                self.latched_effective_addr = Some(addr_val);
                self.set_active(
                    &["core-registers", "core-control-unit"],
                    &["regfile_to_alu_a"],
                );
            }
            Opcode::Store => {
                let rs = instr.ra.expect("STORE requires ra");
                let val = self.registers[rs.index()];
                self.latched_store_val = Some(val);
                self.latched_effective_addr = instr.addr;
                self.mdr = Some(val);
                self.set_active(
                    &["core-registers", "core-control-unit"],
                    &["regfile_to_mdr_data"],
                );
            }
            Opcode::StoreIndirect => {
                let rs = instr.ra.expect("STORE indirect requires ra");
                let rb = instr.rb.expect("STORE indirect requires rb");
                let val = self.registers[rs.index()];
                let addr_val = self.registers[rb.index()];
                self.latched_store_val = Some(val);
                self.latched_effective_addr = Some(addr_val);
                self.mdr = Some(val);
                self.set_active(
                    &["core-registers", "core-control-unit"],
                    &["regfile_to_alu_a", "regfile_to_mdr_data"],
                );
            }
            Opcode::Mov => {
                let rs = instr.ra.expect("MOV requires ra");
                self.latched_op_a = Some(self.registers[rs.index()]);
                self.set_active(
                    &["core-registers", "core-control-unit"],
                    &["regfile_to_alu_a"],
                );
            }
            Opcode::Add
            | Opcode::Sub
            | Opcode::Mul
            | Opcode::And
            | Opcode::Or
            | Opcode::Xor
            | Opcode::Cmp => {
                let ra = instr.ra.expect("ALU op requires ra");
                let rb = instr.rb.expect("ALU op requires rb");
                self.latched_op_a = Some(self.registers[ra.index()]);
                self.latched_op_b = Some(self.registers[rb.index()]);
                self.set_active(
                    &["core-registers", "core-control-unit"],
                    &["regfile_to_alu_a", "regfile_to_alu_b"],
                );
            }
            Opcode::Jmp | Opcode::Jz | Opcode::Jnz | Opcode::Nop | Opcode::Halt => {
                self.set_active(&["core-control-unit"], &["cu_control_broadcast"]);
            }
        }

        self.control_signals = ControlSignalsState {
            alu_op: opcode_to_alu_op(instr.opcode).map(|op| op.as_str().to_string()),
            ..Default::default()
        };
    }

    fn exec_execute(&mut self) {
        let Some(instr) = self.active_instr.clone() else {
            return;
        };

        self.clock_cycles += 1;
        self.stage = ExecutionStage::Execute;
        self.stage_active = true;
        self.next_stage = ExecutionStage::MemoryAccess;

        let mut branch_taken = false;
        let mut alu_op_str = None;

        if let Some(op) = opcode_to_alu_op(instr.opcode) {
            let a = self.latched_op_a.unwrap_or(0);
            let b = self.latched_op_b.unwrap_or(0);
            let (result, new_flags) = execute_alu(op, a, b);
            self.flags = new_flags;
            self.latched_alu_res = Some(result);
            self.alu = AluOperationState {
                operation: op.as_str().to_string(),
                operand_a: Some(a),
                operand_b: Some(b),
                result: Some(result),
            };
            alu_op_str = Some(op.as_str().to_string());
            self.set_active(
                &["core-alu", "core-execution-units", "core-control-unit"],
                &["alu_compute_internal", "alu_to_flags"],
            );
        } else {
            match instr.opcode {
                Opcode::LoadImm => {
                    let imm = self.latched_op_a.unwrap_or(0);
                    self.latched_alu_res = Some(imm);
                    self.alu = AluOperationState {
                        operation: "PASS_IMM".to_string(),
                        operand_a: Some(imm),
                        operand_b: None,
                        result: Some(imm),
                    };
                    self.set_active(
                        &["core-alu", "core-control-unit"],
                        &["alu_compute_internal"],
                    );
                }
                Opcode::Mov => {
                    let val = self.latched_op_a.unwrap_or(0);
                    self.latched_alu_res = Some(val);
                    self.alu = AluOperationState {
                        operation: "MOV".to_string(),
                        operand_a: Some(val),
                        operand_b: None,
                        result: Some(val),
                    };
                    self.set_active(
                        &["core-alu", "core-control-unit"],
                        &["alu_compute_internal"],
                    );
                }
                Opcode::LoadMem
                | Opcode::LoadMemIndirect
                | Opcode::Store
                | Opcode::StoreIndirect => {
                    if let Some(addr) = self.latched_effective_addr {
                        if addr >= 0 && addr <= u16::MAX as i32 {
                            self.mar = Some(addr as u16);
                        }
                    }
                    self.alu = AluOperationState {
                        operation: "ADDR".to_string(),
                        operand_a: self.latched_effective_addr,
                        operand_b: None,
                        result: self.latched_effective_addr,
                    };
                    self.set_active(&["core-alu", "core-control-unit"], &["alu_to_mar_addr"]);
                }
                Opcode::Jmp => {
                    branch_taken = true;
                    self.latched_branch_taken = true;
                    self.latched_branch_target = instr.target_pc;
                    self.set_active(
                        &["core-control-unit", "core-alu"],
                        &["cu_control_broadcast"],
                    );
                }
                Opcode::Jz => {
                    branch_taken = self.flags.zero;
                    self.latched_branch_taken = branch_taken;
                    self.latched_branch_target = instr.target_pc;
                    self.set_active(
                        &["core-control-unit", "core-alu"],
                        &["cu_control_broadcast"],
                    );
                }
                Opcode::Jnz => {
                    branch_taken = !self.flags.zero;
                    self.latched_branch_taken = branch_taken;
                    self.latched_branch_target = instr.target_pc;
                    self.set_active(
                        &["core-control-unit", "core-alu"],
                        &["cu_control_broadcast"],
                    );
                }
                Opcode::Nop | Opcode::Halt => {
                    self.set_active(&["core-control-unit"], &["cu_control_broadcast"]);
                }
                Opcode::Add
                | Opcode::Sub
                | Opcode::Mul
                | Opcode::And
                | Opcode::Or
                | Opcode::Xor
                | Opcode::Cmp => unreachable!(),
            }
        }

        if self.latched_branch_taken {
            if let Some(target) = self.latched_branch_target {
                if target < 0 || (target as usize) >= self.program.len() {
                    self.status = ExecutionStatus::Fault;
                    self.stage_active = false;
                    self.fault = Some(CpuFault {
                        code: "INVALID_JUMP_TARGET".to_string(),
                        message: format!(
                            "Jump target {target} is outside loaded program bounds 0..{}.",
                            self.program.len().saturating_sub(1)
                        ),
                        line: Some(instr.source_line),
                    });
                    return;
                }
            }
        }

        self.control_signals = ControlSignalsState {
            alu_op: alu_op_str,
            branch_taken,
            ..Default::default()
        };
    }

    fn exec_memory_access(&mut self) {
        let Some(instr) = self.active_instr.clone() else {
            return;
        };

        self.clock_cycles += 1;
        self.stage = ExecutionStage::MemoryAccess;
        self.stage_active = true;
        self.next_stage = ExecutionStage::WriteBack;

        let mut mem_read = false;
        let mut mem_write = false;

        match instr.opcode {
            Opcode::LoadMem | Opcode::LoadMemIndirect => {
                mem_read = true;
                let addr = self.latched_effective_addr.unwrap_or(-1);
                if addr < 0 || (addr as usize) >= DATA_MEMORY_SIZE {
                    self.status = ExecutionStatus::Fault;
                    self.stage_active = false;
                    self.fault = Some(CpuFault {
                        code: "MEMORY_OUT_OF_BOUNDS".to_string(),
                        message: format!(
                            "Memory read address {addr} is outside valid range 0..{}.",
                            DATA_MEMORY_SIZE - 1
                        ),
                        line: Some(instr.source_line),
                    });
                    return;
                }
                let uaddr = addr as u16;
                let val = self.data_memory[uaddr as usize];
                self.mar = Some(uaddr);
                self.mdr = Some(val);
                self.latched_mem_read_val = Some(val);
                self.set_active(
                    &[
                        "mem-l1-dcache",
                        "mem-memory-controller",
                        "mem-ram-interface",
                        "bus-system-bus",
                    ],
                    &["mar_mdr_to_dcache"],
                );
            }
            Opcode::Store | Opcode::StoreIndirect => {
                mem_write = true;
                let addr = self.latched_effective_addr.unwrap_or(-1);
                if addr < 0 || (addr as usize) >= DATA_MEMORY_SIZE {
                    self.status = ExecutionStatus::Fault;
                    self.stage_active = false;
                    self.fault = Some(CpuFault {
                        code: "MEMORY_OUT_OF_BOUNDS".to_string(),
                        message: format!(
                            "Memory write address {addr} is outside valid range 0..{}.",
                            DATA_MEMORY_SIZE - 1
                        ),
                        line: Some(instr.source_line),
                    });
                    return;
                }
                let uaddr = addr as u16;
                let val = self.latched_store_val.unwrap_or(0);
                self.mar = Some(uaddr);
                self.mdr = Some(val);
                self.data_memory[uaddr as usize] = val;
                self.last_modified_memory_addr = Some(uaddr);
                self.set_active(
                    &[
                        "mem-l1-dcache",
                        "mem-memory-controller",
                        "mem-ram-interface",
                        "bus-system-bus",
                    ],
                    &["mar_mdr_to_dcache"],
                );
            }
            _ => {
                self.set_active(&["core-control-unit"], &[]);
            }
        }

        self.control_signals = ControlSignalsState {
            mem_read,
            mem_write,
            branch_taken: self.latched_branch_taken,
            ..Default::default()
        };
    }

    fn exec_write_back(&mut self) {
        let Some(instr) = self.active_instr.clone() else {
            return;
        };

        self.clock_cycles += 1;
        self.stage = ExecutionStage::WriteBack;
        self.stage_active = true;
        self.next_stage = ExecutionStage::Fetch;

        let mut reg_write = false;
        let pc_write = true;

        match instr.opcode {
            Opcode::LoadImm
            | Opcode::Mov
            | Opcode::Add
            | Opcode::Sub
            | Opcode::Mul
            | Opcode::And
            | Opcode::Or
            | Opcode::Xor => {
                if let Some(rd) = instr.rd {
                    let val = self.latched_alu_res.unwrap_or(0);
                    self.registers[rd.index()] = val;
                    self.changed_registers = vec![rd.0];
                    reg_write = true;
                }
                self.pc = self.pc.saturating_add(1);
                self.executed_instructions += 1;
                self.set_active(
                    &[
                        "core-registers",
                        "bus-internal-interconnect",
                        "core-control-unit",
                    ],
                    &["alu_to_regfile"],
                );
            }
            Opcode::LoadMem | Opcode::LoadMemIndirect => {
                if let Some(rd) = instr.rd {
                    let val = self.latched_mem_read_val.unwrap_or(0);
                    self.registers[rd.index()] = val;
                    self.changed_registers = vec![rd.0];
                    reg_write = true;
                }
                self.pc = self.pc.saturating_add(1);
                self.executed_instructions += 1;
                self.set_active(
                    &[
                        "core-registers",
                        "mem-l1-dcache",
                        "bus-internal-interconnect",
                    ],
                    &["dcache_to_regfile"],
                );
            }
            Opcode::Store | Opcode::StoreIndirect => {
                self.pc = self.pc.saturating_add(1);
                self.executed_instructions += 1;
                self.set_active(
                    &["mem-l1-dcache", "core-control-unit"],
                    &["mar_mdr_to_dcache"],
                );
            }
            Opcode::Cmp | Opcode::Nop => {
                self.pc = self.pc.saturating_add(1);
                self.executed_instructions += 1;
                self.set_active(&["core-control-unit"], &[]);
            }
            Opcode::Jmp | Opcode::Jz | Opcode::Jnz => {
                if self.latched_branch_taken {
                    let target = self.latched_branch_target.unwrap_or(0);
                    self.pc = target as u16;
                } else {
                    self.pc = self.pc.saturating_add(1);
                }
                self.executed_instructions += 1;
                self.set_active(&["core-control-unit"], &["pc_to_icache"]);
            }
            Opcode::Halt => {
                self.executed_instructions += 1;
                self.status = ExecutionStatus::Halted;
                self.stage_active = false;
                self.set_active(&["core-control-unit"], &[]);
            }
        }

        self.control_signals = ControlSignalsState {
            pc_write,
            reg_write,
            branch_taken: self.latched_branch_taken,
            ..Default::default()
        };
    }

    fn snapshot(&self) -> CpuSnapshot {
        let non_zero_memory: Vec<MemoryCellSnapshot> = self
            .data_memory
            .iter()
            .enumerate()
            .filter(|(_, val)| **val != 0)
            .map(|(address, value)| MemoryCellSnapshot {
                address: address as u16,
                value: *value,
            })
            .collect();

        CpuSnapshot {
            status: self.status,
            stage: self.stage,
            stage_active: self.stage_active,
            pc: self.pc,
            current_instruction_line: self.current_instruction_line,
            ir: self.ir.clone(),
            mar: self.mar,
            mdr: self.mdr,
            registers: self.registers,
            changed_registers: self.changed_registers.clone(),
            flags: self.flags.clone(),
            alu: self.alu.clone(),
            control_signals: self.control_signals.clone(),
            clock_cycles: self.clock_cycles,
            executed_instructions: self.executed_instructions,
            non_zero_memory,
            last_modified_memory_addr: self.last_modified_memory_addr,
            active_component_ids: self.active_component_ids.clone(),
            active_paths: self.active_paths.clone(),
            fault: self.fault.clone(),
        }
    }
}

fn opcode_to_alu_op(opcode: Opcode) -> Option<AluOp> {
    match opcode {
        Opcode::Add => Some(AluOp::Add),
        Opcode::Sub => Some(AluOp::Sub),
        Opcode::Mul => Some(AluOp::Mul),
        Opcode::And => Some(AluOp::And),
        Opcode::Or => Some(AluOp::Or),
        Opcode::Xor => Some(AluOp::Xor),
        Opcode::Cmp => Some(AluOp::Cmp),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    const CANONICAL_PROGRAM: &str = "\
LOAD R1, 10
LOAD R2, 20
ADD R3, R1, R2
STORE R3, 100
";

    #[test]
    fn tc_cpu_01_reset_and_load_state() {
        let mut cpu = CpuEngine::new();
        let initial = cpu.get_snapshot();
        assert_eq!(initial.status, ExecutionStatus::Idle);
        assert_eq!(initial.clock_cycles, 0);
        assert_eq!(initial.registers, [0; 8]);

        let load_res = cpu.load_program(CANONICAL_PROGRAM);
        assert!(load_res.ok);
        assert_eq!(load_res.instruction_count, 4);
        let snap = load_res.snapshot.expect("snapshot present");
        assert_eq!(snap.status, ExecutionStatus::Ready);
        assert_eq!(snap.pc, 0);
        assert_eq!(snap.clock_cycles, 0);
        assert_eq!(snap.stage, ExecutionStage::Fetch);
        assert!(!snap.stage_active);
    }

    #[test]
    fn tc_cpu_02_canonical_program_cycle16_and_cycle24_parity() {
        let mut cpu = CpuEngine::new();
        assert!(cpu.load_program(CANONICAL_PROGRAM).ok);

        // Step 12 cycles -> first two instructions complete (R1=10, R2=20, PC=2)
        let after_12 = cpu.step_many(12);
        assert_eq!(after_12.clock_cycles, 12);
        assert_eq!(after_12.executed_instructions, 2);
        assert_eq!(after_12.pc, 2);
        assert_eq!(after_12.registers[1], 10);
        assert_eq!(after_12.registers[2], 20);

        // Advance 4 more stages to Cycle 16: ADD R3, R1, R2 @ EXECUTE
        let cycle_16 = cpu.step_many(4);
        assert_eq!(cycle_16.status, ExecutionStatus::Ready);
        assert_eq!(cycle_16.stage, ExecutionStage::Execute);
        assert!(cycle_16.stage_active);
        assert_eq!(cycle_16.pc, 2);
        assert_eq!(cycle_16.current_instruction_line, Some(3));
        assert_eq!(cycle_16.ir.as_deref(), Some("ADD R3, R1, R2"));
        assert_eq!(cycle_16.registers, [0, 10, 20, 0, 0, 0, 0, 0]);
        assert_eq!(cycle_16.alu.operation, "ADD");
        assert_eq!(cycle_16.alu.operand_a, Some(10));
        assert_eq!(cycle_16.alu.operand_b, Some(20));
        assert_eq!(cycle_16.alu.result, Some(30));
        assert_eq!(cycle_16.clock_cycles, 16);
        assert_eq!(cycle_16.executed_instructions, 2);
        assert_eq!(
            cycle_16.active_component_ids,
            vec!["core-alu", "core-execution-units", "core-control-unit"]
        );
        assert_eq!(
            cycle_16.active_paths,
            vec!["alu_compute_internal", "alu_to_flags"]
        );

        // Advance remaining 8 stages to Cycle 24 (STORE R3, 100 WRITE_BACK)
        let cycle_24 = cpu.step_many(8);
        assert_eq!(cycle_24.clock_cycles, 24);
        assert_eq!(cycle_24.executed_instructions, 4);
        assert_eq!(cycle_24.pc, 4);
        assert_eq!(cycle_24.registers[3], 30);
        assert_eq!(cycle_24.last_modified_memory_addr, Some(100));
        assert_eq!(
            cycle_24.non_zero_memory,
            vec![MemoryCellSnapshot {
                address: 100,
                value: 30
            }]
        );

        // Next step sees pc >= program.len() -> halted without advancing clock_cycles
        let halted = cpu.step_stage();
        assert_eq!(halted.status, ExecutionStatus::Halted);
        assert_eq!(halted.clock_cycles, 24);
    }

    #[test]
    fn tc_cpu_03_flags_sub_cmp_and_conditional_branches() {
        let program = "\
LOAD R1, 5
LOAD R2, 5
SUB R3, R1, R2
JZ equal_branch
LOAD R4, 99
JMP done
equal_branch:
LOAD R4, 42
done:
LOAD R5, 3
LOAD R6, 8
CMP R5, R6
JNZ neg_check
LOAD R7, 1
neg_check:
SUB R7, R5, R6
HALT
";
        let mut cpu = CpuEngine::new();
        assert!(cpu.load_program(program).ok);

        let snap = cpu.step_many(500);
        assert_eq!(snap.status, ExecutionStatus::Halted);
        assert_eq!(snap.registers[3], 0);
        assert_eq!(snap.registers[4], 42);
        assert_eq!(snap.registers[7], -5);
        assert!(snap.flags.negative);
        assert!(!snap.flags.zero);
        assert!(!snap.flags.carry); // 3u32 < 8u32 => borrow
    }

    #[test]
    fn tc_cpu_04_sum_1_to_5_and_step_instruction_boundary() {
        let program = "\
LOAD R1, 0
LOAD R2, 1
LOAD R3, 5
loop:
ADD R1, R1, R2
ADD R2, R2, R4
LOAD R4, 1
";
        let _ = program;
        let sum_prog = "\
LOAD R1, 0
LOAD R2, 1
LOAD R3, 5
LOAD R4, 1
loop:
ADD R1, R1, R2
ADD R2, R2, R4
CMP R2, R3
JZ apply_last
JNZ loop_check
apply_last:
ADD R1, R1, R2
JMP done
loop_check:
CMP R3, R2
JNZ loop
done:
HALT
";
        let mut cpu = CpuEngine::new();
        assert!(cpu.load_program(sum_prog).ok);

        // Execute 1st instruction via step_instruction (6 cycles)
        let s1 = cpu.step_instruction();
        assert_eq!(s1.clock_cycles, 6);
        assert_eq!(s1.executed_instructions, 1);

        let done = cpu.step_many(500);
        assert_eq!(done.status, ExecutionStatus::Halted);
        assert_eq!(done.registers[1], 15);
    }

    #[test]
    fn tc_cpu_05_indirect_addressing_and_memory_bounds_fault() {
        let mut cpu = CpuEngine::new();
        let good = "\
LOAD R1, 50
LOAD R2, 77
STORE R2, [R1]
LOADM R3, [R1]
HALT
";
        assert!(cpu.load_program(good).ok);
        let snap = cpu.step_many(200);
        assert_eq!(snap.status, ExecutionStatus::Halted);
        assert_eq!(snap.registers[3], 77);
        assert_eq!(
            snap.non_zero_memory,
            vec![MemoryCellSnapshot {
                address: 50,
                value: 77
            }]
        );

        let oob = "\
LOAD R1, 99
STORE R1, 999
";
        assert!(cpu.load_program(oob).ok);
        let fault_snap = cpu.step_many(100);
        assert_eq!(fault_snap.status, ExecutionStatus::Fault);
        assert_eq!(
            fault_snap.fault.as_ref().map(|f| f.code.as_str()),
            Some("MEMORY_OUT_OF_BOUNDS")
        );
    }

    #[test]
    fn tc_cpu_06_parse_errors_and_invalid_jump_target() {
        let mut cpu = CpuEngine::new();
        let bad = "FOOBAR R1, 1\nLOAD R9, 2\nJMP missing_label\n";
        let res = cpu.load_program(bad);
        assert!(!res.ok);
        let errs = res.errors.expect("parse errors present");
        assert_eq!(errs.len(), 3);
        assert_eq!(errs[0].code, "UNKNOWN_OPCODE");
        assert_eq!(errs[1].code, "INVALID_REGISTER");
        assert_eq!(errs[2].code, "UNDEFINED_LABEL");

        assert!(cpu.load_program("JMP 99\nHALT\n").ok);
        let fault_snap = cpu.step_many(50);
        assert_eq!(fault_snap.status, ExecutionStatus::Fault);
        assert_eq!(
            fault_snap.fault.as_ref().map(|f| f.code.as_str()),
            Some("INVALID_JUMP_TARGET")
        );
    }

    #[test]
    fn tc_cpu_07_infinite_loop_watchdog_halts_cleanly_at_10000_cycles() {
        let mut cpu = CpuEngine::new();
        assert!(cpu.load_program("LOOP: JMP LOOP\n").ok);
        let snap = cpu.step_many(10_000);
        assert_eq!(snap.status, ExecutionStatus::Paused);
        assert_eq!(snap.clock_cycles, 10_000);
        assert_eq!(
            snap.fault.as_ref().map(|f| f.code.as_str()),
            Some("CYCLE_LIMIT_REACHED")
        );
    }

    #[test]
    fn tc_cpu_08_reset_restores_clean_initial_state() {
        let mut cpu = CpuEngine::new();
        assert!(cpu.load_program(CANONICAL_PROGRAM).ok);
        let ran = cpu.step_many(30);
        assert_eq!(ran.status, ExecutionStatus::Halted);
        assert_eq!(ran.registers[3], 30);

        let reset = cpu.reset();
        assert_eq!(reset.status, ExecutionStatus::Ready);
        assert_eq!(reset.clock_cycles, 0);
        assert_eq!(reset.executed_instructions, 0);
        assert_eq!(reset.pc, 0);
        assert_eq!(reset.registers, [0; 8]);
        assert!(reset.non_zero_memory.is_empty());
        assert!(reset.fault.is_none());
    }
}
