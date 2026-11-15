# Primary CPU Simulation Specification (`TIAN-ISA v1`) — TIANEDGE

**Document ID:** `TIANEDGE-SIM-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Engine Ownership:** Rust (`crates/tianedge-cpu`) compiled to WebAssembly (`wasm32-unknown-unknown`) inside Web Worker (`cpu-worker.ts`)  

---

## 1. Purpose, Scope & Architectural Boundaries

This specification defines the **single primary simulator** in **TIANEDGE**: the deterministic **CPU Instruction Execution Simulator** (`/simulator`).

### Scope Boundaries

- **Educational Purpose:** Demonstrate how a processor fetches instructions, decodes opcodes/operands, reads registers, computes arithmetic/logic results in the ALU, accesses data memory, and writes results back across deterministic clock cycles.
- **No Commercial ISA Equivalence Claims:** `TIAN-ISA v1` is an original, explicitly documented educational assembly language and CPU architecture. It does **not** claim binary, timing, or microarchitectural compatibility with Intel x86/x86-64, ARMv8/v9, or RISC-V RV32I/RV64I.
- **No Transistor/Electrical Simulation:** Execution operates strictly at the architectural register-transfer / functional-stage level.
- **Offline Execution Guarantee (`C-04`):** Zero dependency on Python/FastAPI; executes 100% locally in the browser via Rust/WASM inside a Web Worker.

---

## 2. Educational CPU Model (`TIAN-ISA v1` Architecture)

### 2.1 Sequential Multi-Stage vs. Hardware Pipelining Clarification

TIANEDGE's simulator implements a **deterministic, non-pipelined sequential multi-stage execution model**:

- **1 instruction executes at a time** across **6 sequential stages**:
  `FETCH` -> `DECODE` -> `REGISTER_READ` -> `EXECUTE` -> `MEMORY_ACCESS` -> `WRITE_BACK`
- Each stage consumes exactly **1 simulated clock cycle** (6 simulated cycles per instruction, so sequential `CPI = 6` and `IPC = 1/6`).
- **Why not overlap instructions in the simulator?** Overlapping 5–6 instructions concurrently on one 3D core causes overlapping highlights across Decoder, ALU, and Memory simultaneously, making introductory datapath tracing visually ambiguous. Hardware pipelining (`CPI -> 1`, hazards, forwarding) is thoroughly taught in `Engineering Insights` (`cpu-pipelining`) with explicit comparison back to this sequential model.

### 2.2 Modified Harvard Educational Memory Architecture

To protect beginners from accidentally overwriting instruction memory with data writes (such as `STORE R3, 100`), `TIAN-ISA v1` uses a clean **Modified Harvard** educational memory space:

| Address Space | Organization | Address Range | Element Type | Purpose |
|---|---|---|---|---|
| **Instruction Memory** | Separate word-indexed program buffer | `0..255` (`256` slots) | Decoded `Instruction` + source line | Stores loaded program; indexed by `PC` (`PC` increments by `+1` per instruction). |
| **Data Memory** | Flat word-addressed integer RAM | `0..255` (`256` words) | Signed 32-bit integer (`i32`), default `0` | Read/written via `LOAD [addr]` / `LOADM` and `STORE`. Address `100` in `STORE R3, 100` is directly valid! |

### 2.3 Architectural & Internal Registers

| Register | Width / Type | Initial Value | Role |
|---|---|---|---|
| `R0` – `R7` | 8 × `i32` (32-bit signed) | `0` (all general-purpose, `R0` writable) | General-purpose operand & result storage (`core-registers` / `mem-register-file`). |
| `PC` | `u16` (`0..256`) | `0` | Program Counter pointing to next instruction index in Instruction Memory. |
| `IR` | `Option<DecodedIr>` | `None` | Instruction Register holding the currently fetched instruction mnemonic + operands. |
| `MAR` | `Option<u16>` | `None` | Memory Address Register latching target Data Memory index (`0..255`) during `MEMORY_ACCESS`. |
| `MDR` | `Option<i32>` | `None` | Memory Data Register buffering data word read from or written to `DataMemory[MAR]`. |
| `FLAGS` | 4 booleans (`Z, N, C, V`) | all `false` | ALU status flags updated by arithmetic/logic/compare instructions (`Zero`, `Negative`, `Unsigned Carry/Borrow`, `Signed Overflow`). |

---

## 3. `TIAN-ISA v1` Instruction Set Specification

### 3.1 Lexical & Syntax Rules

- Case-insensitive mnemonics and register identifiers (`LOAD R1, 10` === `load r1, 10`).
- Optional line comments starting with `;` or `#`.
- Optional symbolic labels ending in `:` (e.g., `LOOP:`), resolving to instruction index (`0..255`).
- Signed decimal integers (`10`, `-5`) or hexadecimal literals (`0x64`) supported for immediate values and memory addresses.
- Whitespace and commas optional or standard comma-separated operands (`ADD R3, R1, R2`).
- Maximum source program length: `256` instructions (`MAX_INSTRUCTIONS = 256`).

### 3.2 Complete Supported Instruction Catalog (16 Mnemonics)

| Mnemonic & Syntax | Semantics | `FLAGS` Updated? | Stage Activity (`F` / `D` / `RR` / `EX` / `MEM` / `WB`) |
|---|---|---|---|
| `LOAD Rd, imm` | `Rd <- imm` (immediate literal load, e.g., `LOAD R1, 10`) | No | `F:A`, `D:A`, `RR:B`, `EX:A(pass imm)`, `MEM:B`, `WB:A(Rd)` |
| `LOAD Rd, [addr]` or `LOADM Rd, addr` | `Rd <- DataMemory[addr]` (`addr` literal `0..255` or indirect `[Rs]`) | No | `F:A`, `D:A`, `RR:A(if [Rs])`, `EX:A(addr)`, `MEM:A(read)`, `WB:A(Rd)` |
| `STORE Rs, addr` (or `STORE Rs, [addr]` / `[Rd]`) | `DataMemory[addr] <- Rs` (e.g., `STORE R3, 100`) | No | `F:A`, `D:A`, `RR:A(Rs)`, `EX:A(addr)`, `MEM:A(write)`, `WB:B` |
| `MOV Rd, Rs` | `Rd <- Rs` | No | `F:A`, `D:A`, `RR:A(Rs)`, `EX:A(pass)`, `MEM:B`, `WB:A(Rd)` |
| `ADD Rd, Ra, Rb` | `Rd <- Ra.wrapping_add(Rb)` | Yes (`Z,N,C,V`) | `F:A`, `D:A`, `RR:A(Ra,Rb)`, `EX:A(ADD)`, `MEM:B`, `WB:A(Rd)` |
| `SUB Rd, Ra, Rb` | `Rd <- Ra.wrapping_sub(Rb)` | Yes (`Z,N,C,V`) | `F:A`, `D:A`, `RR:A(Ra,Rb)`, `EX:A(SUB)`, `MEM:B`, `WB:A(Rd)` |
| `MUL Rd, Ra, Rb` | `Rd <- Ra.wrapping_mul(Rb)` | Yes (`Z,N,V`, `C=0`) | `F:A`, `D:A`, `RR:A(Ra,Rb)`, `EX:A(MUL)`, `MEM:B`, `WB:A(Rd)` |
| `AND Rd, Ra, Rb` | `Rd <- Ra & Rb` | Yes (`Z,N`, `C=0,V=0`) | `F:A`, `D:A`, `RR:A(Ra,Rb)`, `EX:A(AND)`, `MEM:B`, `WB:A(Rd)` |
| `OR Rd, Ra, Rb` | `Rd <- Ra \| Rb` | Yes (`Z,N`, `C=0,V=0`) | `F:A`, `D:A`, `RR:A(Ra,Rb)`, `EX:A(OR)`, `MEM:B`, `WB:A(Rd)` |
| `XOR Rd, Ra, Rb` | `Rd <- Ra ^ Rb` | Yes (`Z,N`, `C=0,V=0`) | `F:A`, `D:A`, `RR:A(Ra,Rb)`, `EX:A(XOR)`, `MEM:B`, `WB:A(Rd)` |
| `CMP Ra, Rb` | Computes `Ra - Rb`, discards value, updates flags | Yes (`Z,N,C,V`) | `F:A`, `D:A`, `RR:A(Ra,Rb)`, `EX:A(SUB/CMP)`, `MEM:B`, `WB:B` |
| `JMP target` | `PC <- target_idx` (label or `0..255`) | No | `F:A`, `D:A`, `RR:B`, `EX:A(set PC)`, `MEM:B`, `WB:B` |
| `JZ target` (alias `BEQ`) | If `FLAGS.Z == true`, `PC <- target_idx`; else `PC += 1` | No | `F:A`, `D:A`, `RR:B`, `EX:A(eval Z)`, `MEM:B`, `WB:B` |
| `JNZ target` (alias `BNE`) | If `FLAGS.Z == false`, `PC <- target_idx`; else `PC += 1` | No | `F:A`, `D:A`, `RR:B`, `EX:A(eval !Z)`, `MEM:B`, `WB:B` |
| `NOP` | No register/memory mutation; `PC += 1` | No | `F:A`, `D:A`, `RR:B`, `EX:B`, `MEM:B`, `WB:B` |
| `HALT` | Enters `ExecutionStatus::Halted` cleanly | No | `F:A`, `D:A`, `RR:B`, `EX:A(halt)`, `MEM:B`, `WB:B` |

*Legend:* `A` = Active stage (`stageActive: true`), `B` = Bypassed pass-through stage (`stageActive: false`, still consumes 1 uniform clock step so 6-stage visualization stays aligned, with UI clearly showing `"Stage Bypassed"` badge).

### 3.3 `PC` Advancement & End-of-Program Behavior

- During `FETCH`, `IR` loads `InstructionMemory[PC]`.
- At completion of `WRITE_BACK` (unless a taken `JMP`/`JZ`/`JNZ` already updated `PC` during `EXECUTE`, or `HALT` transitioned status to `Halted`), `PC` increments to `PC + 1`.
- If `PC >= program.len()` at the beginning of a subsequent `FETCH` (user omitted explicit `HALT`), the engine cleanly transitions to `ExecutionStatus::Halted` with `haltReason: "END_OF_PROGRAM"`.

### 3.4 Flag Semantics (32-bit Two's Complement)

- `Z` (Zero): `result == 0`
- `N` (Negative): `(result as i32) < 0` (MSB bit 31 == `1`)
- `C` (Carry / Borrow): For `ADD`, true if unsigned `(a as u32) + (b as u32)` overflows `u32::MAX`; for `SUB`/`CMP`, true if unsigned `(a as u32) >= (b as u32)` (no borrow).
- `V` (Signed Overflow): True if `i32::checked_add` / `checked_sub` / `checked_mul` overflows signed 32-bit range `[-2^31, 2^31 - 1]` (computed value uses deterministic `wrapping_*`).

---

## 4. Deterministic Execution Trace: Canonical Baseline Program

Given the exact prompt specification program:

```asm
LOAD R1, 10
LOAD R2, 20
ADD R3, R1, R2
STORE R3, 100
```

| Cycles | Instruction (`PC`) | Stage-by-Stage Deterministic State Mutations |
|---|---|---|
| **1 – 6** | `LOAD R1, 10` (`PC=0`) | `C1(FETCH)`: `IR="LOAD R1, 10"`. `C2(DECODE)`: `opcode=LOAD_IMM, Rd=R1, imm=10`. `C3(RR)`: bypassed. `C4(EX)`: pass immediate `10`. `C5(MEM)`: bypassed. `C6(WB)`: `R1 <- 10`, `PC <- 1`. |
| **7 – 12** | `LOAD R2, 20` (`PC=1`) | `C7(FETCH)`: `IR="LOAD R2, 20"`. `C8(DECODE)`: `Rd=R2, imm=20`. `C9(RR)`: bypassed. `C10(EX)`: pass `20`. `C11(MEM)`: bypassed. `C12(WB)`: `R2 <- 20`, `PC <- 2`. |
| **13 – 18** | `ADD R3, R1, R2` (`PC=2`) | `C13(FETCH)`: `IR="ADD R3, R1, R2"`. `C14(DECODE)`: `opcode=ADD, Rd=R3, Ra=R1, Rb=R2`. `C15(RR)`: read `OpA=10, OpB=20`. `C16(EX)`: ALU `10 + 20 = 30`, `FLAGS={Z:0,N:0,C:0,V:0}`. `C17(MEM)`: bypassed. `C18(WB)`: `R3 <- 30`, `PC <- 3`. |
| **19 – 24** | `STORE R3, 100` (`PC=3`) | `C19(FETCH)`: `IR="STORE R3, 100"`. `C20(DECODE)`: `opcode=STORE, Rs=R3, addr=100`. `C21(RR)`: read `R3=30`. `C22(EX)`: effective address `100`. `C23(MEM)`: `MAR=100, MDR=30`, `MEM[100] <- 30`. `C24(WB)`: bypassed, `PC <- 4` -> Next tick enters `HALTED` (`END_OF_PROGRAM`). |

**Final Guaranteed Snapshot:** `R1 = 10`, `R2 = 20`, `R3 = 30`, `MEM[100] = 30`, `PC = 4`, `clockCycles = 24`, `status = "halted"`.

---

## 5. Error Handling & Safety Guards

| Error Category | Trigger Condition | Structured Error Code | Engine Behavior |
|---|---|---|---|
| **Syntax / Parse Errors** | Unknown mnemonic, invalid register (`R8`), missing operand, duplicate label, undefined jump label, program > 256 lines | `UNKNOWN_OPCODE`, `INVALID_REGISTER`, `SYNTAX_ERROR`, `UNDEFINED_LABEL`, `PROGRAM_TOO_LARGE` | Program rejected prior to execution; returns `Vec<ParseError>` with exact `line` (1-indexed), `column`, and human remediation message. |
| **Memory Bounds Fault** | `LOAD [addr]` / `STORE Rs, addr` evaluates `addr < 0` or `addr >= 256` | `MEMORY_OUT_OF_BOUNDS` | Halts cleanly at `MEMORY_ACCESS` stage; sets `status = "fault"`, leaves memory untouched. |
| **Jump Target Fault** | `JMP` / `JZ` / `JNZ` targets instruction index outside `0..program.len()` | `INVALID_JUMP_TARGET` | Halts cleanly at `EXECUTE` stage with `status = "fault"`. |
| **Cycle Watchdog Guard** | Infinite loop exceeds `MAX_CYCLES_PER_RUN` (`10,000` cycles) during continuous `Run` | `CYCLE_LIMIT_REACHED` | Pauses cleanly in `status = "paused"` with informative warning so browser thread never hangs; user may `Step` or `Reset`. |

---

## 6. Rust Engine Architecture & WASM / Worker Interface

### 6.1 Crate Module Layout (`crates/tianedge-cpu/`)

```text
crates/tianedge-cpu/
├── Cargo.toml           # serde, serde_json, wasm-bindgen; zero DOM/network deps
└── src/
    ├── lib.rs           # wasm_bindgen exports wrapping CpuEngine handle
    ├── isa.rs           # Instruction, Opcode, RegisterId, Operand enums
    ├── parser.rs        # Tokenizer, label pass, syntax/bounds parser -> Result<Program, Vec<ParseError>>
    ├── alu.rs           # Pure 32-bit ALU arithmetic/bitwise ops & Z/N/C/V flag math
    ├── cpu.rs           # CpuEngine state machine (6-stage stepping, Memory, Registers)
    └── snapshot.rs      # CpuSnapshot, activeComponentIds, activePaths, controlSignals projection
```

### 6.2 `wasm-bindgen` Exported API

```rust
#[wasm_bindgen]
pub struct WasmCpuHandle {
    engine: CpuEngine,
}

#[wasm_bindgen]
impl WasmCpuHandle {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self;

    /// Returns JSON-serialized LoadResult { ok, snapshot?, errors? }
    pub fn load_program(&mut self, source: &str) -> String;

    /// Advances exactly 1 canonical stage (1 simulated cycle); returns JSON CpuSnapshot
    pub fn step_stage(&mut self) -> String;

    /// Advances until current instruction completes WRITE_BACK (or faults/halts); returns JSON CpuSnapshot
    pub fn step_instruction(&mut self) -> String;

    /// Advances N stages in a tight Rust loop (used by high-speed Worker bursts); returns final JSON CpuSnapshot
    pub fn step_many(&mut self, max_steps: u32) -> String;

    /// Resets PC, registers, memory, flags, and cycles while keeping loaded program
    pub fn reset(&mut self) -> String;

    /// Injects initial data memory value before or between runs (addr 0..255)
    pub fn set_memory_word(&mut self, addr: u16, value: i32) -> String;

    /// Returns current snapshot JSON without advancing state
    pub fn get_snapshot(&self) -> String;
}
```

### 6.3 Stage-to-3D Mapping Output inside `CpuSnapshot`

Every `CpuSnapshot` emitted by Rust directly populates:
- `stage`: `"FETCH" | "DECODE" | "REGISTER_READ" | "EXECUTE" | "MEMORY_ACCESS" | "WRITE_BACK"`
- `stageActive`: `boolean` (whether current instruction actively performs work or bypasses this stage)
- `activeComponentIds`: canonical component IDs (e.g., `["core-alu", "core-execution-units", "core-control-unit"]`)
- `controlSignals`: `{ pcWrite, irWrite, regWrite, memRead, memWrite, aluOp, branchTaken }`
- `activePaths`: array of canonical `DataPathEdgeId` strings used by `ANIMATION_SPEC.md` and `DESIGN.md` to drive exact cyan/gold 3D signal packets.

### 6.4 User Controls & Presets

- **Controls:** `Run`, `Pause`, `Step Stage` (1 stage = 1 cycle), `Step Instruction` (completes instruction), `Reset`, `Execution Speed` (`50 ms` to `1,500 ms` per stage + `"Instant/Fast"` throttled batch mode), `Preset Selector`.
- **Built-in Verified Presets:**
  1. **Basic Arithmetic & Memory Store (Canonical):** `LOAD R1, 10 / LOAD R2, 20 / ADD R3, R1, R2 / STORE R3, 100`
  2. **Memory Round-Trip (`LOADM` & `SUB`):** Stores value, reloads via `LOAD R4, [100]`, subtracts, tests `Z/N` flags.
  3. **Countdown Loop (`CMP` & `JNZ`):** Demonstrates conditional branching, `PC` jumps, and clock-cycle accumulation.
  4. **Bitwise Masking (`AND`/`OR`/`XOR`):** Demonstrates logic unit flags and binary operations.

---

## 7. Independent Testability Matrix

- **Rust Native Tests (`cargo test`):** Executes 100% outside any browser/WASM runtime; covers parser diagnostics, all 16 opcodes, wrapping + flag math, memory bounds, label jumping, and exact 24-cycle trace of the canonical 4-line program.
- **Worker / WASM Integration Tests:** Verifies `.wasm` loads inside `cpu-worker.ts`, handles rapid `Run`/`Pause`/`Reset`, and preserves bit-exact parity with native Rust tests.

---

## 8. Cross-Document References

- Walkthrough Alignment: [INSTRUCTION_JOURNEY_SPEC.md](./INSTRUCTION_JOURNEY_SPEC.md)
- Canonical Data Types: [DATA_MODEL.md](./DATA_MODEL.md)
- Stage Animation Synchronization: [ANIMATION_SPEC.md](./ANIMATION_SPEC.md)
- System Layer Boundaries: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Testing Requirements: [TEST_PLAN.md](./TEST_PLAN.md)
