import {
  NOMINAL_CODE_COLUMNS,
  TARGET,
  deduplicateRecords,
  normalizeTargetSeries,
  parseBooleanLike,
} from './dataset.js';

export type ModelName = 'Árbol de decisión' | 'Random Forest' | 'Regresión logística';

export const MODEL_NAMES: ModelName[] = [
  'Árbol de decisión',
  'Random Forest',
  'Regresión logística',
];

export interface NumericRange {
  minimum: number;
  maximum: number;
  median: number;
}

export interface CleanRow {
  numeric: Record<string, number>;
  categorical: Record<string, string>;
  revenue: boolean;
}

export interface TrainingDataset {
  rows: CleanRow[];
  rowsLoaded: number;
  rowsUsed: number;
  duplicatesRemoved: number;
  featureColumns: string[];
  numericColumns: string[];
  categoricalColumns: string[];
  categoricalOptions: Record<string, string[]>;
  numericRanges: Record<string, NumericRange>;
}

interface TreeNode {
  leaf: boolean;
  prob: number;
  featureIdx?: number;
  threshold?: number;
  left?: TreeNode;
  right?: TreeNode;
}

export interface TrainedModels {
  predictProbability: (model: ModelName, features: Record<string, unknown>) => number;
}

function medianOf(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  return n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function prepareTrainingDataset(
  columns: string[],
  rawRecords: Record<string, string>[]
): TrainingDataset {
  if (!columns.includes(TARGET)) {
    throw new Error(`No se encontró la columna objetivo '${TARGET}'.`);
  }
  if (rawRecords.length < 10) {
    throw new Error('Se necesitan al menos 10 filas para entrenar y evaluar.');
  }

  const { cleanRecords, duplicatesRemoved } = deduplicateRecords(columns, rawRecords);
  const targets = normalizeTargetSeries(cleanRecords.map((r) => r[TARGET]));

  const featureColumns = columns.filter((c) => c !== TARGET && c !== 'Session_ID');
  if (featureColumns.length === 0) {
    throw new Error('No hay variables predictoras disponibles.');
  }

  const categoricalColumns: string[] = [];
  const numericColumns: string[] = [];

  for (const col of featureColumns) {
    if (NOMINAL_CODE_COLUMNS.has(col)) {
      categoricalColumns.push(col);
      continue;
    }
    if (col === 'Weekend') {
      numericColumns.push(col);
      continue;
    }
    let allNumericOrMissing = true;
    for (const row of cleanRecords) {
      const val = row[col];
      if (val === undefined || val.trim() === '') continue;
      if (Number.isNaN(Number(val.trim()))) {
        allNumericOrMissing = false;
        break;
      }
    }
    if (allNumericOrMissing) {
      numericColumns.push(col);
    } else {
      categoricalColumns.push(col);
    }
  }

  const numericValuesByCol: Record<string, number[]> = {};
  for (const col of numericColumns) {
    numericValuesByCol[col] = [];
  }
  const catSetsByCol: Record<string, Set<string>> = {};
  for (const col of categoricalColumns) {
    catSetsByCol[col] = new Set<string>();
  }

  const rows: CleanRow[] = cleanRecords.map((raw, idx) => {
    const numeric: Record<string, number> = {};
    const categorical: Record<string, string> = {};

    for (const col of numericColumns) {
      let num: number;
      if (col === 'Weekend') {
        const parsed = parseBooleanLike(raw[col]);
        num = parsed === null ? NaN : parsed ? 1 : 0;
      } else {
        const trimmed = (raw[col] ?? '').trim();
        num = trimmed === '' ? NaN : Number(trimmed);
      }
      if (Number.isFinite(num)) {
        numericValuesByCol[col].push(num);
        numeric[col] = num;
      } else {
        numeric[col] = NaN;
      }
    }

    for (const col of categoricalColumns) {
      const val = (raw[col] ?? '').trim() || 'Sin dato';
      categorical[col] = val;
      catSetsByCol[col].add(val);
    }

    return { numeric, categorical, revenue: targets[idx] };
  });

  const numericRanges: Record<string, NumericRange> = {};
  for (const col of numericColumns) {
    const sorted = [...numericValuesByCol[col]].sort((a, b) => a - b);
    const min = sorted[0] ?? 0;
    const max = sorted[sorted.length - 1] ?? 0;
    const med = medianOf(sorted);
    numericRanges[col] = { minimum: min, maximum: max, median: med };
    for (const row of rows) {
      if (!Number.isFinite(row.numeric[col])) {
        row.numeric[col] = med;
      }
    }
  }

  const categoricalOptions: Record<string, string[]> = {};
  for (const col of categoricalColumns) {
    categoricalOptions[col] = [...catSetsByCol[col]].sort();
  }

  return {
    rows,
    rowsLoaded: rawRecords.length,
    rowsUsed: rows.length,
    duplicatesRemoved,
    featureColumns,
    numericColumns,
    categoricalColumns,
    categoricalOptions,
    numericRanges,
  };
}

class SeededRng {
  private state: number;
  constructor(seed = 42) {
    this.state = seed >>> 0;
  }
  next(): number {
    this.state = (1664525 * this.state + 1013904223) >>> 0;
    return this.state / 0x100000000;
  }
  nextInt(max: number): number {
    return Math.floor(this.next() * max);
  }
}

function buildFeatureEncoder(dataset: TrainingDataset) {
  const catOffsets: Array<{ col: string; mapping: Map<string, number> }> = [];
  let totalFeatures = dataset.numericColumns.length;

  for (const col of dataset.categoricalColumns) {
    const mapping = new Map<string, number>();
    for (const opt of dataset.categoricalOptions[col]) {
      mapping.set(opt, totalFeatures++);
    }
    catOffsets.push({ col, mapping });
  }

  const means = new Float64Array(dataset.numericColumns.length);
  const stds = new Float64Array(dataset.numericColumns.length);
  const n = dataset.rows.length;

  for (let j = 0; j < dataset.numericColumns.length; j++) {
    const col = dataset.numericColumns[j];
    let sum = 0;
    for (let i = 0; i < n; i++) {
      sum += dataset.rows[i].numeric[col];
    }
    const mean = sum / n;
    means[j] = mean;
    let sq = 0;
    for (let i = 0; i < n; i++) {
      const diff = dataset.rows[i].numeric[col] - mean;
      sq += diff * diff;
    }
    const std = Math.sqrt(sq / n);
    stds[j] = std > 1e-12 ? std : 1;
  }

  function encodeRow(
    numeric: Record<string, number>,
    categorical: Record<string, string>,
    scaleNumeric: boolean
  ): Float64Array {
    const vec = new Float64Array(totalFeatures);
    for (let j = 0; j < dataset.numericColumns.length; j++) {
      const val = numeric[dataset.numericColumns[j]];
      vec[j] = scaleNumeric ? (val - means[j]) / stds[j] : val;
    }
    for (const { col, mapping } of catOffsets) {
      const idx = mapping.get(categorical[col]);
      if (idx !== undefined) {
        vec[idx] = 1;
      }
    }
    return vec;
  }

  return { totalFeatures, encodeRow };
}

function sigmoid(z: number): number {
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function trainLogisticRegression(
  X: Float64Array[],
  y: Uint8Array,
  numFeatures: number
): { weights: Float64Array; bias: number } {
  const weights = new Float64Array(numFeatures);
  let bias = 0;
  const n = X.length;
  const lr = 0.25;
  const l2 = 0.001;
  const epochs = 80;
  const gradW = new Float64Array(numFeatures);

  for (let epoch = 0; epoch < epochs; epoch++) {
    gradW.fill(0);
    let gradB = 0;

    for (let i = 0; i < n; i++) {
      const row = X[i];
      let z = bias;
      for (let j = 0; j < numFeatures; j++) {
        z += weights[j] * row[j];
      }
      const err = sigmoid(z) - y[i];
      gradB += err;
      for (let j = 0; j < numFeatures; j++) {
        if (row[j] !== 0) {
          gradW[j] += err * row[j];
        }
      }
    }

    const step = lr / n;
    bias -= step * gradB;
    for (let j = 0; j < numFeatures; j++) {
      weights[j] -= step * gradW[j] + lr * l2 * weights[j];
    }
  }

  return { weights, bias };
}

function trainDecisionTree(
  X: Float64Array[],
  y: Uint8Array,
  indices: Int32Array,
  numFeatures: number,
  maxDepth: number,
  minSamplesLeaf: number,
  maxFeaturesToConsider: number,
  rng: SeededRng | null,
  depth = 0
): TreeNode {
  const count = indices.length;
  let posCount = 0;
  for (let i = 0; i < count; i++) {
    posCount += y[indices[i]];
  }
  const prob = count > 0 ? posCount / count : 0;

  if (depth >= maxDepth || count < minSamplesLeaf * 2 || posCount === 0 || posCount === count) {
    return { leaf: true, prob };
  }

  const p1 = prob;
  const parentGini = 1 - (p1 * p1 + (1 - p1) * (1 - p1));

  let featureList: number[];
  if (rng && maxFeaturesToConsider < numFeatures) {
    const pool = Array.from({ length: numFeatures }, (_, i) => i);
    for (let i = 0; i < maxFeaturesToConsider; i++) {
      const swapIdx = i + rng.nextInt(numFeatures - i);
      const tmp = pool[i];
      pool[i] = pool[swapIdx];
      pool[swapIdx] = tmp;
    }
    featureList = pool.slice(0, maxFeaturesToConsider);
  } else {
    featureList = Array.from({ length: numFeatures }, (_, i) => i);
  }

  let bestGain = 1e-7;
  let bestFeature = -1;
  let bestThreshold = 0;

  const pairs: Array<{ val: number; label: number }> = new Array(count);

  for (const f of featureList) {
    for (let i = 0; i < count; i++) {
      const idx = indices[i];
      pairs[i] = { val: X[idx][f], label: y[idx] };
    }
    pairs.sort((a, b) => a.val - b.val);

    let leftCount = 0;
    let leftPos = 0;

    for (let i = 0; i < count - 1; i++) {
      leftCount++;
      leftPos += pairs[i].label;

      if (pairs[i].val === pairs[i + 1].val) continue;
      const rightCount = count - leftCount;
      if (leftCount < minSamplesLeaf || rightCount < minSamplesLeaf) continue;

      const rightPos = posCount - leftPos;
      const lp = leftPos / leftCount;
      const rp = rightPos / rightCount;
      const leftGini = 1 - (lp * lp + (1 - lp) * (1 - lp));
      const rightGini = 1 - (rp * rp + (1 - rp) * (1 - rp));
      const weightedGini = (leftCount * leftGini + rightCount * rightGini) / count;
      const gain = parentGini - weightedGini;

      if (gain > bestGain) {
        bestGain = gain;
        bestFeature = f;
        bestThreshold = (pairs[i].val + pairs[i + 1].val) / 2;
      }
    }
  }

  if (bestFeature === -1) {
    return { leaf: true, prob };
  }

  const leftList: number[] = [];
  const rightList: number[] = [];
  for (let i = 0; i < count; i++) {
    const idx = indices[i];
    if (X[idx][bestFeature] <= bestThreshold) {
      leftList.push(idx);
    } else {
      rightList.push(idx);
    }
  }

  return {
    leaf: false,
    prob,
    featureIdx: bestFeature,
    threshold: bestThreshold,
    left: trainDecisionTree(
      X,
      y,
      Int32Array.from(leftList),
      numFeatures,
      maxDepth,
      minSamplesLeaf,
      maxFeaturesToConsider,
      rng,
      depth + 1
    ),
    right: trainDecisionTree(
      X,
      y,
      Int32Array.from(rightList),
      numFeatures,
      maxDepth,
      minSamplesLeaf,
      maxFeaturesToConsider,
      rng,
      depth + 1
    ),
  };
}

function predictTree(node: TreeNode, vec: Float64Array): number {
  let curr = node;
  while (!curr.leaf) {
    if (vec[curr.featureIdx!] <= curr.threshold!) {
      curr = curr.left!;
    } else {
      curr = curr.right!;
    }
  }
  return curr.prob;
}

export function trainAllModels(dataset: TrainingDataset): TrainedModels {
  const { totalFeatures, encodeRow } = buildFeatureEncoder(dataset);
  const n = dataset.rows.length;
  const y = new Uint8Array(n);
  const XRaw: Float64Array[] = new Array(n);
  const XScaled: Float64Array[] = new Array(n);

  for (let i = 0; i < n; i++) {
    const row = dataset.rows[i];
    y[i] = row.revenue ? 1 : 0;
    XRaw[i] = encodeRow(row.numeric, row.categorical, false);
    XScaled[i] = encodeRow(row.numeric, row.categorical, true);
  }

  const logReg = trainLogisticRegression(XScaled, y, totalFeatures);

  const allIndices = Int32Array.from({ length: n }, (_, i) => i);
  const decisionTree = trainDecisionTree(
    XRaw,
    y,
    allIndices,
    totalFeatures,
    7,
    25,
    totalFeatures,
    null
  );

  const rng = new SeededRng(42);
  const numTrees = 12;
  const maxFeatures = Math.max(1, Math.ceil(Math.sqrt(totalFeatures)));
  const forest: TreeNode[] = [];
  for (let t = 0; t < numTrees; t++) {
    const bootstrap = new Int32Array(n);
    for (let i = 0; i < n; i++) {
      bootstrap[i] = rng.nextInt(n);
    }
    forest.push(
      trainDecisionTree(XRaw, y, bootstrap, totalFeatures, 8, 15, maxFeatures, rng)
    );
  }

  function parseInferenceFeatures(features: Record<string, unknown>) {
    const numeric: Record<string, number> = {};
    const categorical: Record<string, string> = {};

    for (const col of dataset.numericColumns) {
      const raw = features[col];
      if (raw === null || raw === undefined || raw === '') {
        numeric[col] = dataset.numericRanges[col].median;
        continue;
      }
      if (col === 'Weekend') {
        const parsed = parseBooleanLike(raw);
        if (parsed === null) {
          throw new Error(`El valor de ${col} debe ser booleano o 0/1.`);
        }
        numeric[col] = parsed ? 1 : 0;
        continue;
      }
      const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
      if (!Number.isFinite(num)) {
        throw new Error(`El valor de ${col} debe ser numérico y finito.`);
      }
      numeric[col] = num;
    }

    for (const col of dataset.categoricalColumns) {
      const raw = features[col];
      if (raw === null || raw === undefined || String(raw).trim() === '') {
        categorical[col] = 'Sin dato';
      } else {
        categorical[col] = String(raw).trim();
      }
    }

    return { numeric, categorical };
  }

  return {
    predictProbability(model: ModelName, features: Record<string, unknown>): number {
      const { numeric, categorical } = parseInferenceFeatures(features);
      if (model === 'Regresión logística') {
        const vec = encodeRow(numeric, categorical, true);
        let z = logReg.bias;
        for (let j = 0; j < totalFeatures; j++) {
          z += logReg.weights[j] * vec[j];
        }
        return sigmoid(z);
      }

      const vec = encodeRow(numeric, categorical, false);
      if (model === 'Árbol de decisión') {
        return predictTree(decisionTree, vec);
      }

      let sum = 0;
      for (const tree of forest) {
        sum += predictTree(tree, vec);
      }
      return sum / forest.length;
    },
  };
}
