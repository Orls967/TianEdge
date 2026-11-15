# Instruction Journey Specification — TIANEDGE

**Document ID:** `TIANEDGE-JRN-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Route:** `/journey`  
**Execution Alignment:** Guided 6-Stage Educational Walkthrough matching `SIMULATION_SPEC.md` (`TIAN-ISA v1`)  

---

## 1. Purpose, Scope & Relationship to CPU Simulator

The **Instruction Journey** (`/journey`) is a curated, interactive, step-by-step architectural walkthrough that teaches learners how a single processor instruction flows through the CPU from instruction fetch to result commit.

### Architectural Alignment Rules

1. **Not a Second Simulator (`C-01`):** `Instruction Journey` does **not** implement an independent CPU execution engine. It presents a deterministic, curated educational storyboard aligned 1:1 with the **6 canonical stages** defined in [SIMULATION_SPEC.md](./SIMULATION_SPEC.md) (`FETCH`, `DECODE`, `REGISTER_READ`, `EXECUTE`, `MEMORY_ACCESS`, `WRITE_BACK`), plus an interactive `"Launch this Program in CPU Simulator"` button that transfers users directly into `/simulator`.
2. **Textbook 5-Stage vs. TIANEDGE 6-Stage Clarity (`ED-01`):** Traditional introductory textbooks (Patterson & Hennessy) commonly condense `Decode` and `Register Read` into a single `ID` stage (`IF -> ID -> EX -> MEM -> WB`). TIANEDGE explicitly isolates **`3. Register Read`** as its own guided stage so learners visually observe `core-instruction-decoder` + `core-control-unit` behavior separately from `mem-register-file` operand retrieval before `EXECUTE`.

### Featured Guided Walkthrough Scenarios

Learners can toggle between two curated Journey scenarios using the exact canonical baseline program:
- **Scenario A (Default — Register Arithmetic):** `ADD R3, R1, R2` (with pre-loaded state `R1 = 10`, `R2 = 20`, `PC = 2`) — demonstrates `FETCH -> DECODE -> REGISTER_READ -> EXECUTE -> MEMORY_ACCESS (Bypassed) -> WRITE_BACK` cleanly.
- **Scenario B (Memory Store Focus):** `STORE R3, 100` (with `R3 = 30`, `PC = 3`) — highlights active **`MEMORY_ACCESS`** (`core-load-store-unit` -> `mem-l1-dcache` -> `comm-memory-interface` -> `MEM[100] = 30`) so Stage 5 is experienced both in its bypassed and active states!

---

## 2. Detailed 6-Stage Specification (10-Point Contract per Stage)

Every stage below defines all **10 required behavioral dimensions**:
`1. Educational Objective`, `2. Technical Explanation`, `3. Active Components`, `4. Data Involved`, `5. State Transitions`, `6. 3D Camera Behavior`, `7. Highlighting Behavior`, `8. Animation Sequence`, `9. User Controls`, `10. Completion Conditions`.

---

### Stage 01 — `FETCH` (Instruction Fetch)

1. **Educational Objective:** Understand how the CPU locates the next instruction in Instruction Memory using the Program Counter (`PC`) and loads it into the Instruction Register (`IR`).
2. **Technical Explanation:** Every instruction cycle begins with the CPU reading the memory address held in `PC`. The core sends this address to the L1 Instruction Cache (`mem-l1-icache`), which retrieves the encoded instruction word (`ADD R3, R1, R2`) and latches it into `IR` so it remains stable while later stages decode and execute it.
3. **Active Components:** `core-registers` (`PC`, `IR`), `mem-l1-icache`, `core-control-unit`, `comm-internal-buses`, `comm-data-paths`.
4. **Data Involved:** Input address `PC = 2`; fetched instruction `IR = "ADD R3, R1, R2"`; asserted control lines `{ MemRead: true, IRWrite: true }`.
5. **State Transitions:** `stage: "FETCH"`, `IR: null -> "ADD R3, R1, R2"`, `clockCycles: +1`. (`PC` advancement to `PC + 1` occurs cleanly at commit/branch boundary).
6. **3D Camera Behavior:** Smooth `650 ms` cubic-out glide to wide front-end framing centering `core-registers` (`PC`), `mem-l1-icache`, and `core-instruction-decoder`.
7. **Highlighting Behavior:** `mem-l1-icache` and `PC`/`IR` slots in `core-registers` illuminate electric cyan (`#00E5FF`); `core-control-unit` glows warm gold (`#FBBF24`); unrelated back-end blocks dim subtly (`opacity: 0.45`).
8. **Animation Sequence:**
   - `0–150 ms`: `core-control-unit` pulses `MemRead` gold filament toward `mem-l1-icache`.
   - `150–450 ms`: Cyan address pulse travels along `pc_to_l1i` from `PC` to `mem-l1-icache`.
   - `450–750 ms`: Instruction packet travels back along `l1i_to_ir` into `IR` latch inside `core-registers`/`core-instruction-decoder`.
9. **User Controls:** `Next Stage (Decode)`, `Auto-Play / Pause`, `Reset Journey`, `Switch Scenario (ADD / STORE)`, `Toggle Auto-Camera`.
10. **Completion Conditions:** `IR` visibly displays `"ADD R3, R1, R2"`, packet animation settles (or skipped cleanly in reduced-motion), and `"Decode"` stage unlocks/advances.

---

### Stage 02 — `DECODE` (Instruction Decode)

1. **Educational Objective:** Understand how raw instruction fields are parsed into an operation code (`opcode`), source/destination register indices, and control unit commands.
2. **Technical Explanation:** Once latched in `IR`, the Instruction Decoder (`core-instruction-decoder`) splits the instruction into its structural fields: operation `ADD`, destination register `R3`, and source operands `R1` and `R2`. Simultaneously, the Control Unit (`core-control-unit`) generates the internal control plan (`ALUOp = ADD`, `RegWrite = 1`, `MemRead = 0`) that steers the rest of the cycle.
3. **Active Components:** `core-instruction-decoder`, `core-control-unit`, `logic-combinational`, `comm-control-signals`.
4. **Data Involved:** Input `IR = "ADD R3, R1, R2"`; decoded output `{ opcode: "ADD", rd: "R3", ra: "R1", rb: "R2" }`; control plan `{ aluOp: "ADD", regWrite: true }`.
5. **State Transitions:** `stage: "DECODE"`, decoded control vector populated in Control Unit state preview, `clockCycles: +1`.
6. **3D Camera Behavior:** Tighter isometric zoom onto `core-instruction-decoder` and `core-control-unit` (`650 ms` transition).
7. **Highlighting Behavior:** `core-instruction-decoder` pulses bright cyan; `core-control-unit` and fanning `comm-control-signals` filaments illuminate warm gold.
8. **Animation Sequence:**
   - `0–250 ms`: Instruction packet flows along `ir_to_decoder` into `core-instruction-decoder`.
   - `250–600 ms`: Decoder emits split field indicators (`opcode -> CU`, `Ra/Rb -> Register File`); gold control filaments extend outward from `core-control-unit`.
9. **User Controls:** `Previous Stage`, `Next Stage (Register Read)`, `Auto-Play / Pause`, `Reset`, direct Stage `1–6` step pills.
10. **Completion Conditions:** Decoded field breakdown (`Opcode`, `Rd`, `Ra`, `Rb`) renders in the Journey telemetry card and animations complete.

---

### Stage 03 — `REGISTER_READ` (Register Read)

1. **Educational Objective:** Observe why microprocessors read source operands from the multi-ported on-core Register File before entering the ALU.
2. **Technical Explanation:** Using the decoded register indices `Ra = R1` and `Rb = R2`, the Register File (`mem-register-file` / `core-registers`) activates two parallel read ports simultaneously within a single cycle—emitting `10` from `R1` and `20` from `R2` onto the dual ALU operand buses (`OpA`, `OpB`). (In Scenario B `STORE R3, 100`, single read port emits `R3 = 30` toward the Load/Store path).
3. **Active Components:** `core-registers`, `mem-register-file`, `comm-data-paths`, `logic-multiplexers`.
4. **Data Involved:** `R1 = 10` (`OpA`), `R2 = 20` (`OpB`) in Scenario A; `R3 = 30` in Scenario B.
5. **State Transitions:** `stage: "REGISTER_READ"`, ALU input latches populated with `OpA = 10`, `OpB = 20`, `clockCycles: +1`.
6. **3D Camera Behavior:** Glides smoothly to frame the bridge between `mem-register-file` (`R0`–`R7` slots) and `core-alu` input ports.
7. **Highlighting Behavior:** Specific register slots `R1` and `R2` glow bright cyan inside `core-registers`; dual operand buses to `core-alu` illuminate.
8. **Animation Sequence:**
   - `0–200 ms`: Read-enable select highlights slot `R1` (`10`) and slot `R2` (`20`) simultaneously.
   - `200–650 ms`: Twin glowing cyan data packets travel in parallel along `regs_to_alu_opA` and `regs_to_alu_opB` arriving at `core-alu` intake terminals.
9. **User Controls:** `Previous Stage`, `Next Stage (Execute)`, `Auto-Play / Pause`, `Reset`, direct Stage jump.
10. **Completion Conditions:** Dual operand badges show `OpA = 10`, `OpB = 20` staged at the ALU boundary.

---

### Stage 04 — `EXECUTE` (ALU Execution)

1. **Educational Objective:** Understand how the Arithmetic Logic Unit computes integer results and evaluates status flags (`Z, N, C, V`).
2. **Technical Explanation:** Commanded by `ALUOp = ADD` from `core-control-unit`, `core-alu` performs 32-bit binary addition (`10 + 20 = 30`) across combinational adder circuits (`logic-adders`) and updates the processor's status `FLAGS` (`Z=0`, `N=0`, `C=0`, `V=0`). For memory/branch instructions (`STORE`/`JMP`), the ALU or execution unit resolves the effective memory address (`100`) or evaluates branch conditions.
3. **Active Components:** `core-alu`, `core-execution-units`, `core-control-unit`, `logic-adders`.
4. **Data Involved:** `OpA = 10`, `OpB = 20`, `ALUOp = ADD` -> `Result = 30`; `FLAGS = { Z: 0, N: 0, C: 0, V: 0 }`.
5. **State Transitions:** `stage: "EXECUTE"`, `aluResult = 30`, `FLAGS` updated, `clockCycles: +1`.
6. **3D Camera Behavior:** Macro isometric focus directly centered on `core-alu` inside `core-execution-units`.
7. **Highlighting Behavior:** `core-alu` illuminates intense electric cyan; `core-control-unit` holds gold `ALUOp` control wire active; `FLAGS` status indicator lights up clearly.
8. **Animation Sequence:**
   - `0–250 ms`: `OpA` (`10`) and `OpB` (`20`) converge inside `core-alu` internal adder core.
   - `250–600 ms`: Internal ripple/compute flash yields computed output `30` at ALU output port and illuminates `FLAGS` telemetry ring.
9. **User Controls:** `Previous Stage`, `Next Stage (Memory Access)`, `Auto-Play / Pause`, `Reset`, `"Inspect ALU Logic"` quick link.
10. **Completion Conditions:** ALU output displays `30` with updated flag summary ready for downstream routing.

---

### Stage 05 — `MEMORY_ACCESS` (Memory Access / Bypass Contrast)

1. **Educational Objective:** Distinguish instructions that access Data Memory (`LOAD [addr]`, `STORE`) from register-only instructions (`ADD`) that bypass memory access cleanly.
2. **Technical Explanation:**
   - **In Scenario A (`ADD R3, R1, R2`):** Arithmetic results live solely in registers, so `MemRead = 0` and `MemWrite = 0`. The Load/Store Unit (`core-load-store-unit`) stays idle (`Stage Bypassed`), passing ALU result `30` straight forward toward `WRITE_BACK`.
   - **In Scenario B (`STORE R3, 100`):** `MemWrite = 1`. The Load/Store Unit latches address `100` into `MAR`, places `30` into `MDR`, and writes `30` through `mem-l1-dcache` / `comm-memory-interface` into `DataMemory[100]`.
3. **Active Components:**
   - Scenario A (Bypassed): `comm-data-paths` bypass trace highlighted softly (`amber/muted`), `core-load-store-unit` dimmed with `"Bypassed"` indicator.
   - Scenario B (Active): `core-load-store-unit`, `mem-l1-dcache`, `comm-memory-interface`, `die-memory-controller`, `mem-main-interface`.
4. **Data Involved:** Scenario A: pass-through `30`. Scenario B: `MAR = 100`, `MDR = 30`, `MEM[100] <- 30`.
5. **State Transitions:** `stage: "MEMORY_ACCESS"`, `stageActive: false` (Scenario A) or `true` + `DataMemory[100] = 30` (Scenario B), `clockCycles: +1`.
6. **3D Camera Behavior:** Pans smoothly outward toward `core-load-store-unit`, `mem-l1-dcache`, and `comm-memory-interface` boundary.
7. **Highlighting Behavior:** Bypass route shown as amber dotted bypass indicator for `ADD`; full active cyan memory pulse + gold `MemWrite` control wire for `STORE`.
8. **Animation Sequence:**
   - Scenario A: Result packet `30` arcs smoothly past `core-load-store-unit` along the ALU-to-Writeback bypass path.
   - Scenario B: Dual packet carries `MAR=100` + `MDR=30` across `lsu_to_l1d` and `l1d_to_mem_if`, updating Data Memory cell `100`.
9. **User Controls:** `Previous Stage`, `Next Stage (Write Back)`, **Quick Toggle (`Compare ADD Bypass vs STORE Write`)**, `Auto-Play / Pause`, `Reset`.
10. **Completion Conditions:** User clearly sees either bypass routing (`ADD`) or `MEM[100] = 30` memory update (`STORE`).

---

### Stage 06 — `WRITE_BACK` (Register Write Back)

1. **Educational Objective:** Understand how the final computed or loaded value commits deterministically back to the destination register and advances `PC`.
2. **Technical Explanation:** During `WRITE_BACK`, `core-control-unit` asserts `RegWrite = 1` (for `ADD R3, R1, R2` or `LOAD`), gating the writeback multiplexer to route `30` into destination slot `R3` of `core-registers` (`mem-register-file`) on the rising clock edge. Once committed, `PC` increments (`PC -> PC + 1`), ready for the next `FETCH`. (For `STORE`, `RegWrite = 0` so `WRITE_BACK` is bypassed while `PC` increments).
3. **Active Components:** `core-registers`, `mem-register-file`, `comm-data-paths`, `core-control-unit`, `logic-flip-flops`.
4. **Data Involved:** `Rd = R3`, `writeData = 30`, `RegWrite = true`, `PC: 2 -> 3` (Scenario A).
5. **State Transitions:** `stage: "WRITE_BACK"`, `R3: 0 -> 30`, `PC: 2 -> 3`, `clockCycles: +1` -> Instruction cycle complete!
6. **3D Camera Behavior:** Pans cleanly back to `core-registers` (`mem-register-file`), framing destination slot `R3` and `PC`.
7. **Highlighting Behavior:** Writeback path glows bright cyan; destination slot `R3` flashes warm gold then settles to active updated cyan; `core-control-unit` asserts `RegWrite` gold wire.
8. **Animation Sequence:**
   - `0–350 ms`: Result packet `30` traverses `alu_to_wb_regs` back into `core-registers`.
   - `350–650 ms`: Register cell `R3` pulses gold as `30` latches on simulated clock edge, and `PC` increments visibly (`2 -> 3`).
9. **User Controls:** `Previous Stage`, `Replay Journey (Reset)`, **`"Run Full Program in CPU Simulator"`** primary CTA (`/simulator?preset=canonical`).
10. **Completion Conditions:** `R3 = 30` and `PC = 3` committed cleanly; completion summary banner invites transition to `/simulator` for hands-on experimentation.

---

## 3. Cross-Document References

- Primary Simulator Engine & `TIAN-ISA v1`: [SIMULATION_SPEC.md](./SIMULATION_SPEC.md)
- Guided Camera & Signal Animation Rules: [ANIMATION_SPEC.md](./ANIMATION_SPEC.md)
- Component Specifications: [CHIP_ANATOMY_SPEC.md](./CHIP_ANATOMY_SPEC.md)
- UI Layout & Controls: [DESIGN.md](./DESIGN.md)
