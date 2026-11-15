import type { DataPathEdgeId } from '../types/models';

export interface DataPathRoute {
  id: DataPathEdgeId;
  label: string;
  color: string;
  points: [number, number, number][];
}

export const DATA_PATH_ROUTES: Record<DataPathEdgeId, DataPathRoute> = {
  pc_to_l1i: {
    id: 'pc_to_l1i',
    label: 'PC -> L1 Instruction Cache',
    color: '#00E5FF',
    points: [
      [-0.55, 0.27, -0.25],
      [-0.66, 0.28, -0.44],
      [-0.72, 0.26, -0.66],
    ],
  },
  l1i_to_ir: {
    id: 'l1i_to_ir',
    label: 'L1 I-Cache -> Instruction Register',
    color: '#00E5FF',
    points: [
      [-0.72, 0.25, -0.66],
      [-0.67, 0.27, -0.62],
      [-0.62, 0.26, -0.58],
    ],
  },
  ir_to_decoder: {
    id: 'ir_to_decoder',
    label: 'IR -> Instruction Decoder',
    color: '#38bdf8',
    points: [
      [-0.62, 0.26, -0.58],
      [-0.60, 0.28, -0.50],
      [-0.58, 0.26, -0.44],
    ],
  },
  decoder_to_cu: {
    id: 'decoder_to_cu',
    label: 'Instruction Decoder -> Control Unit',
    color: '#FBBF24',
    points: [
      [-0.62, 0.26, -0.58],
      [-0.58, 0.28, -0.40],
      [-0.55, 0.27, -0.25],
    ],
  },
  regs_to_alu_opA: {
    id: 'regs_to_alu_opA',
    label: 'Register File -> ALU Operand A',
    color: '#00E5FF',
    points: [
      [-0.30, 0.26, -0.50],
      [-0.38, 0.28, -0.50],
      [-0.48, 0.26, -0.50],
    ],
  },
  regs_to_alu_opB: {
    id: 'regs_to_alu_opB',
    label: 'Register File -> ALU Operand B',
    color: '#00E5FF',
    points: [
      [-0.30, 0.26, -0.42],
      [-0.39, 0.28, -0.44],
      [-0.48, 0.26, -0.46],
    ],
  },
  alu_compute_internal: {
    id: 'alu_compute_internal',
    label: 'ALU Combinational Compute Core',
    color: '#00E5FF',
    points: [
      [-0.54, 0.27, -0.48],
      [-0.48, 0.30, -0.48],
      [-0.42, 0.27, -0.48],
    ],
  },
  alu_to_flags: {
    id: 'alu_to_flags',
    label: 'ALU -> FLAGS Status Latches',
    color: '#FBBF24',
    points: [
      [-0.48, 0.27, -0.48],
      [-0.52, 0.28, -0.36],
      [-0.55, 0.27, -0.25],
    ],
  },
  lsu_to_l1d: {
    id: 'lsu_to_l1d',
    label: 'Load/Store Unit -> L1 Data Cache',
    color: '#FBBF24',
    points: [
      [-0.25, 0.26, -0.25],
      [-0.20, 0.27, -0.25],
      [-0.14, 0.26, -0.25],
    ],
  },
  l1d_to_mem_if: {
    id: 'l1d_to_mem_if',
    label: 'L1 D-Cache <-> Memory Interface & Controller',
    color: '#00E5FF',
    points: [
      [-0.14, 0.26, -0.25],
      [0.0, 0.23, 0.20],
      [0.0, 0.22, 0.45],
      [0.0, 0.21, 0.72],
    ],
  },
  alu_to_wb_regs: {
    id: 'alu_to_wb_regs',
    label: 'ALU Result -> Register File Write-Back',
    color: '#10B981',
    points: [
      [-0.48, 0.27, -0.48],
      [-0.39, 0.29, -0.55],
      [-0.30, 0.26, -0.45],
    ],
  },
  mdr_to_wb_regs: {
    id: 'mdr_to_wb_regs',
    label: 'MDR / L1 D-Cache -> Register File Write-Back',
    color: '#10B981',
    points: [
      [-0.14, 0.26, -0.25],
      [-0.22, 0.28, -0.35],
      [-0.30, 0.26, -0.45],
    ],
  },
  alu_bypass_mem: {
    id: 'alu_bypass_mem',
    label: 'Execution Bypass Around Memory Access',
    color: '#A78BFA',
    points: [
      [-0.48, 0.27, -0.48],
      [-0.39, 0.30, -0.36],
      [-0.30, 0.26, -0.45],
    ],
  },
};

export const ALL_DATA_PATH_IDS = Object.keys(DATA_PATH_ROUTES) as DataPathEdgeId[];
