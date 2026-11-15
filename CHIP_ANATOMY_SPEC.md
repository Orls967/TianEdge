# Chip Anatomy Specification — TIANEDGE

**Document ID:** `TIANEDGE-ANAT-001`  
**Product Name:** TIANEDGE — Semiconductor & Microprocessor Exploration Platform  
**Scope:** Canonical 6-Group / 36-Component CPU Taxonomy, 15-Field Engineering Specification, and 3D-to-Content Mapping  

---

## 1. Purpose and Scope

This specification defines the complete structural, functional, and representational contract for **Chip Anatomy** (`/anatomy`), TIANEDGE's primary interactive 3D exploration experience. It establishes:

1. The **36 canonical CPU components** organized into **6 architectural groups**.
2. Explicit distinction among **physical package hardware**, **architectural die blocks**, **logical subsystems**, **enlarged conceptual digital logic models**, and **signal overlays** (per Constraint `C-09`).
3. All **15 mandatory documentation fields** required for every component.
4. Direct bidirectional mapping between 3D scene meshes (`componentId`), visualization modes, animations, `Instruction Journey` stages, `CPU Simulator` highlights, and `Engineering Insights` topics.

**Engineering Honesty Note:** Components in Group E (`Digital Logic Foundation`) use conceptual enlarged 3D geometry to explain transistor switching and Boolean gates. TIANEDGE does **not** render nanometer-scale layouts at literal scale nor execute SPICE transistor physics. Physical package and silicon die models are educational engineering reconstructions, not vendor-proprietary manufacturing CAD blueprints.

---

## 2. Canonical Component Taxonomy & Representation Classification

Every selectable element in TIANEDGE uses a stable kebab-case `componentId`.

| Group ID | Group Name | Component Count | Representation Classification |
|---|---|---|---|
| `cpu-package` | A. CPU Package | 5 | `physical_package` (macroscopic mechanical, thermal & electrical packaging) |
| `silicon-die` | B. Silicon Die | 6 | `architectural_block` (macro floorplan partitions on the monolithic silicon die) |
| `processing-core` | C. Processing Core | 6 | `logical_subsystem` (microarchitectural blocks inside one processing core) |
| `memory-hierarchy` | D. Memory Hierarchy | 6 | `logical_subsystem` + `architectural_block` (storage tiers ordered by speed/capacity) |
| `digital-logic` | E. Digital Logic Foundation | 7 | `conceptual_enlarged` (enlarged didactic circuit & transistor models) |
| `communication-control` | F. Communication & Control | 6 | `signal_overlay` + `logical_subsystem` (buses, datapaths, clocks, NoC) |

### Master ID Registry (36 Components)

- **Group A (`cpu-package`):** `pkg-ihs`, `pkg-silicon-die`, `pkg-substrate`, `pkg-solder-bumps`, `pkg-electrical-contacts`
- **Group B (`silicon-die`):** `die-cpu-cores`, `die-cache-regions`, `die-execution-units`, `die-interconnect`, `die-memory-controller`, `die-io-controller`
- **Group C (`processing-core`):** `core-alu`, `core-control-unit`, `core-registers`, `core-instruction-decoder`, `core-execution-units`, `core-load-store-unit`
- **Group D (`memory-hierarchy`):** `mem-l1-icache`, `mem-l1-dcache`, `mem-l2-cache`, `mem-l3-cache`, `mem-register-file`, `mem-main-interface`
- **Group E (`digital-logic`):** `logic-transistors`, `logic-gates`, `logic-flip-flops`, `logic-multiplexers`, `logic-adders`, `logic-combinational`, `logic-sequential`
- **Group F (`communication-control`):** `comm-internal-buses`, `comm-data-paths`, `comm-control-signals`, `comm-clock-distribution`, `comm-interconnect-network`, `comm-memory-interface`

*Disambiguation Rules:*
- **`pkg-silicon-die` vs. Group B (`silicon-die`):** `pkg-silicon-die` represents the monolithic physical silicon piece inside the package stack (mechanical/thermal carrier), whereas Group B components (`die-*`) represent the functional floorplan regions etched onto its active surface.
- **`core-registers` vs. `mem-register-file`:** `core-registers` explains architectural register state (`R0`–`R7`, `PC`, `IR`, `FLAGS`) inside the core datapath; `mem-register-file` explains the physical multi-port SRAM storage array as Tier 0 of the memory hierarchy. Both cross-reference each other without duplicating definitions.

---

## 3. Visualization Modes & 3D-to-Content Mapping Rules

| Mode ID | Display Label | Camera & Geometry Behavior | Active Component Groups |
|---|---|---|---|
| `full_assembly` | Full Assembly | Assembled CPU package resting on reference origin; IHS closed; subtle idle motion. | `cpu-package` (outer shell visible; internal layers occluded until exploded/sliced) |
| `exploded_view` | Exploded View | Separates `pkg-ihs`, `pkg-silicon-die`, `pkg-substrate`, `pkg-solder-bumps`, `pkg-electrical-contacts` along +Y/-Y vertical axis (`0.0m` -> `0.45m` staggered offsets). | `cpu-package`, `silicon-die` |
| `section_cut` | Section Cut | Applies interactive WebGL clipping plane slicing IHS and upper package layers to reveal internal die & TIM interface. | `cpu-package`, `silicon-die`, `processing-core` |
| `component_isolation` | Component Isolation | Centers camera on selected `componentId`, hides unrelated meshes (or dims to `opacity: 0.08`), renders enlarged conceptual assembly when in `digital-logic`. | Single selected `componentId` + optional 1-hop neighbors |
| `internal_architecture` | Internal Architecture | Hides IHS and substrate lid; switches to top-down isometric architectural floorplan revealing `die-*`, `core-*`, and `mem-*` functional regions. | `silicon-die`, `processing-core`, `memory-hierarchy` |
| `signal_flow` | Signal Flow | Renders translucent dark die silhouette with luminous electric cyan (`#22D3EE`) spline overlays for `comm-*` paths and animated pulse packets. | `communication-control` + connected `core-*` / `mem-*` endpoints |

---

## 4. Detailed Component Specifications (15-Field Contract)

Every component below strictly implements all 15 required metadata fields:
`1. Identification`, `2. Definition`, `3. Primary Function`, `4. Engineering Principles`, `5. Physical or Logical Construction`, `6. Operating Mechanism`, `7. Internal Structure`, `8. Input and Output`, `9. Relationships`, `10. Technical Parameters`, `11. Real-World Application`, `12. 3D Representation`, `13. Animation & Interaction`, `14. Related Topics`, `15. Technical References`.

---

### Group A — CPU Package (`cpu-package`)

#### `pkg-ihs` — Integrated Heat Spreader (IHS)
1. **Identification:** `pkg-ihs` | Category: `cpu-package` | Representation: `physical_package`
2. **Definition:** A thermally conductive metallic lid mounted atop the silicon die and sealed to the package substrate to protect the die and distribute concentrated thermal energy across a larger contact area.
3. **Primary Function:** Conduct heat away from fragile silicon die hotspots toward an external heatsink or cold plate while providing mechanical protection against mounting pressure.
4. **Engineering Principles:** Fourier's Law of heat conduction ($q = -k \nabla T$); reducing thermal interface resistance ($R_{\theta}$) by spreading high power density ($\text{W/mm}^2$) over a wider surface area.
5. **Physical or Logical Construction:** Stamped or forged oxygen-free copper body electroplated with nickel for oxidation resistance and solderability, bonded via Thermal Interface Material (TIM/solder TIM) above the die and adhesive sealant along the substrate perimeter.
6. **Operating Mechanism:** Thermal energy generated by switching transistors propagates vertically through the silicon bulk and TIM into the IHS base, spreads laterally across the copper plate, and transfers to an external cooler.
7. **Internal Structure:** Die-contact pedestal, thermal interface layer (polymer TIM or indium solder TIM), flat upper heat-transfer flange, and perimeter bonding skirt.
8. **Input and Output:** **Input:** Concentrated thermal flux from `pkg-silicon-die`. **Output:** Distributed heat flux into external thermal solution; mechanical clamping load routed around die edges to `pkg-substrate`.
9. **Relationships:** Encloses `pkg-silicon-die`; bonds to `pkg-substrate`; thermally mitigates hotspots from `die-cpu-cores` and `die-execution-units`.
10. **Technical Parameters:** Copper thermal conductivity $\approx 380\text{–}400\ \text{W/(m}\cdot\text{K)}$; typical lid thickness $\approx 1\text{–}3\ \text{mm}$; package-level TDP dissipation envelope tens to hundreds of watts depending on class.
11. **Real-World Application:** Used across desktop, workstation, and server microprocessors (e.g., socketed LGA processors) to prevent die cracking under heavy cooler retention forces.
12. **3D Representation:** Realistic physical macro reconstruction (nickel-plated chamfered metallic cap with laser-etched `TIANEDGE` placeholder markings; explicitly non-proprietary geometry).
13. **Animation & Interaction:** Slides upward (`+Y`) in `Exploded View`; sliced cleanly in `Section Cut`; glows warm amber subtly during high thermal load demos; click selects and optionally toggles transparency.
14. **Related Topics:** `thermal-management`, `power-consumption`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 1 power/thermal packaging fundamentals); JEDEC solid-state thermal package standards.

#### `pkg-silicon-die` — Silicon Die (Physical Die Carrier)
1. **Identification:** `pkg-silicon-die` | Category: `cpu-package` | Representation: `physical_package`
2. **Definition:** A thin rectangular block of high-purity monocrystalline silicon diced from a semiconductor wafer onto which the processor's integrated circuits are fabricated.
3. **Primary Function:** Serve as the physical semiconductor substrate housing billions of nanoscale CMOS transistors and multi-layer metal interconnects.
4. **Engineering Principles:** Photolithographic patterning of doped silicon channels and back-end-of-line (BEOL) copper/cobalt metal interconnect stacks.
5. **Physical or Logical Construction:** Crystalline silicon wafer slice (often thinned to hundreds of micrometers) topped with active transistor layer (FEOL) and 10–15+ metal routing layers (BEOL), terminating in passivation and micro-bump pads.
6. **Operating Mechanism:** Provides the electrical semiconductor junctions for switching logic and routes signals and power rails from package bumps to internal core and cache regions.
7. **Internal Structure:** Bulk silicon substrate, active FEOL device layer, BEOL metal routing stack, and flip-chip pad redistribution layer (RDL). Sub-regions map to Group B (`silicon-die`).
8. **Input and Output:** **Input:** Regulated VDD/VSS power rails and I/O signals via `pkg-solder-bumps`. **Output:** Processed external signals and thermal energy upward into `pkg-ihs`.
9. **Relationships:** Parent physical container of `die-cpu-cores`, `die-cache-regions`, `die-execution-units`, `die-interconnect`, `die-memory-controller`, `die-io-controller`; mounted on `pkg-solder-bumps`; covered by `pkg-ihs`.
10. **Technical Parameters:** Typical desktop die area tens to several hundred $\text{mm}^2$; thinned die thickness $\approx 200\text{–}775\ \mu\text{m}$; operates at core supply voltages typically around $0.6\text{–}1.3\ \text{V}$.
11. **Real-World Application:** Monolithic and chiplet dies in modern CPUs, mobile SoCs, and server accelerators.
12. **3D Representation:** Iridescent dark polished silicon prism with subtle microscopic metallic floorplan sheen; reveals Group B architectural overlays when focused or in `Internal Architecture` mode.
13. **Animation & Interaction:** Rises slightly above `pkg-solder-bumps` in `Exploded View`; clicking offers quick-drill into Group B `silicon-die` floorplan regions.
14. **Related Topics:** `multi-core-architecture`, `power-consumption`, `thermal-management`
15. **Technical References:** Weste & Harris (*CMOS VLSI Design*, Ch. 1 & Packaging); Patterson & Hennessy (*Computer Organization and Design*, Ch. 1).

#### `pkg-substrate` — Package Substrate
1. **Identification:** `pkg-substrate` | Category: `cpu-package` | Representation: `physical_package`
2. **Definition:** A multi-layer miniature printed circuit interposer that bridges the ultra-fine-pitch micro-connections of the silicon die to the macro-scale pads/pins facing the motherboard socket.
3. **Primary Function:** Fan out dense die I/O and power connections while maintaining signal integrity, controlled impedance, and mechanical rigidity.
4. **Engineering Principles:** High-density interconnect (HDI) multi-layer routing, micro-via fan-out, ground/power reference planes for return current and EMI suppression, and decoupling capacitor mounting.
5. **Physical or Logical Construction:** Core laminate (glass-reinforced resin such as BT/ABF build-up films) containing 6–16+ copper signal/power planes connected by laser-drilled micro-vias and plated through-holes.
6. **Operating Mechanism:** Routes differential high-speed I/O lanes (memory/PCIe) and distributed power rails radially outward from central flip-chip bump pads under the die to bottom-side electrical contacts.
7. **Internal Structure:** Top solder-mask bump landing pads, upper ABF build-up routing layers, rigid core with plated through-holes, lower build-up layers, and bottom pad grid (plus surface-mount decoupling capacitors).
8. **Input and Output:** **Input:** Power and external signals from `pkg-electrical-contacts`. **Output:** Impedance-matched signals and low-inductance power to `pkg-solder-bumps`.
9. **Relationships:** Bridges `pkg-electrical-contacts` (below) and `pkg-solder-bumps` (above); supports perimeter seal of `pkg-ihs`.
10. **Technical Parameters:** Layer count typically 8–16+ build-up layers; trace width/spacing on the order of $10\text{–}20\ \mu\text{m}$ in build-up layers; substrate thickness $\approx 0.8\text{–}1.5\ \text{mm}$.
11. **Real-World Application:** Organic flip-chip BGA/LGA substrates used across workstation, desktop, and server CPUs.
12. **3D Representation:** Deep blue-green/teal engineered matte organic laminate PCB slab with visible gold trace lines and perimeter SMDs.
13. **Animation & Interaction:** Remains anchor reference layer in `Exploded View`; displays radial routing trace shimmer in `Signal Flow`.
14. **Related Topics:** `clock-frequency`, `power-consumption`
15. **Technical References:** Weste & Harris (*CMOS VLSI Design*, Packaging & Power Distribution); Tummala (*Fundamentals of Microsystems Packaging*).

#### `pkg-solder-bumps` — Solder Bumps
1. **Identification:** `pkg-solder-bumps` | Category: `cpu-package` | Representation: `physical_package`
2. **Definition:** Microscopic spherical metallic interconnect joints arranged in an array beneath a flip-chip silicon die that electrically and mechanically bond the die to the package substrate.
3. **Primary Function:** Deliver ultra-high-density power, ground, and I/O connections directly across the entire area of the die face rather than only its perimeter.
4. **Engineering Principles:** Controlled Collapse Chip Connection (C4 / flip-chip) area-array bonding reduces parasitic inductance ($L$) and IR voltage drop compared with peripheral wire-bonding.
5. **Physical or Logical Construction:** Lead-free tin-silver-copper (SAC) solder spheres or copper-pillar micro-bumps reflowed onto under-bump metallization (UBM) pads, surrounded by capillary epoxy underfill to relieve CTE mismatch stress.
6. **Operating Mechanism:** Thousands of parallel bump columns carry high amperage core supply ($V_{DD}$/$V_{SS}$) directly above active logic blocks while dedicated signal bumps pass high-frequency data into substrate micro-vias.
7. **Internal Structure:** Die UBM pad, copper pillar (in advanced nodes), solder alloy cap, substrate landing pad, and surrounding polymer underfill matrix.
8. **Input and Output:** **Input/Output:** Bidirectional I/O and high-current DC power between `pkg-substrate` and `pkg-silicon-die`.
9. **Relationships:** Directly interfaces `pkg-silicon-die` and `pkg-substrate`; electrically feeds `die-memory-controller` and `die-io-controller`.
10. **Technical Parameters:** C4 bump pitch typically $\approx 100\text{–}150\ \mu\text{m}$ (micro-bumps $\approx 25\text{–}50\ \mu\text{m}$); thousands of connections per die; ultra-low single-bump inductance ($\sim\text{pH}$ range).
11. **Real-World Application:** Flip-chip processors, 2.5D/3D stacked dies, and high-bandwidth package assemblies.
12. **3D Representation:** Instanced metallic silver-gold micro-sphere grid visible underneath the raised die in `Exploded View` and `Section Cut` (pitch exaggerated slightly for visual legibility, documented as scaled educational reconstruction).
13. **Animation & Interaction:** Revealed smoothly as `pkg-silicon-die` lifts in `Exploded View`; subtle vertical pulse in `Signal Flow`.
14. **Related Topics:** `power-consumption`, `thermal-management`
15. **Technical References:** Weste & Harris (*CMOS VLSI Design*, Flip-Chip Packaging); IBM C4 flip-chip packaging literature.

#### `pkg-electrical-contacts` — Electrical Contacts
1. **Identification:** `pkg-electrical-contacts` | Category: `cpu-package` | Representation: `physical_package`
2. **Definition:** The macroscopic array of gold-plated contact pads (LGA), pins (PGA), or solder balls (BGA) on the underside of the CPU package substrate that mate with a motherboard socket or PCB.
3. **Primary Function:** Provide a reliable, serviceable (for LGA/PGA) electromechanical interface connecting the processor package to system power delivery, clock inputs, DRAM channels, and PCIe/I/O lanes.
4. **Engineering Principles:** Contact resistance minimization using gold-over-nickel plating, differential pair pin assignment with interleaved ground shielding to minimize crosstalk, and mechanical compliance under socket spring tension.
5. **Physical or Logical Construction:** Precision array of electroplated copper/nickel/gold flat pads (LGA style modeled in TIANEDGE) arranged around a central cavity for bottom-side decoupling capacitors.
6. **Operating Mechanism:** Spring-loaded socket contacts press against each contact pad, completing hundreds to thousands of parallel electrical pathways for power, ground, memory buses, and system I/O.
7. **Internal Structure:** Outer signal pin fields (memory/I/O), central dense power/ground pad grid, alignment key notches, and central SMD capacitor bay.
8. **Input and Output:** **Input:** Motherboard VRM power, reference clock, system resets, DRAM/PCIe signals. **Output:** Memory requests, I/O transactions, thermal/telemetry interrupts to motherboard.
9. **Relationships:** Bottom external boundary of `pkg-substrate`; indirectly supplies `mem-main-interface`, `die-io-controller`, and `comm-clock-distribution`.
10. **Technical Parameters:** Desktop/server LGA pad counts commonly range from ~1,200 to >4,500+ contacts; contact pitch typically $\approx 0.8\text{–}1.0\ \text{mm}$.
11. **Real-World Application:** Land Grid Array (LGA) sockets on modern desktop and server platforms; Ball Grid Array (BGA) on mobile/laptop processors.
12. **3D Representation:** High-precision instanced warm-gold contact pad grid on the bottom surface of `pkg-substrate`.
13. **Animation & Interaction:** Exposed when camera orbits beneath substrate or during `Exploded View` downward offset; clicking highlights external bus entry points.
14. **Related Topics:** `clock-frequency`, `power-consumption`
15. **Technical References:** JEDEC MO-series socket/package mechanical standards; Harris & Harris (*Digital Design and Computer Architecture*).

---

### Group B — Silicon Die (`silicon-die`)

#### `die-cpu-cores` — CPU Cores Array (Die Floorplan Region)
1. **Identification:** `die-cpu-cores` | Category: `silicon-die` | Representation: `architectural_block`
2. **Definition:** The partitioned silicon floorplan zones dedicated to independent instruction-executing processor cores replicated across the die.
3. **Primary Function:** Provide parallel hardware execution engines capable of fetching, decoding, and executing independent instruction streams concurrently.
4. **Engineering Principles:** Thread-level parallelism (TLP) via chip multiprocessing (CMP); trading single-thread frequency scaling limits for replicated, power-efficient cores.
5. **Physical or Logical Construction:** Symmetric (or heterogeneous performance/efficiency) rectangular floorplan tiles containing front-end fetch/decode, execution core (`core-*`), and private L1/L2 caches.
6. **Operating Mechanism:** Each core operates an independent Program Counter and execution pipeline while sharing coherent access to last-level cache (`die-cache-regions`) and memory over `die-interconnect`.
7. **Internal Structure:** Core tile grid, private L1i/L1d/L2 sub-blocks, and core-to-interconnect interface ports (drilling down into Group C `processing-core`).
8. **Input and Output:** **Input:** Instructions and data from L2/L3 cache and external interrupts. **Output:** Memory read/write transactions and computed state updates.
9. **Relationships:** Resides inside `pkg-silicon-die`; contains Group C (`core-alu`, `core-control-unit`, `core-registers`, `core-instruction-decoder`, `core-execution-units`, `core-load-store-unit`); connects via `die-interconnect` to `die-cache-regions`.
10. **Technical Parameters:** Educational reference die models 4 symmetric core tiles (real commercial CPUs span 2 to 128+ cores); each core tile encompasses front-end, execution engine, and private L1/L2 SRAM.
11. **Real-World Application:** Multi-core desktop, laptop, and cloud server microprocessors.
12. **3D Representation:** Distinct glowing-bordered rectangular architectural tiles etched onto the silicon die floorplan; clicking a core focuses/drills into Group C internals.
13. **Animation & Interaction:** Subtle alternating core activity glow in `Idle Animation`; highlights active simulated core (`Core 0`) during `CPU Simulator` runs.
14. **Related Topics:** `multi-core-architecture`, `parallel-processing`, `ipc`, `power-consumption`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 5 Thread-Level Parallelism).

#### `die-cache-regions` — Cache Regions (Shared LLC Floorplan)
1. **Identification:** `die-cache-regions` | Category: `silicon-die` | Representation: `architectural_block`
2. **Definition:** Dedicated high-density SRAM array zones across the silicon die housing private L2 and shared L3 (Last-Level Cache) storage banks.
3. **Primary Function:** Bridge the latency and bandwidth gap between high-speed core execution units and slower off-die system DRAM.
4. **Engineering Principles:** Spatial and temporal locality; dense 6-transistor (6T) SRAM bitcells tiled into uniform sub-arrays with tag comparators and ECC protection.
5. **Physical or Logical Construction:** Highly regular, visually repetitive rectangular SRAM macro arrays often occupying 30%–50%+ of total processor die area, divided into slices distributed along the interconnect fabric.
6. **Operating Mechanism:** Core cache misses propagate to distributed L3 slices hashed by physical address; hits return cache lines over the interconnect without crossing off-die pins.
7. **Internal Structure:** Tag SRAM banks, Data SRAM sub-arrays, replacement policy logic, snoop/directory coherence filters, and interconnect slice stops.
8. **Input and Output:** **Input:** Core cache miss requests and coherence probes. **Output:** Requested cache lines back to cores or miss requests forwarded to `die-memory-controller`.
9. **Relationships:** Located on `pkg-silicon-die` adjacent to `die-cpu-cores` and linked via `die-interconnect`; maps functionally to `mem-l2-cache` and `mem-l3-cache`.
10. **Technical Parameters:** SRAM density significantly lower than DRAM but delivers single-digit to tens-of-nanoseconds access latency; shared L3 typically megabytes to tens/hundreds of megabytes.
11. **Real-World Application:** Sliced Last-Level Cache (LLC) architectures in desktop and server CPUs.
12. **3D Representation:** Ultra-dense gridded rectilinear SRAM block arrays rendered with fine micro-matrix normal textures on the silicon die.
13. **Animation & Interaction:** Highlighted during `Cache Hierarchy` topic jumps and `MEMORY_ACCESS` simulation stages.
14. **Related Topics:** `cache-hierarchy`, `harvard-architecture`, `ipc`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 2 Memory Hierarchy Design); Bryant & O'Hallaron (*CS:APP*, Ch. 6).

#### `die-execution-units` — Execution Units Cluster (Die Floorplan)
1. **Identification:** `die-execution-units` | Category: `silicon-die` | Representation: `architectural_block`
2. **Definition:** The silicon area within each processor core tile dedicated to integer arithmetic, floating-point, SIMD/vector, and address generation hardware datapaths.
3. **Primary Function:** Concentrate the highest switching-activity logic circuits responsible for actual arithmetic and bitwise computation on the die.
4. **Engineering Principles:** Bit-sliced datapath regularity for minimal wire delay; high thermal power density requiring optimal placement relative to `pkg-ihs` and clock grids.
5. **Physical or Logical Construction:** Tightly packed standard-cell and custom datapath macros arranged beside register file read/write ports (`core-registers`) to minimize signal propagation delay.
6. **Operating Mechanism:** Receives decoded micro-operations and operand values from register read ports, computes outputs within single or pipelined clock cycles, and forwards results onto bypass/write-back buses.
7. **Internal Structure:** Integer ALU banks, multiplier/divider arrays, floating-point/vector lanes, and local bypass multiplexing networks (detailed inside `core-alu` and `core-execution-units`).
8. **Input and Output:** **Input:** Decoded control vectors and register operands. **Output:** Computed results, condition flags, and memory effective addresses.
9. **Relationships:** Sub-region inside `die-cpu-cores`; bridges to `core-alu` and `core-execution-units`; generates primary thermal flux conducted by `pkg-ihs`.
10. **Technical Parameters:** Highest power density region on the die; critical-path switching latency sets upper bounds on `clock-frequency`.
11. **Real-World Application:** Integer/SIMD datapath clusters in modern out-of-order superscalar processors.
12. **3D Representation:** High-contrast cyan-accented functional cluster inset within each `die-cpu-cores` floorplan tile.
13. **Animation & Interaction:** Pulses electric cyan during `EXECUTE` stage; displays warm thermal accent under thermal demonstration mode.
14. **Related Topics:** `ipc`, `clock-frequency`, `power-consumption`, `thermal-management`
15. **Technical References:** Weste & Harris (*CMOS VLSI Design*, Ch. 11 Datapath Subsystems); Patterson & Hennessy (*Computer Organization and Design*).

#### `die-interconnect` — Die Interconnect Fabric
1. **Identification:** `die-interconnect` | Category: `silicon-die` | Representation: `architectural_block`
2. **Definition:** The high-bandwidth on-die communication fabric (ring bus, 2D mesh, or crossbar Network-on-Chip) linking CPU cores, cache slices, memory controllers, and I/O blocks.
3. **Primary Function:** Transport cache lines, coherence messages, and I/O traffic deterministically and without deadlock across all on-die functional regions.
4. **Engineering Principles:** Packet-switched or multi-stop ring/mesh routing; cache coherence protocol messaging (e.g., MESI/MOESI directory states); bisection bandwidth scaling with core count.
5. **Physical or Logical Construction:** Wide multi-layer upper metal routing buses (hundreds of bits wide per direction) interspersed with buffered router switches/stops at every core and cache slice.
6. **Operating Mechanism:** When a core or I/O agent initiates a memory transaction, packetized address/data flits traverse hop-by-hop across interconnect stops to the target cache slice or controller.
7. **Internal Structure:** Bidirectional data rings/channels, request/snoop/acknowledge channels, arbitration routers, and clock-domain crossing bridges.
8. **Input and Output:** **Input:** Read/write requests, coherence snoops, DMA traffic. **Output:** Routed packets to `die-cache-regions`, `die-memory-controller`, or `die-io-controller`.
9. **Relationships:** Spine of `pkg-silicon-die` linking `die-cpu-cores`, `die-cache-regions`, `die-memory-controller`, and `die-io-controller`; architectural basis for `comm-interconnect-network`.
10. **Technical Parameters:** On-die bus widths commonly 256–512+ bits per link; aggregate bisection bandwidth hundreds of GB/s to multiple TB/s depending on core topology.
11. **Real-World Application:** Ring interconnects in mainstream desktop CPUs and 2D mesh NoCs in high-core-count server processors.
12. **3D Representation:** Luminous multi-lane cyan metallic highway network spanning centrally between core tiles, cache slices, and controllers.
13. **Animation & Interaction:** Shows directional flowing light packets in `Signal Flow` and `Internal Architecture` views.
14. **Related Topics:** `multi-core-architecture`, `cache-hierarchy`, `parallel-processing`
15. **Technical References:** Dally & Towles (*Principles and Practices of Interconnection Networks*); Hennessy & Patterson (*Computer Architecture*, Ch. 5).

#### `die-memory-controller` — Integrated Memory Controller (IMC)
1. **Identification:** `die-memory-controller` | Category: `silicon-die` | Representation: `architectural_block`
2. **Definition:** The on-die hardware subsystem that translates internal CPU cache-line read/write requests into external DRAM physical timing and protocol commands.
3. **Primary Function:** Manage communication with off-die main memory (DRAM), scheduling read/write queues, row activations, precharges, and periodic refresh cycles.
4. **Engineering Principles:** Out-of-order memory request scheduling (FR-FCFS) to maximize open-row hits, bank-level parallelism, error correction (ECC) support, and DDR PHY serialization.
5. **Physical or Logical Construction:** Digital transaction scheduler logic coupled to mixed-signal DDR PHY I/O buffers located along the perimeter edge of the silicon die for direct routing to `pkg-solder-bumps`.
6. **Operating Mechanism:** On an L3 cache miss, the controller maps the physical address to channel/rank/bank/row/column, asserts DRAM timing commands within JEDEC specs, and returns data to the interconnect.
7. **Internal Structure:** Read/write transaction queues, address decoder, DRAM command scheduler, refresh timer, and physical-layer (PHY) SerDes/drivers.
8. **Input and Output:** **Input:** Cache-miss read/write-back requests from `die-interconnect`. **Output:** Electrical DDR signals out through `pkg-solder-bumps` -> `pkg-substrate` -> `pkg-electrical-contacts`.
9. **Relationships:** Edge block on `pkg-silicon-die`; receives requests from `die-interconnect` and `die-cache-regions`; interfaces with `mem-main-interface` and `comm-memory-interface`.
10. **Technical Parameters:** Dual-channel to 8/12-channel architectures depending on platform class; DRAM access latency typically tens of nanoseconds (orders of magnitude slower than L1 cache).
11. **Real-World Application:** Integrated DDR4/DDR5/LPDDR5 memory controllers embedded in modern CPUs and SoCs.
12. **3D Representation:** Perimeter edge block on the die highlighted with parallel bus pins pointing toward package substrate routing.
13. **Animation & Interaction:** Lights up when `LOAD Rd, [addr]` or `STORE Rs, addr` accesses main memory in `CPU Simulator` or `Signal Flow`.
14. **Related Topics:** `cache-hierarchy`, `von-neumann-architecture`, `ipc`
15. **Technical References:** Jacob, Ng & Wang (*Memory Systems: Cache, DRAM, Disk*); JEDEC DDR standards; Patterson & Hennessy.

#### `die-io-controller` — I/O Controller
1. **Identification:** `die-io-controller` | Category: `silicon-die` | Representation: `architectural_block`
2. **Definition:** On-die interface blocks managing high-speed external peripheral communication protocols such as PCIe lanes, DMA engines, display links, and system platform buses.
3. **Primary Function:** Enable high-throughput Direct Memory Access (DMA) and peripheral communication between the CPU complex and storage, networking, GPUs, and chipset devices.
4. **Engineering Principles:** Packetized serial differential signaling (SerDes), credit-based flow control, IOMMU address translation/protection, and interrupt routing.
5. **Physical or Logical Construction:** Digital protocol transaction/link layers adjacent to high-speed analog SerDes transceiver lanes placed near die edges.
6. **Operating Mechanism:** Serializes internal parallel packets onto differential PCIe/I/O lanes, arbitrates DMA transfers directly into coherent cache/memory via `die-interconnect`, and delivers device interrupts to cores.
7. **Internal Structure:** Root complex / protocol engine, DMA arbitration queues, IOMMU translation cache, and multi-lane SerDes PHYs.
8. **Input and Output:** **Input:** Peripheral DMA requests, external device interrupts, MMIO writes. **Output:** Memory-mapped transactions to `die-interconnect`; outbound high-speed serial signals via `pkg-solder-bumps`.
9. **Relationships:** Edge partner to `die-memory-controller` on `pkg-silicon-die`; connects to `die-interconnect` and external `pkg-electrical-contacts`.
10. **Technical Parameters:** Supports high-speed serial lanes (GB/s per lane); operates across independent I/O clock domains synchronized via asynchronous FIFOs.
11. **Real-World Application:** Integrated PCIe root complexes, USB/Thunderbolt host controllers, and SoC fabric I/O hubs.
12. **3D Representation:** Die-edge interface block with visible serial lane trace ribs radiating toward the substrate edge.
13. **Animation & Interaction:** Highlighted in `Internal Architecture` and `Signal Flow` to illustrate peripheral entry/exit relative to memory and core execution.
14. **Related Topics:** `von-neumann-architecture`, `parallel-processing`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Storage & I/O fundamentals); PCI-SIG architectural concepts.

---

### Group C — Processing Core (`processing-core`)

#### `core-alu` — Arithmetic Logic Unit (ALU)
1. **Identification:** `core-alu` | Category: `processing-core` | Representation: `logical_subsystem`
2. **Definition:** The combinational digital logic circuit inside a processing core that performs integer arithmetic (`ADD`, `SUB`, `MUL`) and bitwise logical operations (`AND`, `OR`, `XOR`), while emitting processor status flags.
3. **Primary Function:** Execute computational operations on register operands and evaluate comparison conditions driving program control flow.
4. **Engineering Principles:** Two's complement binary arithmetic, Boolean algebra, carry-lookahead/parallel-prefix addition (`logic-adders`), and multiplexer output selection (`logic-multiplexers`).
5. **Physical or Logical Construction:** Bit-sliced combinational logic network built from `logic-adders`, logic gate arrays (`logic-gates`), shifters, and output selector multiplexers (`logic-multiplexers`).
6. **Operating Mechanism:** Receives two source operands (`OpA`, `OpB`) and an operation selector (`ALUOp`) from `core-control-unit`, propagates electrical signals combinational-style within one cycle, outputs the result, and latches status flags (`Z` Zero, `N` Negative, `C` Carry, `V` Overflow).
7. **Internal Structure:** Arithmetic adder/subtractor stage, logic unit (`AND`/`OR`/`XOR`), multiplier array, zero/sign/overflow flag detectors, and final output MUX.
8. **Input and Output:** **Input:** Operands from `core-registers` (`OpA`, `OpB`), `ALUOp` control lines from `core-control-unit`. **Output:** Computed result to `WRITE_BACK` bus / `core-load-store-unit`; `FLAGS` (`Z, N, C, V`).
9. **Relationships:** Centerpiece of `core-execution-units`; controlled by `core-control-unit`; reads from `core-registers`; built conceptually from `logic-adders`, `logic-gates`, and `logic-multiplexers`.
10. **Technical Parameters:** TIANEDGE educational width: 32-bit signed integer (`i32`); executes in 1 simulated `EXECUTE` stage cycle; produces 4 status flags (`Z, N, C, V`).
11. **Real-World Application:** Every scalar integer pipeline inside x86, ARM, RISC-V, and embedded microcontroller cores.
12. **3D Representation:** Prominent central geometric core block with dual operand intake conduits and flag status emitter beacons.
13. **Animation & Interaction:** Active centerpiece during `EXECUTE` stage in both `Instruction Journey` and `CPU Simulator`; visualizes operand inputs + resulting flag glow (`Z/N/C/V`).
14. **Related Topics:** `isa`, `risc-vs-cisc`, `cpu-pipelining`, `clock-frequency`
15. **Technical References:** Harris & Harris (*Digital Design and Computer Architecture*, Ch. 5 Arithmetic Circuits); Patterson & Hennessy.

#### `core-control-unit` — Control Unit (CU)
1. **Identification:** `core-control-unit` | Category: `processing-core` | Representation: `logical_subsystem`
2. **Definition:** The supervisory sequential and combinational logic unit that orchestrates instruction sequencing and drives the control signals governing every datapath component across execution stages.
3. **Primary Function:** Coordinate fetch, decode, register read, ALU operation selection, memory read/write enabling, PC increment/branching, and register write-back timing.
4. **Engineering Principles:** Finite State Machine (FSM) stage sequencing (hardwired control logic or microcoded ROM control); synchronous clock-edge coordination.
5. **Physical or Logical Construction:** Combinational decode PLA/logic arrays paired with sequential stage state flip-flops (`logic-sequential`) distributing control wires (`comm-control-signals`) across the core.
6. **Operating Mechanism:** Tracks current stage (`FETCH`..`WRITE_BACK`), reads decoded opcode and `FLAGS` (`Z`), and asserts deterministic binary control signals (`RegWrite`, `MemRead`, `MemWrite`, `ALUOp`, `PCSrc`) on each clock tick.
7. **Internal Structure:** Stage sequencer FSM, opcode-to-control matrix, branch condition evaluator (`JZ`/`JNZ`), and `PC` next-state multiplexer logic.
8. **Input and Output:** **Input:** Decoded instruction metadata from `core-instruction-decoder`, `FLAGS` (`Z, N, C, V`), clock edge from `comm-clock-distribution`. **Output:** `comm-control-signals` driving registers, ALU, LSU, and PC.
9. **Relationships:** Coordinates `core-instruction-decoder`, `core-registers`, `core-alu`, and `core-load-store-unit`; driven by `comm-clock-distribution`.
10. **Technical Parameters:** Drives a 6-stage deterministic state sequence in TIANEDGE; transitions strictly on simulated clock cycle boundaries.
11. **Real-World Application:** Hardwired RISC control pipelines and hybrid microcode sequencers in CISC processors.
12. **3D Representation:** Elevated command-hub module positioned adjacent to `core-instruction-decoder` with radiating thin amber/cyan control signal traces.
13. **Animation & Interaction:** Highlights across all 6 stages, pulsing specific outgoing control signal filaments for the active stage (`MemRead` in `FETCH`, `ALUOp` in `EXECUTE`, `RegWrite` in `WRITE_BACK`).
14. **Related Topics:** `cpu-pipelining`, `risc-vs-cisc`, `isa`, `branch-prediction`
15. **Technical References:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 4 The Processor); Harris & Harris (Ch. 7).

#### `core-registers` — Registers (Architectural Core State)
1. **Identification:** `core-registers` | Category: `processing-core` | Representation: `logical_subsystem`
2. **Definition:** The smallest, fastest on-core data storage elements directly named by processor instructions and internal execution control state.
3. **Primary Function:** Hold active operands, intermediate arithmetic values, instruction pointer (`PC`), current instruction (`IR`), memory buffer/address state (`MAR`/`MDR`), and condition flags (`FLAGS`).
4. **Engineering Principles:** Zero-cycle-overhead synchronous SRAM/flip-flop latching; architectural naming decoupled from memory bus latency; direct dual-read / single-write port topology.
5. **Physical or Logical Construction:** 8 general-purpose 32-bit registers (`R0`–`R7`) plus dedicated control/interface registers (`PC`, `IR`, `MAR`, `MDR`, `FLAGS`), physically implemented via `mem-register-file` and `logic-flip-flops`.
6. **Operating Mechanism:** During `REGISTER_READ`, source addresses (`Ra`, `Rb`) select register ports and drive data onto ALU input buses; during `WRITE_BACK`, rising clock edges capture the destination result (`Rd`) when `RegWrite = 1`.
7. **Internal Structure:** General-purpose register bank (`R0`–`R7`), `PC` increment/branch latch, `IR` instruction latch, `MAR`/`MDR` memory buffer registers, and `FLAGS` status latch.
8. **Input and Output:** **Input:** Register select indices (`Ra`, `Rb`, `Rd`), write data bus, `RegWrite` enable. **Output:** Dual read operand buses (`OpA`, `OpB`), current `PC` value.
9. **Relationships:** Architectural view of `mem-register-file`; supplies operands to `core-alu` and `core-load-store-unit`; updated by `WRITE_BACK` and `core-control-unit`.
10. **Technical Parameters:** 8 general-purpose 32-bit signed registers (`R0`–`R7`), 1-word `PC` (`0..255`), 4-bit `FLAGS` (`Z, N, C, V`); sub-nanosecond access speed in real silicon.
11. **Real-World Application:** Architectural register files (e.g., 16–32 architectural GPRs in ARM/RISC-V/x86-64, backed internally by larger physical rename files).
12. **3D Representation:** Clean 8-bank illuminated register rack plus distinct `PC` / `IR` / `FLAGS` status blocks on the core floorplan.
13. **Animation & Interaction:** Active source/destination register slots brighten during `REGISTER_READ` and `WRITE_BACK`; synced directly to Simulator telemetry table.
14. **Related Topics:** `isa`, `cache-hierarchy`, `cpu-pipelining`, `ipc`
15. **Technical References:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 2 & Ch. 4); Bryant & O'Hallaron (*CS:APP*).

#### `core-instruction-decoder` — Instruction Decoder
1. **Identification:** `core-instruction-decoder` | Category: `processing-core` | Representation: `logical_subsystem`
2. **Definition:** Combinational decode logic that extracts the opcode, register specifiers, immediate constants, and addressing mode from the fetched instruction word in `IR`.
3. **Primary Function:** Translate binary/structured instruction representations into explicit control vectors and operand identifiers required by downstream execution units.
4. **Engineering Principles:** Fixed-field opcode decoding (characteristic of RISC/educational ISAs) vs. variable-length instruction parsing; combinational bit-field slicing and sign-extension of immediates.
5. **Physical or Logical Construction:** Combinational gate logic (`logic-combinational`) wired to `IR` output lines, feeding `core-control-unit` and `core-registers` read-select inputs.
6. **Operating Mechanism:** Reads instruction stored during `FETCH`, extracts opcode (`LOAD`, `ADD`, `STORE`, `JMP`, etc.), identifies source registers (`Ra`, `Rb`), destination register (`Rd`), and sign-extends immediate or target address.
7. **Internal Structure:** Opcode recognizer, operand field splitter, immediate sign-extender, and illegal-instruction fault detector.
8. **Input and Output:** **Input:** Fetched instruction from `mem-l1-icache` / `IR`. **Output:** Parsed opcode class, register addresses (`Ra`, `Rb`, `Rd`), immediate literal, and decode-ready signal to `core-control-unit`.
9. **Relationships:** Downstream of `mem-l1-icache`; directly feeds `core-control-unit` and `core-registers`.
10. **Technical Parameters:** 1 simulated cycle (`DECODE` stage) in TIANEDGE; decodes all 16 `TIAN-ISA v1` mnemonic forms deterministically.
11. **Real-World Application:** Front-end instruction decoders (single-cycle in fixed-width RISC vs. multi-stage predecode/decode/uop-cache in x86 CISC).
12. **3D Representation:** Stepped prism logic decoder positioned between `mem-l1-icache` and `core-control-unit` with fan-out signal channels.
13. **Animation & Interaction:** Activates intensely during `DECODE` stage; splits incoming instruction packet visually into opcode + operand sub-pulses.
14. **Related Topics:** `risc-vs-cisc`, `isa`, `cpu-pipelining`, `harvard-architecture`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 3 & Appendix A); Harris & Harris (Ch. 7).

#### `core-execution-units` — Execution Units (Core Subsystem)
1. **Identification:** `core-execution-units` | Category: `processing-core` | Representation: `logical_subsystem`
2. **Definition:** The collective execution functional units inside a single core encompassing integer ALUs, multipliers, branch evaluation units, and shifter/bit-manipulation datapaths.
3. **Primary Function:** Perform diverse instruction computations in parallel or specialized functional pipelines once operands arrive from the register file.
4. **Engineering Principles:** Functional unit specialization (separating fast 1-cycle integer addition from multi-cycle multiplication or floating-point arithmetic) and issue-port dispatch.
5. **Physical or Logical Construction:** Partitioned functional blocks grouped behind operand multiplexers (`logic-multiplexers`) and connected to shared result write-back buses.
6. **Operating Mechanism:** Dispatches decoded operation type to the matching functional subunit (`core-alu` integer/logic, multiplier subunit, or branch target evaluator) and forwards completion status back to the core sequencer.
7. **Internal Structure:** Primary `core-alu` lane, multiplier datapath, shift/rotate unit, and branch resolution comparator.
8. **Input and Output:** **Input:** Operand pairs (`OpA`, `OpB`), immediate values, current `PC`, and `ALUOp` control lines. **Output:** Computation output, updated `FLAGS`, and branch taken/not-taken target resolution.
9. **Relationships:** Encompasses `core-alu` at core level; corresponds to `die-execution-units` at die-floorplan level; outputs to `WRITE_BACK` and `core-load-store-unit`.
10. **Technical Parameters:** Educational execution stage = 1 deterministic simulated cycle; real superscalar cores expose 4–8+ parallel execution ports.
11. **Real-World Application:** Superscalar multi-port execution engines enabling `IPC > 1` on modern desktop and server cores.
12. **3D Representation:** Framed execution cluster bay wrapping `core-alu` with distinct lanes indicating integer, multiply, and branch logic paths.
13. **Animation & Interaction:** Active during `EXECUTE` stage; highlights specialized lane matching instruction type (`ADD` vs `MUL` vs `JZ`).
14. **Related Topics:** `ipc`, `parallel-processing`, `cpu-pipelining`, `branch-prediction`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 3 Instruction-Level Parallelism).

#### `core-load-store-unit` — Load/Store Unit (LSU)
1. **Identification:** `core-load-store-unit` | Category: `processing-core` | Representation: `logical_subsystem`
2. **Definition:** The dedicated core subsystem responsible for calculating memory addresses and executing memory read (`LOAD [addr]` / `LOADM`) and memory write (`STORE`) transactions.
3. **Primary Function:** Decouple memory addressing and data-cache/memory bus handshakes from arithmetic ALU operations.
4. **Engineering Principles:** Load/store architecture discipline (explicit memory instructions separated from ALU register-to-register instructions), memory alignment/bounds verification, and MAR/MDR buffering.
5. **Physical or Logical Construction:** Address check/generation logic coupled to `MAR` (Memory Address Register), `MDR` (Memory Data Register), and `mem-l1-dcache` / `comm-memory-interface` ports.
6. **Operating Mechanism:** During `MEMORY_ACCESS`, latches target address (`0..255`) into `MAR`. On `LOAD [addr]`, reads `MEM[MAR]` into `MDR` for `WRITE_BACK`; on `STORE`, writes `Rs` via `MDR` into `MEM[MAR]`. Raises deterministic fault if address exceeds bounds (`>= 256`).
7. **Internal Structure:** Bounds checker, `MAR` latch, `MDR` read/write buffer, and read/write handshake state logic.
8. **Input and Output:** **Input:** Target memory address, store data from `core-registers`, `MemRead`/`MemWrite` signals from `core-control-unit`. **Output:** Read data to `WRITE_BACK`; memory bus transactions to `mem-l1-dcache` / `comm-memory-interface`.
9. **Relationships:** Interfaces between `core-registers` / `core-alu` and `mem-l1-dcache` / `comm-memory-interface`.
10. **Technical Parameters:** Addressable educational data space: `256` 32-bit signed words (`0..255`); active during `MEMORY_ACCESS` stage for `LOAD [addr]`/`LOADM` and `STORE`.
11. **Real-World Application:** Load/store queues and memory disambiguation hardware in RISC and out-of-order superscalar processors.
12. **3D Representation:** Dedicated bus-facing bridge module on the edge of the processing core adjacent to `mem-l1-dcache`.
13. **Animation & Interaction:** Illuminates brightly and dispatches signal pulses to Data Memory during `MEMORY_ACCESS` on `STORE R3, 100` or `LOAD R4, [100]`; dims/bypasses cleanly on register-only `ADD`.
14. **Related Topics:** `risc-vs-cisc`, `cache-hierarchy`, `harvard-architecture`, `ipc`
15. **Technical References:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 2 & Ch. 4); Hennessy & Patterson (Ch. 3).

---

### Group D — Memory Hierarchy (`memory-hierarchy`)

#### `mem-l1-icache` — L1 Instruction Cache (L1i)
1. **Identification:** `mem-l1-icache` | Category: `memory-hierarchy` | Representation: `logical_subsystem`
2. **Definition:** The fastest, core-private instruction-only SRAM cache directly feeding the core's front-end fetch logic.
3. **Primary Function:** Supply decoded or raw machine instructions every clock cycle without suffering main memory stalls or data-traffic contention.
4. **Engineering Principles:** Split Harvard L1 cache organization (separating instruction fetches from data accesses), spatial/temporal instruction locality, and read-only optimization.
5. **Physical or Logical Construction:** Small, ultra-low-latency SRAM tag + data arrays located immediately adjacent to `core-instruction-decoder`.
6. **Operating Mechanism:** During `FETCH`, receives `PC`, looks up matching instruction slot/line, and delivers the instruction to `IR` within minimal latency; on miss, requests instruction line from `mem-l2-cache`.
7. **Internal Structure:** Instruction tag array, instruction word bank, hit comparator, and L2 fill buffer.
8. **Input and Output:** **Input:** `PC` address from `core-registers` / `core-control-unit`. **Output:** Fetched instruction word to `core-instruction-decoder` (`IR`).
9. **Relationships:** Adjacent to `core-instruction-decoder` and `mem-l2-cache`; demonstrates `harvard-architecture` split L1 alongside `mem-l1-dcache`.
10. **Technical Parameters:** Commercial CPUs typically allocate ~32–64 KB per core with ~4-cycle hit latency; in `TIAN-ISA v1`, maps conceptually to the `InstructionMemory[0..255]` fetch unit.
11. **Real-World Application:** Split L1 instruction caches in modern x86, ARM, and RISC-V cores.
12. **3D Representation:** Deep-blue/cyan-trimmed high-speed SRAM tile nestled at the core front-end entry beside `core-instruction-decoder`.
13. **Animation & Interaction:** Active during `FETCH` stage; launches instruction pulse packet toward `core-instruction-decoder`.
14. **Related Topics:** `cache-hierarchy`, `harvard-architecture`, `cpu-pipelining`, `ipc`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 2); Bryant & O'Hallaron (*CS:APP*, Ch. 6).

#### `mem-l1-dcache` — L1 Data Cache (L1d)
1. **Identification:** `mem-l1-dcache` | Category: `memory-hierarchy` | Representation: `logical_subsystem`
2. **Definition:** The fastest, core-private data-only SRAM cache directly attached to the Load/Store Unit (`core-load-store-unit`) for operand loads and stores.
3. **Primary Function:** Provide single-digit-cycle read/write caching for frequently accessed program variables, stacks, and array elements.
4. **Engineering Principles:** Set-associative lookup, write-back vs. write-through policies, spatial locality via cache lines (commonly 64 bytes in real CPUs), and dual-access conflict avoidance vs. L1i.
5. **Physical or Logical Construction:** Low-latency multi-banked SRAM array supporting parallel tag comparison and byte/word muxing adjacent to `core-load-store-unit`.
6. **Operating Mechanism:** On `LOAD [addr]` or `STORE`, checks tag match; hits resolve directly inside L1d while misses propagate outward to `mem-l2-cache`.
7. **Internal Structure:** Tag SRAM, data SRAM ways, dirty/valid status bits, write buffer, and fill logic.
8. **Input and Output:** **Input:** Memory address (`MAR`) and store data (`MDR`) from `core-load-store-unit`. **Output:** Loaded word to `MDR`/`WRITE_BACK`; miss/writeback lines to `mem-l2-cache`.
9. **Relationships:** Directly attached to `core-load-store-unit`; backed by `mem-l2-cache`; paired counterpart to `mem-l1-icache`.
10. **Technical Parameters:** Commercial CPUs typically allocate ~32–48+ KB per core (~4–5 cycles hit latency); conceptually bridges core LSU to `DataMemory[0..255]` in TIANEDGE.
11. **Real-World Application:** Core-private L1 data caches across general-purpose processors.
12. **3D Representation:** Dedicated SRAM bay immediately adjacent to `core-load-store-unit` on the core perimeter.
13. **Animation & Interaction:** Highlights during `MEMORY_ACCESS` on `LOAD [addr]`/`LOADM` and `STORE` instructions.
14. **Related Topics:** `cache-hierarchy`, `harvard-architecture`, `ipc`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 2); Patterson & Hennessy (Ch. 5).

#### `mem-l2-cache` — L2 Cache
1. **Identification:** `mem-l2-cache` | Category: `memory-hierarchy` | Representation: `logical_subsystem`
2. **Definition:** The unified secondary SRAM cache level (holding both instructions and data) sitting between core-private L1 caches and the shared L3 cache.
3. **Primary Function:** Capture L1 instruction and data misses quickly with substantially larger capacity than L1, shielding cores from slower shared L3 and DRAM latencies.
4. **Engineering Principles:** Unified cache organization, higher associativity to lower conflict misses, and inclusion/non-inclusion coherence management.
5. **Physical or Logical Construction:** Medium-density 6T SRAM array integrated per core (or shared by small core clusters), visibly larger than L1i/L1d.
6. **Operating Mechanism:** Services miss requests from both `mem-l1-icache` and `mem-l1-dcache`; returns cached lines on hit or forwards misses onto `die-interconnect` toward `mem-l3-cache`.
7. **Internal Structure:** Unified tag/data arrays, MSHRs (Miss Status Holding Registers), prefetcher interface, and ECC parity/error protection.
8. **Input and Output:** **Input:** L1 miss fills and writebacks from `mem-l1-icache`/`mem-l1-dcache`. **Output:** Cache lines to L1; miss/snoop messages to `mem-l3-cache`.
9. **Relationships:** Bridges `mem-l1-icache`/`mem-l1-dcache` and `mem-l3-cache`; occupies dedicated region per core tile in `die-cpu-cores`.
10. **Technical Parameters:** Commercial desktop/server sizes typically range from hundreds of KB to several MB per core; typical latency ~10–15+ cycles.
11. **Real-World Application:** Private per-core L2 caches in modern desktop/mobile cores or cluster-shared L2 in efficiency core clusters.
12. **3D Representation:** Medium-scale structured SRAM block flanking each processing core tile on the die.
13. **Animation & Interaction:** Highlighted during `Cache Hierarchy` inspection and hierarchical memory pulse demos.
14. **Related Topics:** `cache-hierarchy`, `multi-core-architecture`, `ipc`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 2); Bryant & O'Hallaron (*CS:APP*, Ch. 6).

#### `mem-l3-cache` — L3 Cache (Last-Level Cache)
1. **Identification:** `mem-l3-cache` | Category: `memory-hierarchy` | Representation: `architectural_block`
2. **Definition:** The large, die-wide shared Last-Level Cache (LLC) shared across multiple processor cores to hold shared code/data and accelerate inter-core communication.
3. **Primary Function:** Minimize expensive off-die DRAM accesses and serve as the central coherence point across all cores on the die.
4. **Engineering Principles:** Distributed sliced SRAM banks connected via `die-interconnect`, directory/snoop-filter coherence tracking, and high capacity density.
5. **Physical or Logical Construction:** High-density SRAM bank arrays organized into slices corresponding to `die-cache-regions`, occupying major silicon surface area.
6. **Operating Mechanism:** Receives L2 miss transactions over `die-interconnect`, hashes target address to owning slice, resolves shared data hits or coherence invalidations, and escalates misses to `mem-main-interface`.
7. **Internal Structure:** Multi-slice SRAM data banks, snoop directory/tag arrays, ring/mesh stops, and replacement controllers.
8. **Input and Output:** **Input:** L2 miss/eviction requests from `mem-l2-cache` via `die-interconnect`. **Output:** Cache lines to requesting core; DRAM fill/writeback requests to `mem-main-interface` / `die-memory-controller`.
9. **Relationships:** Maps directly to `die-cache-regions`; connects all cores' `mem-l2-cache` blocks via `die-interconnect`; backs onto `mem-main-interface`.
10. **Technical Parameters:** Commercial processors span tens to hundreds of MB shared across cores; typical hit latency ~30–60+ cycles (order of ~10–20 ns).
11. **Real-World Application:** Shared Last-Level Cache (LLC) / 3D-stacked cache expansions in desktop and data-center CPUs.
12. **3D Representation:** Large, finely gridded shared SRAM arrays dominating the central/flanking bands of `pkg-silicon-die`.
13. **Animation & Interaction:** Illuminates alongside `die-interconnect` when isolating the full cache pyramid (`L1 -> L2 -> L3 -> Main Memory`).
14. **Related Topics:** `cache-hierarchy`, `multi-core-architecture`, `parallel-processing`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 2 & Ch. 5); Patterson & Hennessy.

#### `mem-register-file` — Register File (Memory Hierarchy Tier 0)
1. **Identification:** `mem-register-file` | Category: `memory-hierarchy` | Representation: `logical_subsystem`
2. **Definition:** The multi-ported SRAM/flip-flop storage array forming the apex (Tier 0) of the CPU memory hierarchy, directly addressable by instruction register fields.
3. **Primary Function:** Deliver multiple simultaneous operand reads and result writes within the processor core's clock cycle at minimal energy per access.
4. **Engineering Principles:** Multi-port bitcell design (e.g., 2R1W — two read ports, one write port per cycle), fixed short index addressing (`R0`–`R7` = 3-bit index), zero tag comparison overhead.
5. **Physical or Logical Construction:** Tightly pitched array of multi-ported register bitcells (`logic-flip-flops` / custom 8T register cells) wired directly to wordlines/bitlines and `core-alu` operand buses.
6. **Operating Mechanism:** Decoded `Ra`/`Rb` register indices activate parallel read wordlines during `REGISTER_READ` to emit operands simultaneously; `Rd` write wordline activates during `WRITE_BACK`.
7. **Internal Structure:** Read/write row decoders, multi-port storage cells (`R0`–`R7`), bitline sense amplifiers/drivers, and write-enable gating.
8. **Input and Output:** **Input:** `Ra`, `Rb`, `Rd` indices, write-back data, `RegWrite` strobe. **Output:** Parallel operand streams (`OpA`, `OpB`) to `core-execution-units`.
9. **Relationships:** Physical hierarchy view of `core-registers`; built from `logic-flip-flops`; fastest tier above `mem-l1-icache`/`mem-l1-dcache`.
10. **Technical Parameters:** Educational capacity: `8 × 32-bit` registers (`32 bytes` general-purpose storage); real cores allocate 16–32 architectural registers backed by 100–300+ physical rename registers.
11. **Real-World Application:** Integer and vector register files inside every CPU and GPU streaming core.
12. **3D Representation:** Compact high-precision slotted storage array inside the core next to `core-alu`, highlighted with gold port indicators.
13. **Animation & Interaction:** Active during `REGISTER_READ` and `WRITE_BACK`; individual register cells pulse when read or written in `CPU Simulator`.
14. **Related Topics:** `cache-hierarchy`, `isa`, `cpu-pipelining`, `ipc`
15. **Technical References:** Weste & Harris (*CMOS VLSI Design*, Ch. 12 Memory Design); Patterson & Hennessy (Ch. 4).

#### `mem-main-interface` — Main Memory Interface
1. **Identification:** `mem-main-interface` | Category: `memory-hierarchy` | Representation: `logical_subsystem`
2. **Definition:** The hierarchical boundary connecting on-die last-level cache (`mem-l3-cache`) through the Integrated Memory Controller (`die-memory-controller`) to external system DRAM.
3. **Primary Function:** Provide high-capacity working system memory storage when data/instructions exceed on-die cache capacity.
4. **Engineering Principles:** Latency vs. capacity trade-off (capacitor-based 1T1C DRAM density vs. 6T SRAM speed); burst cache-line transfers over external DDR channels.
5. **Physical or Logical Construction:** Logical abstraction encompassing the `die-memory-controller` interface, `comm-memory-interface` bus channels, and off-package DRAM boundary.
6. **Operating Mechanism:** When L3 cache misses (or on uncacheable/educational direct memory steps), sends read/write address and burst command out of the chip package to external DRAM arrays.
7. **Internal Structure:** Channel request queue, cache-line serializer, DRAM timing state machine, and ECC verification boundary.
8. **Input and Output:** **Input:** Cache-line fill or dirty writeback requests from `mem-l3-cache` (or `core-load-store-unit` in TIAN-ISA logical view). **Output:** 32-bit/cache-line data back to `mem-l1-dcache` / `MDR`.
9. **Relationships:** Lowest volatile tier in `memory-hierarchy`; connects `mem-l3-cache` -> `die-memory-controller` -> `pkg-electrical-contacts`; paired with `comm-memory-interface`.
10. **Technical Parameters:** Commercial capacities typically gigabytes to terabytes; access latency ~50–100+ ns (~150–300+ core cycles); educational Data Memory modeled cleanly as `256 × 32-bit` deterministic words (`MEM[0..255]`).
11. **Real-World Application:** System DDR4/DDR5/HBM memory subsystem boundary in all computers.
12. **3D Representation:** External boundary conduit extending from `die-memory-controller` to package I/O pins with visual Memory Array telemetry indicator.
13. **Animation & Interaction:** Pulses during `MEMORY_ACCESS` stage on `STORE` and `LOAD [addr]` instructions; highlights the huge latency gap in `Cache Hierarchy` comparison overlays.
14. **Related Topics:** `cache-hierarchy`, `von-neumann-architecture`, `ipc`
15. **Technical References:** Hennessy & Patterson (*Computer Architecture*, Ch. 2); Jacob, Ng & Wang (*Memory Systems*).

---

### Group E — Digital Logic Foundation (`digital-logic`)

> **Important Educational Scope Notice:** All 7 components in Group E are rendered as **enlarged conceptual 3D didactic circuits (`conceptual_enlarged`)**. They illustrate how binary voltages and switching primitives build up to CPU components; TIANEDGE does not perform physical nanometer-scale layout rendering or analog SPICE electrical simulation.

#### `logic-transistors` — Transistors (MOSFET / FinFET Conceptual Model)
1. **Identification:** `logic-transistors` | Category: `digital-logic` | Representation: `conceptual_enlarged`
2. **Definition:** Microscopic semiconductor field-effect switches (CMOS NMOS and PMOS pairs) whose gate voltage controls current flow between source and drain terminals.
3. **Primary Function:** Act as ultra-fast, solid-state voltage-controlled switches representing binary `0` (low voltage, $V_{SS}$) and `1` (high voltage, $V_{DD}$).
4. **Engineering Principles:** Complementary Metal-Oxide-Semiconductor (CMOS) operation: NMOS pulls outputs low when gate is HIGH; PMOS pulls outputs high when gate is LOW; dynamic switching power $P_{dyn} = \alpha C V^2 f$.
5. **Physical or Logical Construction:** Enlarged conceptual 3D FinFET/MOSFET cross-section showing silicon substrate, doped source/drain regions, vertical fin channel, high-k gate oxide, and metallic gate electrode.
6. **Operating Mechanism:** Applying threshold voltage ($V_{GS} > V_{th}$) to the gate creates an inversion channel allowing current conduction between source and drain; removing voltage pinches off conduction.
7. **Internal Structure:** Source terminal, Drain terminal, Gate electrode, Gate dielectric insulator, and semiconductor Channel body.
8. **Input and Output:** **Input:** Gate control voltage ($V_G$), supply voltage ($V_{DD}$/$V_{SS}$). **Output:** Switched drain/source logic level (`0` or `1`).
9. **Relationships:** Fundamental physical switching primitive composing all `logic-gates`, `logic-flip-flops`, `mem-register-file`, and `core-alu` circuits; dominates `power-consumption` and `thermal-management`.
10. **Technical Parameters:** Real modern nodes feature nanometer-scale gate pitches and switching times in picoseconds; dynamic switching power scales quadratically with supply voltage $V$ and linearly with frequency $f$.
11. **Real-World Application:** Billions of FinFET and Gate-All-Around (GAAFET) CMOS transistors integrated per processor die.
12. **3D Representation:** Cleanly sectioned, enlarged educational 3D CMOS FinFET/MOSFET stage model with labeled Gate, Source, Drain, Channel, and Oxide layers (explicitly labeled `"Conceptual Enlarged Model — Not to Scale"`).
13. **Animation & Interaction:** Interactive toggle switch lets learner toggle Gate Voltage (`0` / `1`) in isolation mode to visualize channel illumination (purely logical visual teaching aid, not SPICE simulation).
14. **Related Topics:** `power-consumption`, `thermal-management`, `clock-frequency`
15. **Technical References:** Weste & Harris (*CMOS VLSI Design*, Ch. 1–2); Harris & Harris (*Digital Design and Computer Architecture*, Ch. 1).

#### `logic-gates` — Logic Gates
1. **Identification:** `logic-gates` | Category: `digital-logic` | Representation: `conceptual_enlarged`
2. **Definition:** Elementary CMOS transistor circuits implementing Boolean algebraic functions (`NOT`, `NAND`, `NOR`, `AND`, `OR`, `XOR`) over binary voltage inputs.
3. **Primary Function:** Transform discrete binary input signals into deterministic Boolean output signals, forming the building blocks of all digital computation.
4. **Engineering Principles:** Boolean algebra, functional completeness (`NAND`/`NOR` universality), noise margins, and complementary pull-up (PMOS) / pull-down (NMOS) networks.
5. **Physical or Logical Construction:** Conceptual 3D circuit module linking a 4-transistor CMOS NAND gate pair alongside standard ANSI/IEEE Boolean gate blocks (`AND`, `OR`, `XOR`, `NOT`).
6. **Operating Mechanism:** Input combinations turn specific PMOS/NMOS paths ON or OFF so the output connects cleanly to either $V_{DD}$ (`1`) or $V_{SS}$ (`0`) with minimal static current.
7. **Internal Structure:** PMOS pull-up network, NMOS pull-down network, input gate terminals (`A`, `B`), and restored output node (`Y`).
8. **Input and Output:** **Input:** Binary logic signals (`A`, `B` ∈ `{0, 1}`). **Output:** Deterministic Boolean truth-table output (`Y` ∈ `{0, 1}`).
9. **Relationships:** Constructed from `logic-transistors`; directly composes `logic-multiplexers`, `logic-adders`, `logic-flip-flops`, `logic-combinational`, and `logic-sequential`.
10. **Technical Parameters:** Gate propagation delay ($t_{pd}$) measured in picoseconds in modern silicon; fan-out limits load capacitance.
11. **Real-World Application:** Standard-cell libraries used across synthesis of every digital ASIC and microprocessor core.
12. **3D Representation:** Enlarged modular 3D logic-gate assembly with illuminated input/output rail conduits showing binary state transitions (`0` muted blue, `1` electric cyan).
13. **Animation & Interaction:** Interactive truth-table state highlight when isolated; shows signal propagation from inputs through gate body to output.
14. **Related Topics:** `isa`, `clock-frequency`, `power-consumption`
15. **Technical References:** Harris & Harris (*Digital Design and Computer Architecture*, Ch. 1–2); Mano & Ciletti (*Digital Design*).

#### `logic-flip-flops` — Flip-Flops (Edge-Triggered Storage)
1. **Identification:** `logic-flip-flops` | Category: `digital-logic` | Representation: `conceptual_enlarged`
2. **Definition:** Bistable sequential logic elements (primarily rising-edge-triggered D-Flip-Flops) that sample an input bit on a clock edge and hold it stable across the entire clock period.
3. **Primary Function:** Store binary state reliably between combinational logic stages, enabling registers, counters, pipeline latches, and FSM memory.
4. **Engineering Principles:** Cross-coupled bistable feedback loops (Master-Slave D-latches), setup time ($t_{setup}$), hold time ($t_{hold}$), and clock-to-Q propagation delay ($t_{pcq}$).
5. **Physical or Logical Construction:** Enlarged conceptual 3D diagram/block showing paired Master and Slave D-latches controlled by complementary clock phases (`CLK`, `~CLK`).
6. **Operating Mechanism:** While `CLK = 0`, the master latch tracks input `D` while the slave holds the previous output `Q`. On the rising clock edge (`0 -> 1`), the master freezes and the slave opens to present the new `Q` cleanly.
7. **Internal Structure:** Input transmission gates, master storage inverters, slave storage inverters, and optional reset/enable gating.
8. **Input and Output:** **Input:** Data bit `D`, clock signal `CLK`, optional `EN` / `RESET`. **Output:** Stored bit `Q` and complement `~Q`.
9. **Relationships:** Built from `logic-gates` (`logic-transistors`); serves as building block of `logic-sequential`, `core-registers`, `mem-register-file`, and `core-control-unit` FSM state; synchronized by `comm-clock-distribution`.
10. **Technical Parameters:** Governs maximum `clock-frequency` via timing constraint $T_{clk} \ge t_{pcq} + t_{comb,max} + t_{setup}$.
11. **Real-World Application:** Pipeline registers, program counters, status flags, and hardware state machines in every synchronous CPU.
12. **3D Representation:** Two-stage Master/Slave conceptual module with clear clock-edge synchronization pulse ring.
13. **Animation & Interaction:** Demonstrates input `D` sampling strictly on rising `CLK` pulse edge; highlights why synchronous registers prevent glitch propagation.
14. **Related Topics:** `clock-frequency`, `cpu-pipelining`
15. **Technical References:** Harris & Harris (*Digital Design and Computer Architecture*, Ch. 3 Sequential Logic Design).

#### `logic-multiplexers` — Multiplexers (MUX Data Selectors)
1. **Identification:** `logic-multiplexers` | Category: `digital-logic` | Representation: `conceptual_enlarged`
2. **Definition:** Combinational selector circuits that route one of $2^N$ binary data inputs onto a single output line under the control of an $N$-bit select signal.
3. **Primary Function:** Implement hardware data routing, operand selection, register port selection, ALU output picking, and `PC` next-address selection (`PC+1` vs. branch target).
4. **Engineering Principles:** Sum-of-products decoding of select signals combined with AND-OR gating or CMOS transmission gates.
5. **Physical or Logical Construction:** Enlarged conceptual 4:1 / 2:1 trapezoid selector assembly with visible `In0..In3` rails, `Sel` control lines, and gated active path to `Out`.
6. **Operating Mechanism:** Binary select bits enable exactly one input channel path while isolating all others, steering the chosen signal combinational-style to the output.
7. **Internal Structure:** Select decoder logic, parallel input pass/AND gates, and OR/wired merge output driver.
8. **Input and Output:** **Input:** Multiple candidate data lines (`D0..Dn`), select control bits (`Sel`) from `core-control-unit`. **Output:** Selected single data stream (`Y`).
9. **Relationships:** Built from `logic-gates`; heavily deployed inside `core-alu`, `comm-data-paths`, `core-registers` (`PC` source MUX), and `core-instruction-decoder`.
10. **Technical Parameters:** Contributes combinational delay along ALU/bypass critical paths; scales as $2^N:1$ or tree-structured $2:1$ stages.
11. **Real-World Application:** Datapath routing, bypass/forwarding networks, and register file read-port selection in every CPU.
12. **3D Representation:** Enlarged translucent trapezoid switchboard displaying glowing active input-to-output conduit according to `Sel` control bit.
13. **Animation & Interaction:** Animates path switching cleanly whenever `core-control-unit` changes datapath source (e.g., Immediate vs Register operand in `ALU`).
14. **Related Topics:** `cpu-pipelining`, `isa`, `risc-vs-cisc`
15. **Technical References:** Harris & Harris (*Digital Design and Computer Architecture*, Ch. 2.8 Multiplexers).

#### `logic-adders` — Adders (Half, Full & Fast Adders)
1. **Identification:** `logic-adders` | Category: `digital-logic` | Representation: `conceptual_enlarged`
2. **Definition:** Combinational arithmetic circuits built from XOR, AND, and OR gates that compute the binary sum and carry-out of two binary operands.
3. **Primary Function:** Form the arithmetic heart of `core-alu` for addition, subtraction (via two's complement addition $A + \overline{B} + 1$), address calculation, and `PC` incrementing.
4. **Engineering Principles:** Half-adder ($S = A \oplus B$, $C_{out} = A \cdot B$), Full-adder with carry-in, and fast carry propagation (Carry-Lookahead / Kogge-Stone parallel-prefix trees) to overcome ripple-carry delay.
5. **Physical or Logical Construction:** Enlarged modular Full-Adder slice stacked cleanly into a multi-bit carry-chain visual model showing Sum (`S`) and Carry (`C_in -> C_out`) lanes.
6. **Operating Mechanism:** Propagates sum bits through XOR trees while computing carry generate ($G_i = A_i \cdot B_i$) and carry propagate ($P_i = A_i \oplus B_i$) terms across bit positions.
7. **Internal Structure:** Cascaded Half/Full Adder cells, carry lookahead logic, and overflow XOR comparator ($V = C_{n-1} \oplus C_n$).
8. **Input and Output:** **Input:** Two binary operands (`A`, `B`), carry-in (`C_in`). **Output:** Binary `Sum`, carry-out (`C_out`), overflow flag (`V`).
9. **Relationships:** Built from `logic-gates`; core computational kernel inside `core-alu` and `PC` incrementer; part of `logic-combinational`.
10. **Technical Parameters:** Ripple-carry delay grows linearly $O(n)$ with bit width $n$; carry-lookahead / prefix adders compress carry delay to $O(\log n)$.
11. **Real-World Application:** 32/64-bit integer ALUs, address generation units (AGUs), and floating-point mantissa adders.
12. **3D Representation:** Enlarged 4-bit educational cascaded/lookahead adder block with illuminated carry propagation wave.
13. **Animation & Interaction:** Shows carry ripples/lookahead flashes when demonstrating `ADD R3, R1, R2` inside `CPU Simulator` drill-down.
14. **Related Topics:** `clock-frequency`, `isa`, `cpu-pipelining`
15. **Technical References:** Harris & Harris (*Digital Design and Computer Architecture*, Ch. 5.2 Adders); Weste & Harris (Ch. 11).

#### `logic-combinational` — Combinational Circuits
1. **Identification:** `logic-combinational` | Category: `digital-logic` | Representation: `conceptual_enlarged`
2. **Definition:** Stateless digital logic networks whose outputs depend strictly and deterministically on the current combination of inputs after combinational propagation delay.
3. **Primary Function:** Execute decoding, multiplexing, shifting, comparison, and arithmetic transformations between clocked storage boundaries.
4. **Engineering Principles:** Memoryless Boolean mapping $Y = f(X)$, acyclic signal topology (no feedback loops), contamination delay ($t_{cd}$) vs. worst-case propagation delay ($t_{pd}$).
5. **Physical or Logical Construction:** Conceptual multi-layer acyclic gate fabric showing signal flow strictly from input pins through logic layers to output pins.
6. **Operating Mechanism:** Whenever inputs change, logic states cascade forward across gate layers until settling to stable output values prior to the next rising clock edge.
7. **Internal Structure:** Interconnected `logic-gates`, `logic-multiplexers`, decoders, comparators, and `logic-adders`.
8. **Input and Output:** **Input:** Current-cycle binary inputs. **Output:** Settled logic results ready for latching by `logic-sequential`.
9. **Relationships:** Contrasts directly with `logic-sequential`; composes `core-instruction-decoder`, `core-alu`, and control decode matrices.
10. **Technical Parameters:** Critical path ($t_{pd,max}$) across combinational cloud directly caps maximum clock speed ($f_{max} = 1 / T_{min}$).
11. **Real-World Application:** Instruction decode PLAs, ALU datapaths, barrel shifters, and cache tag comparators.
12. **3D Representation:** Enlarged layered cyan logic cloud bracketed conceptually between two input/output register barriers.
13. **Animation & Interaction:** Pulses a forward-only wave from input ports to output ports to emphasize zero internal memory state.
14. **Related Topics:** `clock-frequency`, `cpu-pipelining`
15. **Technical References:** Harris & Harris (*Digital Design and Computer Architecture*, Ch. 2 Combinational Logic Design).

#### `logic-sequential` — Sequential Circuits
1. **Identification:** `logic-sequential` | Category: `digital-logic` | Representation: `conceptual_enlarged`
2. **Definition:** State-retaining digital circuits combining combinational logic with clocked memory elements (`logic-flip-flops`) so outputs depend on both current inputs and stored history.
3. **Primary Function:** Implement finite state machines (FSMs), counters (`PC`), registers, and synchronized pipeline stages that step cleanly across clock cycles.
4. **Engineering Principles:** Synchronous state machine theory (Mealy and Moore FSM models), next-state feedback loops gated by `logic-flip-flops`, timing closure ($t_{setup}$, $t_{hold}$).
5. **Physical or Logical Construction:** Conceptual feedback-loop assembly pairing a `logic-combinational` next-state cloud with a clocked `logic-flip-flops` state register bank.
6. **Operating Mechanism:** Combinational next-state logic computes the upcoming state from current state + inputs; on the rising clock edge (`comm-clock-distribution`), `logic-flip-flops` capture the new state atomically.
7. **Internal Structure:** State register (`logic-flip-flops`), Next-State `logic-combinational` network, and Output logic network.
8. **Input and Output:** **Input:** External inputs, current state feedback, global `CLK` edge. **Output:** Updated state vector and synchronous control/data outputs.
9. **Relationships:** Contrasts with `logic-combinational`; directly underpins `core-control-unit` (6-stage FSM), `core-registers` (`PC`), and CPU cycle synchronization.
10. **Technical Parameters:** Operates strictly synchronously at clock edge intervals $T_{clk}$; deterministic state progression across cycles.
11. **Real-World Application:** Control unit FSMs, branch history tables, counters, and synchronous pipeline stage registers.
12. **3D Representation:** Enlarged closed-loop conceptual circuit showing combinational logic feeding forward into a gold-accented clocked flip-flop bank and looping back.
13. **Animation & Interaction:** Synchronizes loop advance animation explicitly with clock ticks during `Instruction Journey` or `CPU Simulator` stepping.
14. **Related Topics:** `clock-frequency`, `cpu-pipelining`, `branch-prediction`
15. **Technical References:** Harris & Harris (*Digital Design and Computer Architecture*, Ch. 3 Sequential Logic Design).

---

### Group F — Communication and Control (`communication-control`)

#### `comm-internal-buses` — Internal Buses
1. **Identification:** `comm-internal-buses` | Category: `communication-control` | Representation: `signal_overlay`
2. **Definition:** Shared parallel sets of electrical signal conductors inside the processor carrying addresses, data payloads, and control attributes between functional blocks.
3. **Primary Function:** Provide organized multi-bit transport channels separating addressing (`Address Bus`), payload transport (`Data Bus`), and coordination (`Control Bus`).
4. **Engineering Principles:** Tri-state or multiplexed bus arbitration, parallel bit-width bandwidth ($BW = W \times f_{bus}$), and bus contention prevention.
5. **Physical or Logical Construction:** Color-coded multi-rail conductor pathways (Address, Data, Control) spanning across `core-*`, `mem-*`, and `comm-memory-interface` in the 3D scene.
6. **Operating Mechanism:** During any stage, `core-control-unit` grants bus ownership to one active driver (e.g., `PC` onto Address Bus during `FETCH`, or `ALU` result onto Writeback Bus during `WRITE_BACK`).
7. **Internal Structure:** Address bus rails (`PC`/`MAR`), bidirectional/split Data bus rails (`IR`/`MDR`/`OpA`/`OpB`/`WB`), and Control bus wires.
8. **Input and Output:** **Input:** Driven outputs from registers, caches, ALU, or LSU. **Output:** Delivered words/addresses to targeted destinations.
9. **Relationships:** Connects `core-registers`, `core-instruction-decoder`, `core-alu`, `core-load-store-unit`, `mem-l1-icache`, `mem-l1-dcache`, and `comm-memory-interface`.
10. **Technical Parameters:** Conceptual 32-bit data bus / 8-bit educational address index in `TIAN-ISA v1`; commercial internal buses span 64–512+ bits wide.
11. **Real-World Application:** Internal processor core buses and AMBA/AXI SoC bus fabrics.
12. **3D Representation:** Crisp translucent metallic guide rails that glow electric cyan (`#22D3EE`) when carrying active traffic in `Signal Flow` and simulator modes.
13. **Animation & Interaction:** Illuminates active bus segment per simulation stage (`FETCH`: `PC -> L1i -> IR`; `MEMORY_ACCESS`: `LSU -> L1d/Mem`).
14. **Related Topics:** `von-neumann-architecture`, `harvard-architecture`, `clock-frequency`
15. **Technical References:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 4); Bryant & O'Hallaron (*CS:APP*).

#### `comm-data-paths` — Data Paths
1. **Identification:** `comm-data-paths` | Category: `communication-control` | Representation: `signal_overlay`
2. **Definition:** The complete directional flow network of registers, multiplexers, buses, and execution units through which instruction operands and results travel during execution.
3. **Primary Function:** Define the physical and logical routes data follows across every step of the `FETCH -> DECODE -> REGISTER_READ -> EXECUTE -> MEMORY_ACCESS -> WRITE_BACK` cycle.
4. **Engineering Principles:** Datapath vs. Control separation (datapaths carry operands/results; control unit selects MUX paths and latch enables); single-cycle vs. multi-stage datapath partitioning.
5. **Physical or Logical Construction:** Directed topological graph of spline segments (`edgeId`) linking `mem-l1-icache` -> `core-instruction-decoder` -> `core-registers` -> `core-alu` -> `core-load-store-unit` -> `core-registers`.
6. **Operating Mechanism:** On every simulated cycle, `CpuSnapshot.activePaths` specifies exact active datapath edges, triggering luminous cyan packet flow between the exact source and destination components.
7. **Internal Structure:** Fetch path, Decode split path, Dual Operand Read paths (`Ra->ALU`, `Rb->ALU`), Execute result path, Memory Load/Store paths, and Register Write-Back feedback loop.
8. **Input and Output:** **Input:** Active stage and opcode semantics from `core-control-unit`. **Output:** Synchronized operand delivery and visual packet trajectory vectors.
9. **Relationships:** Unifies `core-registers`, `core-instruction-decoder`, `core-alu`, `core-load-store-unit`, `mem-l1-icache`, `mem-l1-dcache`, and `logic-multiplexers`.
10. **Technical Parameters:** Mapped to canonical `DataPathEdgeId` identifiers shared verbatim between Rust/WASM (`SIMULATION_SPEC.md`) and 3D splines (`ANIMATION_SPEC.md`).
11. **Real-World Application:** Processor datapath microarchitecture blueprints in RISC and superscalar cores.
12. **3D Representation:** Dedicated curved spline trace network floating slightly above core components for unambiguous directional flow visualization.
13. **Animation & Interaction:** Animates glowing cyan data packets moving smoothly from source component to destination component during active stages.
14. **Related Topics:** `cpu-pipelining`, `isa`, `von-neumann-architecture`, `harvard-architecture`
15. **Technical References:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 4 Building a Datapath).

#### `comm-control-signals` — Control Signals
1. **Identification:** `comm-control-signals` | Category: `communication-control` | Representation: `signal_overlay`
2. **Definition:** Dedicated binary and multi-bit command wires asserted by `core-control-unit` to instruct every datapath component how to behave on a given clock cycle.
3. **Primary Function:** Synchronize multiplexers, register write-enables (`RegWrite`), memory enables (`MemRead`, `MemWrite`), ALU function selectors (`ALUOp`), and PC updates (`PCSrc`).
4. **Engineering Principles:** Hardwired combinational control decoding; explicit separation of data planes (electric cyan) from control assertion lines (warm gold `#F59E0B`).
5. **Physical or Logical Construction:** Fine radiating filament overlays connecting `core-control-unit` directly to MUXes, register write ports, ALU mode inputs, and LSU read/write pins.
6. **Operating Mechanism:** At the onset of each stage, `core-control-unit` drives exact signal tuples (e.g., `ALUOp=ADD, RegWrite=1` in `EXECUTE`/`WRITE_BACK`) visualized live in both 3D filaments and simulator telemetry.
7. **Internal Structure:** `PCWrite`, `IRWrite`, `RegWrite`, `ALUSrc`, `ALUOp`, `MemRead`, `MemWrite`, `MemToReg`, and `BranchTaken` control lines.
8. **Input and Output:** **Input:** Decoded opcode and `FLAGS` into `core-control-unit`. **Output:** Synchronized control signals into all `core-*` and `comm-data-paths` MUXes.
9. **Relationships:** Originated by `core-control-unit`; steers `core-registers`, `core-alu`, `core-load-store-unit`, and `logic-multiplexers`.
10. **Technical Parameters:** Modeled explicitly as deterministic per-stage boolean/enum flags inside `CpuSnapshot.controlSignals`.
11. **Real-World Application:** Pipeline control buses inside microprocessor control paths.
12. **3D Representation:** Distinct thin warm-gold (`#F59E0B`) micro-filaments branching from `core-control-unit` so users immediately distinguish *control* (gold) from *data* (cyan).
13. **Animation & Interaction:** Only the control lines asserted as active (`true`) in the current simulator stage illuminate brightly.
14. **Related Topics:** `cpu-pipelining`, `risc-vs-cisc`, `isa`
15. **Technical References:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 4 Control Overview).

#### `comm-clock-distribution` — Clock Distribution
1. **Identification:** `comm-clock-distribution` | Category: `communication-control` | Representation: `signal_overlay`
2. **Definition:** The synchronized timing network (PLL clock generator + balanced H-tree / resonant clock mesh) delivering uniform periodic clock pulses across the entire silicon die.
3. **Primary Function:** Coordinate state transitions across millions of sequential elements (`logic-flip-flops`, registers, pipeline latches) with minimal clock skew.
4. **Engineering Principles:** Equal wire-length balanced tree topology (H-tree) minimizing skew ($\Delta t_{skew}$), clock gating to save dynamic power in idle blocks, and phase-locked loop (PLL) frequency synthesis.
5. **Physical or Logical Construction:** Symmetrical fractal H-tree metallic conductor overlay branching evenly across `die-cpu-cores` and core stage registers, anchored by an external reference crystal input via `pkg-electrical-contacts`.
6. **Operating Mechanism:** Every rising clock tick synchronously latches updated state across `core-control-unit`, `core-registers`, and pipeline boundaries; idle regions can be clock-gated off to lower power.
7. **Internal Structure:** PLL frequency multiplier block, trunk clock buffers, symmetric H-tree branches, local clock gating cells, and leaf flip-flop clock pins.
8. **Input and Output:** **Input:** External reference clock via `pkg-electrical-contacts` + power management gating signals. **Output:** Phase-aligned `CLK` timing edges across all sequential subsystems.
9. **Relationships:** Drives `logic-flip-flops`, `logic-sequential`, `core-control-unit`, `core-registers`, and `die-cpu-cores`; directly governs `clock-frequency` and dynamic `power-consumption`.
10. **Technical Parameters:** Modern processors run GHz-class clocks (`10^9` cycles/sec) with clock skew held to tens of picoseconds; clock tree itself can consume ~20%–40% of dynamic core power without aggressive clock gating.
11. **Real-World Application:** Balanced H-tree / spine-and-rib / resonant clock grids in high-frequency desktop and server CPUs.
12. **3D Representation:** Symmetric geometric H-tree fractal overlay above the silicon die/core plane that pulses rhythmically with simulated clock ticks.
13. **Animation & Interaction:** Pulses outward radially across the H-tree whenever the user triggers `Step Forward` or during continuous `Run` ticks (respecting reduced-motion).
14. **Related Topics:** `clock-frequency`, `power-consumption`, `thermal-management`, `cpu-pipelining`
15. **Technical References:** Weste & Harris (*CMOS VLSI Design*, Ch. 13 Clocking); Harris & Harris (Ch. 3 Timing).

#### `comm-interconnect-network` — Interconnect Network
1. **Identification:** `comm-interconnect-network` | Category: `communication-control` | Representation: `signal_overlay`
2. **Definition:** The high-level logical topology connecting cores, shared caches, memory controllers, and I/O blocks into one coherent multiprocessor fabric.
3. **Primary Function:** Enable scalable parallel data exchange and cache coherence traffic across multi-core and heterogeneous die subsystems without point-to-point wiring explosion.
4. **Engineering Principles:** Ring vs. 2D Mesh vs. Crossbar Network-on-Chip (NoC) topologies; hop latency vs. bisection bandwidth trade-offs; packet switching with virtual channels to prevent protocol deadlock.
5. **Physical or Logical Construction:** Bidirectional multi-ring or 2D grid overlay mapped directly onto `die-interconnect`, featuring router switch nodes at every core and LLC slice intersection.
6. **Operating Mechanism:** Encapsulates core cache misses, coherence probes, and DMA requests into routed flits traversing switches from source stop to target stop (`die-cache-regions` or `die-memory-controller`).
7. **Internal Structure:** Router switch nodes, directional link lanes, credit flow-control buffers, and protocol bridge ports.
8. **Input and Output:** **Input:** Coherent memory/snoop requests from `die-cpu-cores` and `die-io-controller`. **Output:** Routed transactions to target `mem-l3-cache` slices or `die-memory-controller`.
9. **Relationships:** Logical/signal overlay companion to `die-interconnect`; links `die-cpu-cores`, `mem-l3-cache`, `die-memory-controller`, and `die-io-controller`.
10. **Technical Parameters:** Hop count scales $O(N)$ on rings vs. $O(\sqrt{N})$ Manhattan distance on 2D meshes; operates across high-width internal links.
11. **Real-World Application:** Multi-core ring interconnects, mesh NoCs, and die-to-die chiplet fabrics.
12. **3D Representation:** Luminous topology overlay spanning all 4 core tiles, cache slices, and edge controllers in `Signal Flow` and `Internal Architecture` modes.
13. **Animation & Interaction:** Animated packets circulate between cores and L3 slices when `Multi-core Architecture` or `Signal Flow` mode is active.
14. **Related Topics:** `multi-core-architecture`, `parallel-processing`, `cache-hierarchy`
15. **Technical References:** Dally & Towles (*Principles and Practices of Interconnection Networks*); Hennessy & Patterson (Ch. 5).

#### `comm-memory-interface` — Memory Interface (Bus & Protocol Bridge)
1. **Identification:** `comm-memory-interface` | Category: `communication-control` | Representation: `logical_subsystem`
2. **Definition:** The internal-to-external memory transaction interface bridging `core-load-store-unit` (`MAR`/`MDR`) and `mem-l1-icache`/`mem-l1-dcache` onto `die-memory-controller` and external `mem-main-interface`.
3. **Primary Function:** Serialize memory read/write requests, buffer addresses and data payloads (`MAR`/`MDR`), and decouple synchronous core timing from off-core memory response latencies.
4. **Engineering Principles:** Address/data/control handshaking (`Req`/`Ack`), Memory Address Register (`MAR`) & Memory Data Register (`MDR`) buffering, and asynchronous clock/latency decoupling.
5. **Physical or Logical Construction:** Explicit `MAR`/`MDR` interface latches plus dual-directional address and data conduits connecting core LSU/L1 boundary to `die-memory-controller`.
6. **Operating Mechanism:** Receives target address into `MAR` and outbound data into `MDR` (for `STORE`); asserts `MemRead` or `MemWrite`; returns retrieved word into `MDR` (for `LOAD [addr]`) ready for `WRITE_BACK`.
7. **Internal Structure:** `MAR` latch, `MDR` bidirectional buffer, read/write handshake FSM, and outbound bus drivers.
8. **Input and Output:** **Input:** Address, data, and `MemRead`/`MemWrite` controls from `core-load-store-unit` / `core-control-unit`. **Output:** Memory channel request to `die-memory-controller` / `mem-main-interface`; read word back to `WRITE_BACK`.
9. **Relationships:** Bridges `core-load-store-unit` and `mem-main-interface` / `die-memory-controller`; exposes `MAR` and `MDR` telemetry visible in `CPU Simulator`.
10. **Technical Parameters:** Directly maps to `MAR` (`0..255`) and `MDR` (`i32`) special registers in `TIAN-ISA v1`.
11. **Real-World Application:** Bus Interface Units (BIUs) and cache-to-memory controller transaction bridges.
12. **3D Representation:** Precision interface dock linking the core boundary to the die memory controller channel, displaying live `MAR` / `MDR` activity pulses.
13. **Animation & Interaction:** Lights up during `FETCH` (conceptual instruction memory link) and `MEMORY_ACCESS` (`STORE`/`LOAD [addr]`) with animated bidirectional packet transfer.
14. **Related Topics:** `von-neumann-architecture`, `harvard-architecture`, `cache-hierarchy`
15. **Technical References:** Patterson & Hennessy (*Computer Organization and Design*, Ch. 4–5); Tanenbaum & Austin (*Structured Computer Organization*).

---

## 5. Cross-Document Traceability Matrix

- Canonical `componentId` schemas & TypeScript/Rust mappings: [DATA_MODEL.md](./DATA_MODEL.md)
- Geometry, GLB naming & material rules for all 36 components: [ASSET_GUIDELINES.md](./ASSET_GUIDELINES.md)
- Idle & guided highlight/pulse animations per `componentId`: [ANIMATION_SPEC.md](./ANIMATION_SPEC.md)
- Component activation per simulation stage: [SIMULATION_SPEC.md](./SIMULATION_SPEC.md) & [INSTRUCTION_JOURNEY_SPEC.md](./INSTRUCTION_JOURNEY_SPEC.md)
- Links to all 13 deep-dive topics: [ENGINEERING_CONTENT_SPEC.md](./ENGINEERING_CONTENT_SPEC.md)
