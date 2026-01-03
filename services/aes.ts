import { AESTraceStep, StepType, StateMatrix, AESSimulation } from '../types';

// S-Box Table - Exported for UI Visualization
export const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
];

// Round Constant Table
const RCON = [
  0x00, 0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36
];

// Helper: Deep copy a matrix
const copyState = (s: StateMatrix): StateMatrix => s.map(row => [...row]);

// Helper: Convert string to byte array (padded to 16 bytes)
const stringToBytes = (str: string): number[] => {
  const bytes = new Array(16).fill(0);
  for (let i = 0; i < Math.min(str.length, 16); i++) {
    bytes[i] = str.charCodeAt(i);
  }
  return bytes;
};

// Helper: Convert 1D array to 4x4 Column-Major Matrix
// In AES, Input = [0, 1, 2, 3, 4...]
// Matrix =
//  0  4  8 12
//  1  5  9 13
//  2  6 10 14
//  3  7 11 15
const toStateMatrix = (bytes: number[]): StateMatrix => {
  const state: number[][] = Array(4).fill(0).map(() => Array(4).fill(0));
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      state[r][c] = bytes[c * 4 + r];
    }
  }
  return state;
};

// Helper: Convert 4x4 Matrix back to 1D array
const fromStateMatrix = (state: StateMatrix): number[] => {
  const bytes = new Array(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      bytes[c * 4 + r] = state[r][c];
    }
  }
  return bytes;
};

// AES Core: Key Expansion
const keyExpansion = (key: number[]): number[] => {
  const w = new Array(176).fill(0); // 16 bytes * (10 rounds + 1) = 176 bytes
  let i = 0;
  
  while (i < 16) {
    w[i] = key[i];
    i++;
  }

  i = 16;
  let bytesGenerated = 16;
  let rconIteration = 1;

  while (bytesGenerated < 176) {
    // Read previous 4 bytes (temp word)
    let t = [w[i - 4], w[i - 3], w[i - 2], w[i - 1]];

    if (bytesGenerated % 16 === 0) {
      // RotWord
      const tmp = t[0];
      t[0] = t[1];
      t[1] = t[2];
      t[2] = t[3];
      t[3] = tmp;

      // SubWord
      t = t.map(b => SBOX[b]);

      // Rcon XOR
      t[0] ^= RCON[rconIteration];
      rconIteration++;
    }

    for (let k = 0; k < 4; k++) {
      w[i] = w[i - 16] ^ t[k];
      i++;
    }
    bytesGenerated += 4;
  }
  return w;
};

// AES Core: AddRoundKey
const addRoundKey = (state: StateMatrix, roundKey: number[]): StateMatrix => {
  const newState = copyState(state);
  const keyMatrix = toStateMatrix(roundKey);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      newState[r][c] ^= keyMatrix[r][c];
    }
  }
  return newState;
};

// AES Core: SubBytes
const subBytes = (state: StateMatrix): StateMatrix => {
  const newState = copyState(state);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      newState[r][c] = SBOX[newState[r][c]];
    }
  }
  return newState;
};

// AES Core: ShiftRows
const shiftRows = (state: StateMatrix): StateMatrix => {
  const newState = copyState(state);
  // Row 1: shift left 1
  let tmp = newState[1][0];
  newState[1][0] = newState[1][1];
  newState[1][1] = newState[1][2];
  newState[1][2] = newState[1][3];
  newState[1][3] = tmp;

  // Row 2: shift left 2
  tmp = newState[2][0];
  let tmp2 = newState[2][1];
  newState[2][0] = newState[2][2];
  newState[2][1] = newState[2][3];
  newState[2][2] = tmp;
  newState[2][3] = tmp2;

  // Row 3: shift left 3
  tmp = newState[3][3];
  newState[3][3] = newState[3][2];
  newState[3][2] = newState[3][1];
  newState[3][1] = newState[3][0];
  newState[3][0] = tmp;

  return newState;
};

// AES Core: Galois Field Multiplication
const gmul = (a: number, b: number): number => {
  let p = 0;
  for (let i = 0; i < 8; i++) {
    if ((b & 1) !== 0) p ^= a;
    const hiBitSet = (a & 0x80) !== 0;
    a = (a << 1) & 0xff;
    if (hiBitSet) a ^= 0x1b;
    b >>= 1;
  }
  return p;
};

// AES Core: MixColumns
const mixColumns = (state: StateMatrix): StateMatrix => {
  const newState = copyState(state);
  for (let c = 0; c < 4; c++) {
    const s0 = newState[0][c];
    const s1 = newState[1][c];
    const s2 = newState[2][c];
    const s3 = newState[3][c];

    newState[0][c] = gmul(s0, 2) ^ gmul(s1, 3) ^ s2 ^ s3;
    newState[1][c] = s0 ^ gmul(s1, 2) ^ gmul(s2, 3) ^ s3;
    newState[2][c] = s0 ^ s1 ^ gmul(s2, 2) ^ gmul(s3, 3);
    newState[3][c] = gmul(s0, 3) ^ s1 ^ s2 ^ gmul(s3, 2);
  }
  return newState;
};

export const generateAESSimulation = (input: string, key: string): AESSimulation => {
  const steps: AESTraceStep[] = [];
  const inputBytes = stringToBytes(input);
  const keyBytes = stringToBytes(key);
  
  // 1. Initial State
  let currentState = toStateMatrix(inputBytes);
  let globalStepIndex = 0;

  // 2. Key Expansion
  const expandedKey = keyExpansion(keyBytes);

  // Helper to push step
  const recordStep = (type: StepType, desc: string, round: number, roundKey?: number[]) => {
    steps.push({
      round,
      stepIndex: globalStepIndex++,
      type,
      description: desc,
      state: copyState(currentState),
      roundKey: roundKey ? toStateMatrix(roundKey) : undefined,
    });
  };

  recordStep(StepType.INITIAL, "초기 상태 (Initial State): 입력 평문을 4x4 상태 행렬로 변환합니다.", 0);

  // 3. Initial Round Key Addition
  const round0Key = expandedKey.slice(0, 16);
  currentState = addRoundKey(currentState, round0Key);
  recordStep(StepType.ADD_ROUND_KEY, "Round 0: 초기 라운드 키 더하기 (AddRoundKey). 입력 행렬과 첫 번째 라운드 키를 XOR 연산합니다.", 0, round0Key);

  // 4. Rounds 1 to 9
  for (let round = 1; round <= 9; round++) {
    // SubBytes
    currentState = subBytes(currentState);
    recordStep(StepType.SUB_BYTES, `Round ${round}: 바이트 치환 (SubBytes). S-Box를 사용하여 각 바이트를 비선형적으로 치환합니다.`, round);

    // ShiftRows
    currentState = shiftRows(currentState);
    recordStep(StepType.SHIFT_ROWS, `Round ${round}: 행 이동 (ShiftRows). 각 행을 순환 이동시켜 열 간의 연관성을 낮춥니다.`, round);

    // MixColumns
    currentState = mixColumns(currentState);
    recordStep(StepType.MIX_COLUMNS, `Round ${round}: 열 섞기 (MixColumns). 각 열에 대해 수학적 변환을 수행하여 데이터를 혼합합니다.`, round);

    // AddRoundKey
    const currentRoundKey = expandedKey.slice(round * 16, (round + 1) * 16);
    currentState = addRoundKey(currentState, currentRoundKey);
    recordStep(StepType.ADD_ROUND_KEY, `Round ${round}: 라운드 키 더하기 (AddRoundKey). 현재 라운드의 키와 상태 행렬을 XOR 합니다.`, round, currentRoundKey);
  }

  // 5. Final Round (10)
  const round = 10;
  currentState = subBytes(currentState);
  recordStep(StepType.SUB_BYTES, `Round ${round} (Final): 바이트 치환 (SubBytes).`, round);

  currentState = shiftRows(currentState);
  recordStep(StepType.SHIFT_ROWS, `Round ${round} (Final): 행 이동 (ShiftRows). 마지막 라운드에서는 MixColumns가 생략됩니다.`, round);

  const finalRoundKey = expandedKey.slice(round * 16, (round + 1) * 16);
  currentState = addRoundKey(currentState, finalRoundKey);
  recordStep(StepType.ADD_ROUND_KEY, `Round ${round} (Final): 라운드 키 더하기 (AddRoundKey). 암호화의 마지막 단계입니다.`, round, finalRoundKey);
  
  recordStep(StepType.FINAL, "암호화 완료! 최종 상태 행렬이 암호문이 됩니다.", round);

  return {
    originalInput: input,
    originalKey: key,
    expandedKey,
    steps
  };
};