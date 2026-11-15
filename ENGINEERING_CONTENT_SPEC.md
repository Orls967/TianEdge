# Engineering Insights & Technical Library Specification — TIANEDGE

**Document ID:** `TIANEDGE-CONT-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Routes Covered:** `/insights` (`Engineering Insights`) & `/library` (`Technical Library`)  

---

## 1. Purpose and Scope

This document defines the content architecture, pedagogical structure, cross-component integration rules, equation rigor, and source-attribution requirements for **TIANEDGE**'s deeper educational modules:

- **Part A — Engineering Insights (`/insights`):** 13 structured computer architecture and semiconductor engineering deep dives connecting theory directly to interactive 3D `Chip Anatomy` components and `CPU Simulator` behaviors.
- **Part B — Technical Library (`/library`):** A searchable reference knowledge base spanning 7 structured modules (`Component Encyclopedia`, `Engineering Glossary`, `Semiconductor Fundamentals`, `CPU Architecture References`, `Technical Diagrams`, `Formulas & Equations`, and `Learning Paths`).

**Accuracy & Attribution Rule (`C-10`, `C-14`):** All architectural concepts clearly differentiate **general computer architecture principles** from **vendor-specific commercial microarchitecture choices**. All citations reference genuine, verifiable textbooks and standards; fabricated sources or speculative claims are strictly forbidden.

---

## 2. Part A — Engineering Insights (`/insights` — 13 Canonical Topics)

Every insight topic strictly specifies 7 required fields:
`1. Learning Objective`, `2. Technical Definition`, `3. Engineering Explanation`, `4. Relevant 3D Components`, `5. Diagram / Visual Requirements`, `6. Relationship to CPU Simulator`, `7. Further Reading`.

---

### Topic 01 — `von-neumann-architecture` (Von Neumann Architecture)
1. **Learning Objective:** Understand the stored-program concept where instructions and data share a unified memory space and bus, and diagnose the resulting *Von Neumann Bottleneck*.
2. **Technical Definition:** A stored-program computer architecture (formalized in the 1945 EDVAC draft report) consisting of a Processing Unit (`core-alu`, `core-registers`), Control Unit (`core-control-unit`), unified Memory storing both instructions and data, and I/O interfaces (`die-io-controller`).
3. **Engineering Explanation:** Because instructions and program data reside in the same addressable RAM and traverse the same memory bus (`comm-internal-buses`, `comm-memory-interface`), the CPU cannot fetch an instruction word and read/write a data operand across that unified bus in the same clock cycle without arbitration or caching. In modern CPUs, external DRAM remains unified Von Neumann storage, while on-die caches apply Modified Harvard splits (`mem-l1-icache` / `mem-l1-dcache`) to relieve this bottleneck.
4. **Relevant 3D Components:** `core-control-unit`, `core-alu`, `core-registers`, `comm-internal-buses`, `comm-memory-interface`, `mem-main-interface`, `die-io-controller`.
5. **Diagram / Visual Requirements:** Interactive 2D/3D comparison block diagram highlighting single shared Instruction+Data bus contention; `"Inspect Shared Memory Interface"` button opening `comm-memory-interface`.
6. **Relationship to CPU Simulator:** Explains why `TIAN-ISA v1` separates Instruction Memory and Data Memory (preventing beginners from overwriting instructions via `STORE R3, 100`) vs. true Von Neumann unified RAM where code itself is mutable data.
7. **Further Reading:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 1); von Neumann, J. (*First Draft of a Report on the EDVAC*, 1945); Bryant & O'Hallaron (*CS:APP*, Ch. 1).

---

### Topic 02 — `harvard-architecture` (Harvard & Modified Harvard Architecture)
1. **Learning Objective:** Explain why separating instruction and data pathways doubles front-end fetch/data concurrency and how modern CPUs adopt Modified Harvard L1 caches.
2. **Technical Definition:** A computer architecture featuring physically or logically separate storage memories and signal buses for instructions versus data (`Instruction Memory` vs. `Data Memory`), enabling simultaneous instruction fetch and data access.
3. **Engineering Explanation:** Pure Harvard designs (common in DSPs and microcontrollers) prevent accidental code corruption and double memory bandwidth by reading instructions on Bus A while reading/writing operands on Bus B. General-purpose desktop/server CPUs adopt a **Modified Harvard** hierarchy: unified DRAM + L3/L2 (`mem-l2-cache`, `mem-l3-cache`) feed **split L1 caches** (`mem-l1-icache` for fetch, `mem-l1-dcache` for load/store), delivering simultaneous fetch+load concurrency every cycle without sacrificing programmable flexibility.
4. **Relevant 3D Components:** `mem-l1-icache`, `mem-l1-dcache`, `mem-l2-cache`, `core-instruction-decoder`, `core-load-store-unit`, `comm-data-paths`.
5. **Diagram / Visual Requirements:** Dual-pathway schematic contrasting split L1i/L1d feeding `core-instruction-decoder` vs. `core-load-store-unit`; `"Highlight Split L1 Caches in 3D"` triggers `Internal Architecture` isolation on `mem-l1-icache` + `mem-l1-dcache`.
6. **Relationship to CPU Simulator:** Directly explains `TIAN-ISA v1`'s Modified Harvard memory model (`InstructionMemory[0..255]` indexed by `PC` vs. `DataMemory[0..255]` accessed by `LOAD [addr]`/`STORE`).
7. **Further Reading:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 5); Hennessy & Patterson (*Computer Architecture*, Ch. 2).

---

### Topic 03 — `risc-vs-cisc` (RISC and CISC Design Philosophies)
1. **Learning Objective:** Compare Reduced Instruction Set Computer (RISC) and Complex Instruction Set Computer (CISC) trade-offs in decoding complexity, code density, and micro-op translation.
2. **Technical Definition:** Two contrasting ISA philosophies: **RISC** favors fixed-width, regular-format, load-store instructions executing in simple cycles, whereas **CISC** favors variable-length, memory-capable multi-step instructions maximizing code compactness.
3. **Engineering Explanation:** Historically, CISC minimized assembly instruction count when RAM was scarce, requiring complex microcode sequencers (`core-control-unit`) and multi-byte decoders (`core-instruction-decoder`). RISC emphasized uniform register-to-register ALU instructions (`ADD Rd, Ra, Rb`) with explicit `LOAD`/`STORE` memory separation (`core-load-store-unit`), simplifying pipelining. Modern commercial CISC processors (e.g., x86-64) bridge this gap internally by decoding variable-length instructions into fixed-format internal micro-operations (`uops`), whereas RISC architectures (e.g., ARM, RISC-V) remain load-store at the ISA boundary while incorporating rich SIMD/fusion extensions.
4. **Relevant 3D Components:** `core-instruction-decoder`, `core-control-unit`, `core-load-store-unit`, `core-alu`, `core-registers`.
5. **Diagram / Visual Requirements:** Side-by-side decoder complexity comparison (Fixed-width RISC direct decode vs. CISC predecode -> decode -> uop translation).
6. **Relationship to CPU Simulator:** `TIAN-ISA v1` models a clean **RISC-inspired load-store style** for arithmetic (`ADD R3, R1, R2` operates solely on registers, while `STORE`/`LOAD [addr]` explicitly touch memory), keeping decode visuals transparent.
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Appendix A & Ch. 1); Patterson & Ditzel (*The Case for the Reduced Instruction Set Computer*, 1980).

---

### Topic 04 — `isa` (Instruction Set Architecture)
1. **Learning Objective:** Distinguish the Instruction Set Architecture (hardware/software contract) from physical microarchitecture (implementation).
2. **Technical Definition:** The formal programmer-visible specification defining supported opcodes, data types, architectural registers, memory addressing modes, status flags, and exception semantics.
3. **Engineering Explanation:** The ISA forms the abstraction boundary decoupling compiler/software ecosystems from evolving silicon designs. Two chips implementing the same ISA can exhibit vastly different microarchitectures (`core-execution-units`, cache sizes, pipeline depth, out-of-order widths) yet execute identical binaries. Microarchitectural techniques such as register renaming map small architectural register sets (`R0`–`R7` conceptually) onto much larger physical SRAM files inside real silicon.
4. **Relevant 3D Components:** `core-instruction-decoder`, `core-registers`, `core-alu`, `core-control-unit`, `mem-register-file`.
5. **Diagram / Visual Requirements:** Layered computer abstraction stack diagram (`Software -> Compiler -> ISA Contract -> Microarchitecture -> Digital Logic -> Transistors`).
6. **Relationship to CPU Simulator:** `CPU Simulator` implements `TIAN-ISA v1` explicitly; `"Explore ISA Syntax"` links straight to the simulator preset table.
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Ch. 1 & Appendix A); Harris & Harris (Ch. 6 Architecture).

---

### Topic 05 — `cpu-pipelining` (CPU Pipelining & Hazards)
1. **Learning Objective:** Understand how overlapping instruction stages raises throughput (`IPC -> 1`) without reducing single-instruction latency, and identify structural, data, and control hazards.
2. **Technical Definition:** A temporal parallelization technique that divides instruction processing into independent clocked stages separated by pipeline registers (`logic-flip-flops`), allowing multiple instructions to occupy successive stages simultaneously.
3. **Engineering Explanation:** Instead of waiting 6 cycles before starting Instruction 2, a 5- or 6-stage hardware pipeline starts Instruction 2 on Cycle 2 while Instruction 1 moves into Decode. Ideal speedup scales with pipeline depth $k$, limited by latch overhead, clock skew (`comm-clock-distribution`), and three hazards: **Structural hazards** (resource contention, solved by splitting L1i/L1d), **Data hazards** (RAW dependency like `ADD R3, R1, R2` followed immediately by `STORE R3, 100`, solved via forwarding/bypass paths or pipeline stalls), and **Control hazards** (branches altering `PC`).
4. **Relevant 3D Components:** `core-instruction-decoder`, `core-registers`, `core-alu`, `core-load-store-unit`, `logic-flip-flops`, `comm-clock-distribution`, `comm-data-paths`.
5. **Diagram / Visual Requirements:** Classic multi-cycle pipeline Gantt grid contrasting **Sequential (`TIAN-ISA v1` Simulator, 1 instr per 6 cycles)** vs. **Pipelined Overlap (1 instr/cycle steady state)** + forwarding path arrows.
6. **Relationship to CPU Simulator:** Directly explains why TIANEDGE's simulator uses sequential stage stepping (`CPI = 6`) for single-instruction clarity (`ED-02`) while illustrating the RAW dependency present in `ADD R3, R1, R2 -> STORE R3, 100`.
7. **Further Reading:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 4.5–4.8); Hennessy & Patterson (Appendix C).

---

### Topic 06 — `branch-prediction` (Branch Prediction & Speculation)
1. **Learning Objective:** Explain why conditional branches (`JZ`, `JNZ`) threaten deep pipelines and how hardware predictors minimize flush penalties.
2. **Technical Definition:** Hardware front-end mechanisms (Branch Target Buffers, dynamic 2-bit saturating counters, TAGE/perceptron history predictors) that predict branch direction and target address before execution resolves `FLAGS`.
3. **Engineering Explanation:** In deep pipelines (10–20+ stages in commercial cores), waiting until `EXECUTE` to know whether `JNZ LOOP` jumps wastes dozens of execution slots per branch. Branch predictors guess taken/not-taken during `FETCH` and speculatively execute down the predicted path; on misprediction, uncommitted instructions are flushed and `PC` redirects to the true target.
4. **Relevant 3D Components:** `core-control-unit`, `mem-l1-icache`, `core-instruction-decoder`, `core-registers` (`PC`, `FLAGS`), `logic-sequential`.
5. **Diagram / Visual Requirements:** 2-bit saturating counter state machine diagram (`Strongly Taken <-> Weakly Taken <-> Weakly Not Taken <-> Strongly Not Taken`) + pipeline flush penalty visual.
6. **Relationship to CPU Simulator:** Connects directly to Preset 3 (`Countdown Loop` using `CMP` + `JNZ`), showing how `FLAGS.Z` determines `PC` redirection inside `EXECUTE`.
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Ch. 3.3 & 3.9); Smith, J. E. (*A Study of Branch Prediction Strategies*, ISCA 1981).

---

### Topic 07 — `cache-hierarchy` (Cache Hierarchy & Locality)
1. **Learning Objective:** Analyze why CPUs combine small fast SRAM (`Register File -> L1 -> L2 -> L3`) with large slower DRAM using temporal and spatial locality.
2. **Technical Definition:** A multi-level memory pyramid trading capacity for ultra-low access latency and energy efficiency, parameterized by Average Memory Access Time (AMAT).
3. **Engineering Explanation:** Because transistor speed scaled far faster than off-die DRAM latency (*Memory Wall*), a single main memory access costs hundreds of processor cycles. Caching keeps recently used values (**temporal locality**) and adjacent memory words (**spatial locality**, fetched in cache lines) close to `core-alu` in SRAM (`mem-l1-icache`, `mem-l1-dcache`, `mem-l2-cache`, `mem-l3-cache`).
4. **Relevant 3D Components:** `mem-register-file`, `mem-l1-icache`, `mem-l1-dcache`, `mem-l2-cache`, `mem-l3-cache`, `die-cache-regions`, `die-memory-controller`, `mem-main-interface`.
5. **Diagram / Visual Requirements:** Memory Hierarchy Pyramid (Width = Capacity, Vertical Height = Speed/Cost-per-bit) + `"Isolate Cache Hierarchy in 3D"` trigger.
6. **Relationship to CPU Simulator:** Connects L1i (`FETCH`), L1d (`MEMORY_ACCESS`), and Register File (`REGISTER_READ` / `WRITE_BACK`) roles observed during `LOAD`/`STORE` execution.
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Ch. 2); Bryant & O'Hallaron (*CS:APP*, Ch. 6).

---

### Topic 08 — `clock-frequency` (Clock Frequency & Timing Closure)
1. **Learning Objective:** Understand what determines a processor's maximum clock frequency ($f_{max}$) and why clock speed alone stopped scaling exponentially (end of Dennard scaling).
2. **Technical Definition:** The oscillation rate $f = 1 / T_{clk}$ (measured in Hertz / GHz) of the synchronous `CLK` signal distributed by `comm-clock-distribution` to coordinate sequential state transitions.
3. **Engineering Explanation:** Every clock period $T_{clk}$ must exceed the worst-case critical-path delay through combinational logic plus flip-flop setup and clock skew: $T_{clk} \ge t_{pcq} + t_{comb,max} + t_{setup} + t_{skew}$. Raising frequency requires shorter logic stages (deeper pipelines) or higher supply voltage $V$, which drives dynamic power $P_{dyn} = \alpha C V^2 f$ sharply upward until hitting thermal limits (`thermal-management`).
4. **Relevant 3D Components:** `comm-clock-distribution`, `logic-flip-flops`, `logic-combinational`, `logic-adders`, `core-alu`, `pkg-substrate`.
5. **Diagram / Visual Requirements:** Timing waveform diagram showing `CLK` period, $t_{pcq}$, combinational settling window, and $t_{setup}$ margin.
6. **Relationship to CPU Simulator:** Explains the difference between simulated educational clock ticks (`clockCycles` in `CPU Simulator`, controlled by user speed slider) and physical GHz silicon clock trees.
7. **Further Reading:** Weste & Harris (*CMOS VLSI Design*, Ch. 13); Harris & Harris (*Digital Design and Computer Architecture*, Ch. 3.5).

---

### Topic 09 — `ipc` (Instructions Per Cycle & Iron Law of Performance)
1. **Learning Objective:** Evaluate CPU execution time rigorously using the Iron Law of Processor Performance rather than relying on clock speed alone.
2. **Technical Definition:** Instructions Per Cycle ($\text{IPC} = 1 / \text{CPI}$) measures average retired instructions per clock cycle, reflecting microarchitectural efficiency (superscalar issue width, out-of-order execution, cache hit rates).
3. **Engineering Explanation:** Total program execution time obeys the **Iron Law**: $T_{exec} = \text{IC} \times \text{CPI} \times T_{clk} = \frac{\text{IC}}{\text{IPC} \cdot f}$. A processor running at lower frequency $f$ with higher IPC (via wider `core-execution-units`, better `branch-prediction`, and fewer cache misses) frequently outperforms a higher-GHz narrow core.
4. **Relevant 3D Components:** `core-execution-units`, `core-alu`, `die-cpu-cores`, `mem-l1-icache`, `mem-l1-dcache`, `core-registers`.
5. **Diagram / Visual Requirements:** Visual comparison bar chart showing `T_exec` sensitivity to Instruction Count ($\text{IC}$), $\text{IPC}$, and Clock Rate ($f$).
6. **Relationship to CPU Simulator:** Simulator computes `clockCycles` and executed instruction count live, demonstrating sequential `CPI = 6.0` (`IPC = 0.167`) vs. real superscalar hardware (`IPC > 1`).
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Ch. 1.8 & Ch. 3); Patterson & Hennessy (Ch. 1.6).

---

### Topic 10 — `parallel-processing` (Parallel Processing Taxonomy)
1. **Learning Objective:** Distinguish Instruction-Level Parallelism (ILP), Data-Level Parallelism (DLP/SIMD), and Thread-Level Parallelism (TLP) across CPU subsystems.
2. **Technical Definition:** Concurrent execution across multiple computation units, vector lanes, or processor cores to boost throughput beyond single-stream scalar execution.
3. **Engineering Explanation:** Modern microprocessors exploit multiple parallel tiers simultaneously: **ILP** (superscalar dispatch across `core-execution-units`), **DLP** (SIMD vector units operating on packed data lanes in parallel), and **TLP** (independent threads across `die-cpu-cores`). Speedup under parallelization remains bounded by serial program fractions per **Amdahl's Law**.
4. **Relevant 3D Components:** `core-execution-units`, `die-cpu-cores`, `die-interconnect`, `comm-interconnect-network`, `die-io-controller`.
5. **Diagram / Visual Requirements:** Flynn's / modern parallel hardware diagram (SISD vs. SIMD vector lanes vs. MIMD multi-core) + Amdahl's Law diminishing-returns curve.
6. **Relationship to CPU Simulator:** Clarifies that `CPU Simulator` traces one single instruction stream (SISD educational baseline) inside one active core (`Core 0`).
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Ch. 1, 3, 4, 5); Amdahl, G. M. (*Validity of the Single Processor Approach*, AFIPS 1967).

---

### Topic 11 — `multi-core-architecture` (Multi-Core Architecture & Coherence)
1. **Learning Objective:** Explain why microprocessor design pivoted from single high-GHz cores to multi-core CMP dies and how shared caches maintain coherence.
2. **Technical Definition:** Integration of two or more independent processing cores (`die-cpu-cores`) onto a single `pkg-silicon-die` (or chiplet package) sharing an on-die interconnect (`die-interconnect`), LLC (`mem-l3-cache`), and memory controller (`die-memory-controller`).
3. **Engineering Explanation:** Replicating $N$ cores running at moderate frequency/voltage yields vastly superior throughput-per-watt than scaling one core's frequency quadratically in voltage/power ($P \propto f \cdot V^2$). However, replicating private L1/L2 caches introduces the **Cache Coherence Problem**: hardware snoop or directory protocols (e.g., MESI) over `comm-interconnect-network` ensure two cores never read stale copies of the same memory address.
4. **Relevant 3D Components:** `die-cpu-cores`, `die-cache-regions`, `die-interconnect`, `comm-interconnect-network`, `mem-l2-cache`, `mem-l3-cache`.
5. **Diagram / Visual Requirements:** Die floorplan diagram showing 4 cores communicating across `die-interconnect` to sliced `mem-l3-cache` with MESI state flow.
6. **Relationship to CPU Simulator:** Explains why `Chip Anatomy` depicts 4 symmetrical cores on `pkg-silicon-die`, while `CPU Simulator` focuses cleanly on `Core 0` execution internals.
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Ch. 5 Centralized & Distributed Shared-Memory); Sorin, Hill & Wood (*A Primer on Memory Consistency and Cache Coherence*).

---

### Topic 12 — `power-consumption` (Power Consumption & Energy Efficiency)
1. **Learning Objective:** Quantify the two components of CMOS processor power (dynamic switching + static leakage) and explain why voltage scaling dominates energy efficiency.
2. **Technical Definition:** Electrical power dissipated by semiconductor switching activity ($P_{dynamic}$) and sub-threshold/gate leakage currents ($P_{static}$).
3. **Engineering Explanation:** Total CMOS power sums switching power $P_{dyn} = \alpha C V_{DD}^2 f$ and static leakage $P_{static} = I_{leak} V_{DD}$. Because dynamic power scales quadratically with supply voltage $V_{DD}$, small reductions in $V_{DD}$ yield massive power savings—motivating Dynamic Voltage and Frequency Scaling (DVFS) and aggressive clock/power gating across idle `die-cpu-cores` tiles.
4. **Relevant 3D Components:** `logic-transistors`, `comm-clock-distribution`, `die-execution-units`, `pkg-solder-bumps`, `pkg-substrate`, `pkg-electrical-contacts`.
5. **Diagram / Visual Requirements:** Interactive equation breakdown highlighting quadratic $V^2$ term and power-delivery path (`pkg-electrical-contacts -> pkg-substrate -> pkg-solder-bumps -> die`).
6. **Relationship to CPU Simulator:** Connects instruction switching activity (`EXECUTE` / `MEMORY_ACCESS`) conceptually to dynamic switching factor $\alpha$.
7. **Further Reading:** Weste & Harris (*CMOS VLSI Design*, Ch. 5 Power); Hennessy & Patterson (*Computer Architecture*, Ch. 1.5 Trends in Power and Energy).

---

### Topic 13 — `thermal-management` (Thermal Management & Heat Dissipation)
1. **Learning Objective:** Trace how microscopic electrical power turns into concentrated silicon heat flux and how CPU packaging mitigates hotspots.
2. **Technical Definition:** The thermal path and control mechanisms (TIM, `pkg-ihs`, external heatsinks, thermal sensors, DVFS throttling) maintaining silicon junction temperature ($T_J$) within safe reliability limits.
3. **Engineering Explanation:** Shrinking transistors concentrates tens or hundreds of watts onto tiny active core regions (`die-execution-units`), creating severe heat density ($\text{W/mm}^2$). Heat conducts from active transistors through bulk silicon and TIM into the copper Integrated Heat Spreader (`pkg-ihs`), governed by thermal resistance $T_J = T_{ambient} + P \cdot R_{\theta,JA}$. Exceeding safe $T_J$ accelerates electromigration and leakage power exponentially, triggering hardware thermal throttling.
4. **Relevant 3D Components:** `pkg-ihs`, `pkg-silicon-die`, `die-execution-units`, `pkg-solder-bumps`, `logic-transistors`.
5. **Diagram / Visual Requirements:** Vertical thermal resistance stack diagram (`Active Die Junction -> Bulk Silicon -> TIM -> Copper IHS -> Cooler -> Ambient`) + `"Explore Package Stack in Exploded View"` link.
6. **Relationship to CPU Simulator:** Explains why `Idle Animation` visualizes gentle cooling convection arcs above `pkg-ihs` and why intense `core-alu` switching creates localized core heat in real hardware.
7. **Further Reading:** Hennessy & Patterson (*Computer Architecture*, Ch. 1.5); Tummala (*Fundamentals of Microsystems Packaging*).

---

## 3. Part B — Technical Library & Content Architecture (`/library`)

### 3.1 Seven Canonical Content Modules

| Module Tab | Content Schema | Required Attributes | Offline Fallback Support |
|---|---|---|---|
| **1. Component Encyclopedia** | Direct structured mirror of all 36 `ChipComponent` records (`CHIP_ANATOMY_SPEC.md`) | `componentId`, group, representation badge, search/filter by group, `"Open in 3D Anatomy"` CTA | 100% bundled in `components.json` |
| **2. Engineering Glossary** | Alphabetical & category-filtered dictionary (`>= 45` core terms: ALU, Bus, Cache Hit, CPI, FinFET, Flit, Harvard, IHS, IPC, ISA, LGA, MAR, MDR, NoC, Pipeline, Register, SRAM, TDP, etc.) | `termId`, `term`, `category`, `conciseDefinition`, `technicalContext`, `relatedComponentIds[]`, `citationIds[]` | 100% bundled in `glossary.json` |
| **3. Semiconductor Fundamentals** | Concise foundational primers (Silicon Crystal & Doping, Photolithography Overview, CMOS Switch Principle, Package Assembly Stack, Interconnect Scaling) | `primerId`, `title`, `summary`, `sections[]`, `keyTakeaways[]`, `relatedComponentIds[]`, `citations[]` | 100% bundled in `fundamentals.json` |
| **4. CPU Architecture References** | Structured architectural lookup tables (ISA comparison matrix: `TIAN-ISA v1` vs. general RISC/CISC traits, Memory Hierarchy latency/capacity orders of magnitude, Stage mapping reference) | `referenceId`, `title`, `comparisonTable`, `scopeDisclaimer`, `citations[]` | 100% bundled in `references.json` |
| **5. Technical Diagrams** | Vector SVG engineering diagrams (6-Stage Core Datapath, Modified Harvard Memory Map, Package Cross-Section, CMOS Inverter, H-Tree Clock Network, Pipeline Gantt Chart) | `diagramId`, `title`, `svgAssetPath`, `caption`, `interactiveCallouts[]`, `relatedComponentIds[]` | Bundled static SVGs in `public/diagrams/` |
| **6. Engineering Formulas & Equations** | Canonical equations with **mandatory variable, unit, assumption, and applicability** definitions (below) | `formulaId`, `name`, `latex`, `variables[]` (symbol, name, unit), `assumptions`, `applicability`, `exampleCalculation`, `citations[]` | 100% bundled in `formulas.json` |
| **7. Learning Paths** | Guided curated curricula (Path 1: *CPU Foundations*, Path 2: *Inside an Instruction*, Path 3: *Memory & Performance Engineering*, Path 4: *Silicon Packaging to Logic*) | `pathId`, `title`, `difficulty`, `estimatedMinutes`, ordered `steps[]` linking across `/anatomy`, `/journey`, `/simulator`, `/insights` | 100% bundled in `learning_paths.json` |

### 3.2 Canonical Formulas Specification (With Variables, Units, Assumptions & Applicability)

All equations displayed across `Engineering Insights` and `Technical Library -> Formulas` **must** obey this explicit rigor format:

1. **Iron Law of Processor Performance:**
   $$T_{exec} = \text{IC} \times \text{CPI} \times T_{clk} = \frac{\text{IC}}{\text{IPC} \cdot f}$$
   - **Variables & Units:** $T_{exec}$ = CPU execution time ($\text{s}$); $\text{IC}$ = dynamic instruction count ($\text{instructions}$); $\text{CPI}$ = average cycles per instruction ($\text{cycles/instruction}$); $\text{IPC} = 1/\text{CPI}$ ($\text{instructions/cycle}$); $T_{clk}$ = clock period ($\text{s/cycle}$); $f = 1/T_{clk}$ = clock frequency ($\text{Hz}$).
   - **Assumptions & Applicability:** Measures active user/system CPU time assuming constant average frequency $f$ and excludes external I/O wait stalls.

2. **CMOS Dynamic Switching Power:**
   $$P_{dyn} = \alpha \cdot C \cdot V_{DD}^2 \cdot f$$
   - **Variables & Units:** $P_{dyn}$ = dynamic switching power ($\text{W}$); $\alpha$ = activity factor (dimensionless, $0 \le \alpha \le 1$); $C$ = switched load capacitance ($\text{F}$); $V_{DD}$ = supply voltage ($\text{V}$); $f$ = clock frequency ($\text{Hz}$).
   - **Assumptions & Applicability:** Models capacitive charging/discharging energy in digital CMOS circuits; total chip power also requires adding static leakage ($P_{static} = I_{leak} V_{DD}$) and short-circuit current.

3. **Average Memory Access Time (AMAT — Two-Level Example):**
   $$\text{AMAT} = T_{hit,L1} + \text{MR}_{L1} \times \left(T_{hit,L2} + \text{MR}_{L2} \times T_{miss,L2}\right)$$
   - **Variables & Units:** $\text{AMAT}$ = average memory access time ($\text{cycles}$ or $\text{ns}$); $T_{hit,L1}, T_{hit,L2}$ = cache hit latencies ($\text{cycles}$ or $\text{ns}$); $\text{MR}_{L1}, \text{MR}_{L2}$ = local miss rates (dimensionless, $0 \le \text{MR} \le 1$); $T_{miss,L2}$ = lower-level/DRAM miss penalty ($\text{cycles}$ or $\text{ns}$).
   - **Assumptions & Applicability:** Assumes serial single-outstanding lookup without prefetching or write-buffer hiding; extendable recursively across L3 and DRAM.

4. **Amdahl's Law (Parallel Speedup Bound):**
   $$S_{overall} = \frac{1}{(1 - p) + \frac{p}{s}}$$
   - **Variables & Units:** $S_{overall}$ = overall system speedup factor (dimensionless); $p$ = fraction of original execution time that is parallelizable ($0 \le p \le 1$); $s$ = speedup factor applied to the parallelizable portion ($s > 0$, e.g., $N$ ideal cores).
   - **Assumptions & Applicability:** Assumes fixed problem size, zero parallel synchronization/coherence overhead, and perfect load balance across the enhanced portion.

5. **Thermal Junction Temperature Model (1D Steady-State):**
   $$T_J = T_A + P \cdot R_{\theta,JA}$$
   - **Variables & Units:** $T_J$ = silicon junction temperature ($^\circ\text{C}$); $T_A$ = ambient cooling air/coolant temperature ($^\circ\text{C}$); $P$ = steady-state thermal power dissipation ($\text{W}$); $R_{\theta,JA}$ = effective junction-to-ambient thermal resistance ($^\circ\text{C/W}$).
   - **Assumptions & Applicability:** Simplified lumped steady-state 1D thermal network approximation; localized die hotspots require spatial 3D thermal resistance analysis.

6. **Synchronous Clock Timing Constraint:**
   $$T_{clk} \ge t_{pcq} + t_{comb,max} + t_{setup} + t_{skew}$$
   - **Variables & Units:** $T_{clk}$ = minimum clock period ($\text{s}$); $t_{pcq}$ = flip-flop clock-to-Q propagation delay ($\text{s}$); $t_{comb,max}$ = critical combinational path delay ($\text{s}$); $t_{setup}$ = receiving flip-flop setup time ($\text{s}$); $t_{skew}$ = worst-case clock arrival skew ($\text{s}$).
   - **Assumptions & Applicability:** Setup timing constraint for single-phase rising-edge-triggered synchronous digital logic.

---

### 3.3 Source Attribution & Validation Rules

1. **Zero Fabricated Citations:** Every reference object (`CitationEntry`) must cite real, verifiable textbooks, peer-reviewed papers, or published standards (e.g., Hennessy & Patterson 6th Ed., Patterson & Hennessy, Harris & Harris, Bryant & O'Hallaron, Weste & Harris, Khronos glTF 2.0, JEDEC standards).
2. **Bidirectional Integrity Check:** CI schema validation verifies that every `relatedComponentId` inside `insights.json`, `glossary.json`, `learning_paths.json`, and `diagrams.json` exists in the canonical 36-component list (`components.json`), and every `citationId` resolves in `citations.json`.
3. **Search Synchronization:** When the FastAPI backend is reachable, `/library` search delegates substring/weighted relevance queries to `GET /api/v1/library/search`; when offline, a deterministic client-side TypeScript search index executes identically over the bundled JSON files.

---

## 4. Cross-Document References

- Canonical Content JSON Schemas: [DATA_MODEL.md](./DATA_MODEL.md)
- Library Search & Content Endpoints: [API_CONTRACT.md](./API_CONTRACT.md)
- 3D Component Registry: [CHIP_ANATOMY_SPEC.md](./CHIP_ANATOMY_SPEC.md)
- Simulator Presets & ISA: [SIMULATION_SPEC.md](./SIMULATION_SPEC.md)
