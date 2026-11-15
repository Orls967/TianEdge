export interface SimulatorPreset {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  expectedOutcome: string;
  relatedInsightIds: string[];
  source: string;
}

export const SIMULATOR_PRESETS: SimulatorPreset[] = [
  {
    id: 'canonical-addition',
    title: 'Register Addition & Memory Store',
    subtitle: 'Canonical 4-instruction baseline (24 cycles)',
    description:
      'Loads immediate values into R1 and R2, computes R3 = R1 + R2 inside the ALU, and commits R3 to data memory address 100.',
    expectedOutcome: 'R1=10, R2=20, R3=30, MEM[100]=30 in 24 clock cycles.',
    relatedInsightIds: [
      'insight-03-isa-machine-code',
      'insight-04-instruction-cycle',
      'insight-05-alu-arithmetic',
    ],
    source: `; TIANEDGE Canonical Baseline Program
LOAD R1, 10
LOAD R2, 20
ADD R3, R1, R2
STORE R3, 100`,
  },
  {
    id: 'journey-store-memory',
    title: 'Memory Store & Read-Back',
    subtitle: 'Explicit MAR/MDR data memory roundtrip',
    description:
      'Demonstrates moving a register operand through the Memory Data Register (MDR) and Memory Address Register (MAR) into Data Memory and reading it back.',
    expectedOutcome: 'MEM[100]=42, R2=42, clockCycles=24.',
    relatedInsightIds: ['insight-06-registers-vs-ram', 'insight-07-memory-hierarchy'],
    source: `; Data Memory Write & Read-Back
LOAD R1, 42
STORE R1, 100
LOAD R2, [100]
HALT`,
  },
  {
    id: 'sum-loop',
    title: 'Iterative Sum Loop (1 to 5)',
    subtitle: 'Conditional branching with CMP, JZ, and JMP',
    description:
      'Accumulates integers 1 through 5 in R1 using a loop counter in R2 and limit check via CMP/JNZ/JZ.',
    expectedOutcome: 'R1=15 after loop termination.',
    relatedInsightIds: ['insight-04-instruction-cycle', 'insight-10-clock-timing'],
    source: `; Sum integers 1..5 in R1
LOAD R1, 0
LOAD R2, 1
LOAD R3, 5
LOAD R4, 1
loop:
ADD R1, R1, R2
ADD R2, R2, R4
CMP R2, R3
JZ apply_last
CMP R3, R2
JNZ loop
apply_last:
ADD R1, R1, R2
HALT`,
  },
  {
    id: 'alu-flags-branch',
    title: 'ALU Flags & Signed Underflow',
    subtitle: 'Zero, Negative, Carry, and Logic operations',
    description:
      'Exercises SUB, MUL, AND, OR, XOR and tests Zero (Z) and Negative (N) processor status flags before branching.',
    expectedOutcome: 'R3=0 (Z=true via SUB), R7=-5 (N=true), R5=42.',
    relatedInsightIds: ['insight-05-alu-arithmetic', 'insight-02-transistors-cmos-logic'],
    source: `; ALU Operations & Condition Flags
LOAD R1, 12
LOAD R2, 12
SUB R3, R1, R2
JZ zero_ok
LOAD R5, 99
JMP next_test
zero_ok:
LOAD R5, 42
next_test:
LOAD R1, 3
LOAD R2, 8
SUB R7, R1, R2
MUL R4, R1, R2
AND R6, R4, R5
HALT`,
  },
  {
    id: 'indirect-memory',
    title: 'Pointer / Indirect Memory Access',
    subtitle: 'Register-addressed Data Memory read & write',
    description:
      'Uses R1 as a dynamic memory pointer with STORE Rs, [Rd] and LOADM Rd, [Rs].',
    expectedOutcome: 'MEM[50]=77, R3=77.',
    relatedInsightIds: ['insight-06-registers-vs-ram', 'insight-08-system-bus'],
    source: `; Register-Indirect Addressing
LOAD R1, 50
LOAD R2, 77
STORE R2, [R1]
LOADM R3, [R1]
HALT`,
  },
];

export function getPresetById(id: string): SimulatorPreset {
  return SIMULATOR_PRESETS.find((preset) => preset.id === id) ?? SIMULATOR_PRESETS[0];
}
