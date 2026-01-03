export type StateMatrix = number[][]; // 4x4 matrix of bytes

export enum StepType {
  INITIAL = 'INITIAL',
  SUB_BYTES = 'SUB_BYTES',
  SHIFT_ROWS = 'SHIFT_ROWS',
  MIX_COLUMNS = 'MIX_COLUMNS',
  ADD_ROUND_KEY = 'ADD_ROUND_KEY',
  FINAL = 'FINAL'
}

export interface AESTraceStep {
  round: number;
  stepIndex: number; // Global step index
  type: StepType;
  description: string;
  state: StateMatrix; // The 4x4 state matrix AFTER the operation
  roundKey?: StateMatrix; // The key used in this step (if applicable)
  highlightIndices?: [number, number][]; // Coordinates to highlight
}

export interface AESSimulation {
  originalInput: string;
  originalKey: string;
  expandedKey: number[];
  steps: AESTraceStep[];
}