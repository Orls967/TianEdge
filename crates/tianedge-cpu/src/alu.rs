use crate::snapshot::AluFlags;

#[derive(Debug, Clone, Copy)]
pub enum AluOp {
    Add,
    Sub,
    Mul,
    And,
    Or,
    Xor,
    Cmp,
}

impl AluOp {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Add => "ADD",
            Self::Sub => "SUB",
            Self::Mul => "MUL",
            Self::And => "AND",
            Self::Or => "OR",
            Self::Xor => "XOR",
            Self::Cmp => "CMP",
        }
    }
}

pub fn execute_alu(op: AluOp, a: i32, b: i32) -> (i32, AluFlags) {
    match op {
        AluOp::Add => {
            let result = a.wrapping_add(b);
            let unsigned_sum = (a as u32 as u64) + (b as u32 as u64);
            let flags = AluFlags {
                zero: result == 0,
                negative: result < 0,
                carry: unsigned_sum > (u32::MAX as u64),
                overflow: a.checked_add(b).is_none(),
            };
            (result, flags)
        }
        AluOp::Sub | AluOp::Cmp => {
            let result = a.wrapping_sub(b);
            let flags = AluFlags {
                zero: result == 0,
                negative: result < 0,
                carry: (a as u32) >= (b as u32),
                overflow: a.checked_sub(b).is_none(),
            };
            (result, flags)
        }
        AluOp::Mul => {
            let result = a.wrapping_mul(b);
            let flags = AluFlags {
                zero: result == 0,
                negative: result < 0,
                carry: false,
                overflow: a.checked_mul(b).is_none(),
            };
            (result, flags)
        }
        AluOp::And => {
            let result = a & b;
            (
                result,
                AluFlags {
                    zero: result == 0,
                    negative: result < 0,
                    carry: false,
                    overflow: false,
                },
            )
        }
        AluOp::Or => {
            let result = a | b;
            (
                result,
                AluFlags {
                    zero: result == 0,
                    negative: result < 0,
                    carry: false,
                    overflow: false,
                },
            )
        }
        AluOp::Xor => {
            let result = a ^ b;
            (
                result,
                AluFlags {
                    zero: result == 0,
                    negative: result < 0,
                    carry: false,
                    overflow: false,
                },
            )
        }
    }
}
