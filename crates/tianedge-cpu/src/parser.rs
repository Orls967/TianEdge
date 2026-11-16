use std::collections::HashMap;

use crate::isa::{Instruction, Opcode, Program, RegisterId, MAX_INSTRUCTIONS};
use crate::snapshot::ParseError;

struct PendingInstruction {
    mnemonic: String,
    operands: Vec<String>,
    source_line: u32,
    raw_text: String,
}

fn strip_comment(line: &str) -> &str {
    let mut in_bracket = false;
    for (idx, ch) in line.char_indices() {
        match ch {
            '[' => in_bracket = true,
            ']' => in_bracket = false,
            ';' | '#' if !in_bracket => return &line[..idx],
            _ => {}
        }
    }
    line
}

fn tokenize_operands(rest: &str) -> Vec<String> {
    rest.split([',', ' ', '\t'])
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(ToString::to_string)
        .collect()
}

fn parse_register(token: &str, line: u32) -> Result<RegisterId, ParseError> {
    let upper = token.trim().to_ascii_uppercase();
    if let Some(rest) = upper.strip_prefix('R') {
        if rest.len() == 1 {
            if let Ok(idx) = rest.parse::<u8>() {
                if idx <= 7 {
                    return Ok(RegisterId(idx));
                }
            }
        }
        if rest.chars().all(|c| c.is_ascii_digit()) && !rest.is_empty() {
            return Err(ParseError {
                code: "INVALID_REGISTER".to_string(),
                line,
                column: 1,
                token: token.to_string(),
                message: format!("Unknown register '{token}'. Valid registers: R0-R7."),
            });
        }
    }
    Err(ParseError {
        code: "INVALID_REGISTER".to_string(),
        line,
        column: 1,
        token: token.to_string(),
        message: format!("Expected register R0-R7, found '{token}'."),
    })
}

fn parse_int_literal(token: &str, line: u32) -> Result<i32, ParseError> {
    let trimmed = token.trim();
    let (neg, body) = if let Some(s) = trimmed.strip_prefix('-') {
        (true, s)
    } else if let Some(s) = trimmed.strip_prefix('+') {
        (false, s)
    } else {
        (false, trimmed)
    };

    let parsed = if let Some(hex) = body.strip_prefix("0x").or_else(|| body.strip_prefix("0X")) {
        i64::from_str_radix(hex, 16).ok()
    } else {
        body.parse::<i64>().ok()
    };

    if let Some(val) = parsed {
        let signed = if neg { -val } else { val };
        if let Ok(v32) = i32::try_from(signed) {
            return Ok(v32);
        }
    }

    Err(ParseError {
        code: "SYNTAX_ERROR".to_string(),
        line,
        column: 1,
        token: token.to_string(),
        message: format!("Invalid 32-bit integer literal '{token}'."),
    })
}

fn is_bracketed(token: &str) -> Option<&str> {
    let t = token.trim();
    t.strip_prefix('[')
        .and_then(|s| s.strip_suffix(']'))
        .map(str::trim)
}

fn is_valid_label_name(name: &str) -> bool {
    !name.is_empty()
        && name.chars().all(|c| c.is_ascii_alphanumeric() || c == '_')
        && !name.chars().next().is_some_and(|c| c.is_ascii_digit())
}

pub fn parse_program(source: &str) -> Result<Program, Vec<ParseError>> {
    let mut errors: Vec<ParseError> = Vec::new();
    let mut labels: HashMap<String, usize> = HashMap::new();
    let mut pending: Vec<PendingInstruction> = Vec::new();

    for (idx, raw_line) in source.lines().enumerate() {
        let line_no = (idx + 1) as u32;
        let clean = strip_comment(raw_line).trim();
        if clean.is_empty() {
            continue;
        }

        let mut remaining = clean;
        while let Some(colon_pos) = remaining.find(':') {
            let candidate = remaining[..colon_pos].trim();
            if candidate.contains(char::is_whitespace) || !is_valid_label_name(candidate) {
                errors.push(ParseError {
                    code: "SYNTAX_ERROR".to_string(),
                    line: line_no,
                    column: 1,
                    token: candidate.to_string(),
                    message: format!("Invalid label identifier '{candidate}'."),
                });
                remaining = "";
                break;
            }
            let key = candidate.to_ascii_uppercase();
            match labels.entry(key) {
                std::collections::hash_map::Entry::Occupied(_) => {
                    errors.push(ParseError {
                        code: "DUPLICATE_LABEL".to_string(),
                        line: line_no,
                        column: 1,
                        token: candidate.to_string(),
                        message: format!("Duplicate label '{candidate}'."),
                    });
                }
                std::collections::hash_map::Entry::Vacant(slot) => {
                    slot.insert(pending.len());
                }
            }
            remaining = remaining[colon_pos + 1..].trim();
            if remaining.is_empty() {
                break;
            }
        }

        if remaining.is_empty() {
            continue;
        }

        let mut split_iter = remaining.splitn(2, |c: char| c.is_whitespace());
        let mnemonic = split_iter.next().unwrap_or("").trim().to_ascii_uppercase();
        let rest = split_iter.next().unwrap_or("");
        let operands = tokenize_operands(rest);

        pending.push(PendingInstruction {
            mnemonic,
            operands,
            source_line: line_no,
            raw_text: remaining.to_string(),
        });
    }

    if pending.len() > MAX_INSTRUCTIONS {
        errors.push(ParseError {
            code: "PROGRAM_TOO_LARGE".to_string(),
            line: pending[MAX_INSTRUCTIONS].source_line,
            column: 1,
            token: String::new(),
            message: format!(
                "Program has {} instructions, exceeding MAX_INSTRUCTIONS ({MAX_INSTRUCTIONS}).",
                pending.len()
            ),
        });
        return Err(errors);
    }

    let mut instructions = Vec::with_capacity(pending.len());
    for item in pending {
        let line = item.source_line;
        let ops = &item.operands;

        let parsed = match item.mnemonic.as_str() {
            "LOAD" => {
                if ops.len() != 2 {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: "LOAD expects 2 operands: LOAD Rd, imm or LOAD Rd, [addr]."
                            .to_string(),
                    })
                } else {
                    match parse_register(&ops[0], line) {
                        Err(e) => Err(e),
                        Ok(rd) => {
                            if let Some(inner) = is_bracketed(&ops[1]) {
                                if inner.to_ascii_uppercase().starts_with('R') {
                                    parse_register(inner, line).map(|rs| Instruction {
                                        opcode: Opcode::LoadMemIndirect,
                                        rd: Some(rd),
                                        ra: Some(rs),
                                        rb: None,
                                        imm: None,
                                        addr: None,
                                        target_pc: None,
                                        source_line: line,
                                        raw_text: item.raw_text.clone(),
                                    })
                                } else {
                                    parse_int_literal(inner, line).map(|addr| Instruction {
                                        opcode: Opcode::LoadMem,
                                        rd: Some(rd),
                                        ra: None,
                                        rb: None,
                                        imm: None,
                                        addr: Some(addr),
                                        target_pc: None,
                                        source_line: line,
                                        raw_text: item.raw_text.clone(),
                                    })
                                }
                            } else {
                                parse_int_literal(&ops[1], line).map(|imm| Instruction {
                                    opcode: Opcode::LoadImm,
                                    rd: Some(rd),
                                    ra: None,
                                    rb: None,
                                    imm: Some(imm),
                                    addr: None,
                                    target_pc: None,
                                    source_line: line,
                                    raw_text: item.raw_text.clone(),
                                })
                            }
                        }
                    }
                }
            }
            "LOADM" => {
                if ops.len() != 2 {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: "LOADM expects 2 operands: LOADM Rd, addr or LOADM Rd, [Rs]."
                            .to_string(),
                    })
                } else {
                    match parse_register(&ops[0], line) {
                        Err(e) => Err(e),
                        Ok(rd) => {
                            let target = is_bracketed(&ops[1]).unwrap_or(&ops[1]);
                            if target.to_ascii_uppercase().starts_with('R') {
                                parse_register(target, line).map(|rs| Instruction {
                                    opcode: Opcode::LoadMemIndirect,
                                    rd: Some(rd),
                                    ra: Some(rs),
                                    rb: None,
                                    imm: None,
                                    addr: None,
                                    target_pc: None,
                                    source_line: line,
                                    raw_text: item.raw_text.clone(),
                                })
                            } else {
                                parse_int_literal(target, line).map(|addr| Instruction {
                                    opcode: Opcode::LoadMem,
                                    rd: Some(rd),
                                    ra: None,
                                    rb: None,
                                    imm: None,
                                    addr: Some(addr),
                                    target_pc: None,
                                    source_line: line,
                                    raw_text: item.raw_text.clone(),
                                })
                            }
                        }
                    }
                }
            }
            "STORE" => {
                if ops.len() != 2 {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: "STORE expects 2 operands: STORE Rs, addr or STORE Rs, [Rd]."
                            .to_string(),
                    })
                } else {
                    match parse_register(&ops[0], line) {
                        Err(e) => Err(e),
                        Ok(rs) => {
                            let target = is_bracketed(&ops[1]).unwrap_or(&ops[1]);
                            if target.to_ascii_uppercase().starts_with('R') {
                                parse_register(target, line).map(|rd_addr| Instruction {
                                    opcode: Opcode::StoreIndirect,
                                    rd: None,
                                    ra: Some(rs),
                                    rb: Some(rd_addr),
                                    imm: None,
                                    addr: None,
                                    target_pc: None,
                                    source_line: line,
                                    raw_text: item.raw_text.clone(),
                                })
                            } else {
                                parse_int_literal(target, line).map(|addr| Instruction {
                                    opcode: Opcode::Store,
                                    rd: None,
                                    ra: Some(rs),
                                    rb: None,
                                    imm: None,
                                    addr: Some(addr),
                                    target_pc: None,
                                    source_line: line,
                                    raw_text: item.raw_text.clone(),
                                })
                            }
                        }
                    }
                }
            }
            "MOV" => {
                if ops.len() != 2 {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: "MOV expects 2 operands: MOV Rd, Rs.".to_string(),
                    })
                } else {
                    parse_register(&ops[0], line).and_then(|rd| {
                        parse_register(&ops[1], line).map(|rs| Instruction {
                            opcode: Opcode::Mov,
                            rd: Some(rd),
                            ra: Some(rs),
                            rb: None,
                            imm: None,
                            addr: None,
                            target_pc: None,
                            source_line: line,
                            raw_text: item.raw_text.clone(),
                        })
                    })
                }
            }
            "ADD" | "SUB" | "MUL" | "AND" | "OR" | "XOR" => {
                if ops.len() != 3 {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: format!(
                            "{} expects 3 register operands: {} Rd, Ra, Rb.",
                            item.mnemonic, item.mnemonic
                        ),
                    })
                } else {
                    let op = match item.mnemonic.as_str() {
                        "ADD" => Opcode::Add,
                        "SUB" => Opcode::Sub,
                        "MUL" => Opcode::Mul,
                        "AND" => Opcode::And,
                        "OR" => Opcode::Or,
                        _ => Opcode::Xor,
                    };
                    parse_register(&ops[0], line).and_then(|rd| {
                        parse_register(&ops[1], line).and_then(|ra| {
                            parse_register(&ops[2], line).map(|rb| Instruction {
                                opcode: op,
                                rd: Some(rd),
                                ra: Some(ra),
                                rb: Some(rb),
                                imm: None,
                                addr: None,
                                target_pc: None,
                                source_line: line,
                                raw_text: item.raw_text.clone(),
                            })
                        })
                    })
                }
            }
            "CMP" => {
                if ops.len() != 2 {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: "CMP expects 2 register operands: CMP Ra, Rb.".to_string(),
                    })
                } else {
                    parse_register(&ops[0], line).and_then(|ra| {
                        parse_register(&ops[1], line).map(|rb| Instruction {
                            opcode: Opcode::Cmp,
                            rd: None,
                            ra: Some(ra),
                            rb: Some(rb),
                            imm: None,
                            addr: None,
                            target_pc: None,
                            source_line: line,
                            raw_text: item.raw_text.clone(),
                        })
                    })
                }
            }
            "JMP" | "JZ" | "BEQ" | "JNZ" | "BNE" => {
                if ops.len() != 1 {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: format!(
                            "{} expects 1 target label or instruction index.",
                            item.mnemonic
                        ),
                    })
                } else {
                    let op = match item.mnemonic.as_str() {
                        "JMP" => Opcode::Jmp,
                        "JZ" | "BEQ" => Opcode::Jz,
                        _ => Opcode::Jnz,
                    };
                    let target_tok = ops[0].trim();
                    let upper_label = target_tok.to_ascii_uppercase();
                    if let Some(&idx) = labels.get(&upper_label) {
                        Ok(Instruction {
                            opcode: op,
                            rd: None,
                            ra: None,
                            rb: None,
                            imm: None,
                            addr: None,
                            target_pc: Some(idx as i32),
                            source_line: line,
                            raw_text: item.raw_text.clone(),
                        })
                    } else if target_tok.starts_with('-')
                        || target_tok
                            .chars()
                            .next()
                            .is_some_and(|c| c.is_ascii_digit())
                    {
                        parse_int_literal(target_tok, line).map(|idx| Instruction {
                            opcode: op,
                            rd: None,
                            ra: None,
                            rb: None,
                            imm: None,
                            addr: None,
                            target_pc: Some(idx),
                            source_line: line,
                            raw_text: item.raw_text.clone(),
                        })
                    } else {
                        Err(ParseError {
                            code: "UNDEFINED_LABEL".to_string(),
                            line,
                            column: 1,
                            token: target_tok.to_string(),
                            message: format!("Undefined jump label '{target_tok}'."),
                        })
                    }
                }
            }
            "NOP" => {
                if !ops.is_empty() {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: "NOP takes no operands.".to_string(),
                    })
                } else {
                    Ok(Instruction {
                        opcode: Opcode::Nop,
                        rd: None,
                        ra: None,
                        rb: None,
                        imm: None,
                        addr: None,
                        target_pc: None,
                        source_line: line,
                        raw_text: item.raw_text.clone(),
                    })
                }
            }
            "HALT" => {
                if !ops.is_empty() {
                    Err(ParseError {
                        code: "SYNTAX_ERROR".to_string(),
                        line,
                        column: 1,
                        token: item.raw_text.clone(),
                        message: "HALT takes no operands.".to_string(),
                    })
                } else {
                    Ok(Instruction {
                        opcode: Opcode::Halt,
                        rd: None,
                        ra: None,
                        rb: None,
                        imm: None,
                        addr: None,
                        target_pc: None,
                        source_line: line,
                        raw_text: item.raw_text.clone(),
                    })
                }
            }
            other => Err(ParseError {
                code: "UNKNOWN_OPCODE".to_string(),
                line,
                column: 1,
                token: other.to_string(),
                message: format!("Unknown instruction mnemonic '{other}'."),
            }),
        };

        match parsed {
            Ok(instr) => instructions.push(instr),
            Err(err) => errors.push(err),
        }
    }

    if errors.is_empty() {
        Ok(Program { instructions })
    } else {
        Err(errors)
    }
}
