use serde::{Deserialize, Serialize};

pub const MAX_INSTRUCTIONS: usize = 256;
pub const DATA_MEMORY_SIZE: usize = 256;
pub const MAX_CYCLES_PER_RUN: u64 = 10_000;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ExecutionStage {
    Fetch,
    Decode,
    RegisterRead,
    Execute,
    MemoryAccess,
    WriteBack,
}

impl ExecutionStage {
    pub fn next(self) -> Self {
        match self {
            Self::Fetch => Self::Decode,
            Self::Decode => Self::RegisterRead,
            Self::RegisterRead => Self::Execute,
            Self::Execute => Self::MemoryAccess,
            Self::MemoryAccess => Self::WriteBack,
            Self::WriteBack => Self::Fetch,
        }
    }
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum ExecutionStatus {
    Idle,
    Ready,
    Running,
    Paused,
    Halted,
    Fault,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum Opcode {
    LoadImm,
    LoadMem,
    LoadMemIndirect,
    Store,
    StoreIndirect,
    Mov,
    Add,
    Sub,
    Mul,
    And,
    Or,
    Xor,
    Cmp,
    Jmp,
    Jz,
    Jnz,
    Nop,
    Halt,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct RegisterId(pub u8);

impl RegisterId {
    pub fn index(self) -> usize {
        self.0 as usize
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum JumpTarget {
    Index(i32),
    Label(String),
}

#[derive(Debug, Clone)]
pub struct Instruction {
    pub opcode: Opcode,
    pub rd: Option<RegisterId>,
    pub ra: Option<RegisterId>,
    pub rb: Option<RegisterId>,
    pub imm: Option<i32>,
    pub addr: Option<i32>,
    pub target_pc: Option<i32>,
    pub source_line: u32,
    pub raw_text: String,
}

#[derive(Debug, Clone, Default)]
pub struct Program {
    pub instructions: Vec<Instruction>,
}
