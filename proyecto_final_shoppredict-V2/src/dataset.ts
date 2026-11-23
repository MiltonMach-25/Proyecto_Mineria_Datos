import { parse } from 'csv-parse/sync';

export const TARGET = 'Revenue';

export const EXPECTED_COLUMNS = [
  'Administrative',
  'Administrative_Duration',
  'Informational',
  'Informational_Duration',
  'ProductRelated',
  'ProductRelated_Duration',
  'BounceRates',
  'ExitRates',
  'PageValues',
  'SpecialDay',
  'Month',
  'OperatingSystems',
  'Browser',
  'Region',
  'TrafficType',
  'VisitorType',
  'Weekend',
  'Revenue',
] as const;

export const NUMERIC_COLUMNS = [
  'Administrative',
  'Administrative_Duration',
  'Informational',
  'Informational_Duration',
  'ProductRelated',
  'ProductRelated_Duration',
  'BounceRates',
  'ExitRates',
  'PageValues',
  'SpecialDay',
  'OperatingSystems',
  'Browser',
  'Region',
  'TrafficType',
] as const;

export const NOMINAL_CODE_COLUMNS = new Set([
  'OperatingSystems',
  'Browser',
  'Region',
  'TrafficType',
]);

export interface DatasetInspection {
  valid: boolean;
  rows: number;
  columns: number;
  duplicates: number;
  missing_columns: string[];
  extra_columns: string[];
  issues: string[];
}

export interface ParsedCsv {
  columns: string[];
  records: Record<string, string>[];
}

export function parseCsvBuffer(buffer: Buffer): ParsedCsv {
  const text = buffer.toString('utf-8');
  if (!text.trim()) {
    throw new Error('El archivo está vacío.');
  }
  const rows = parse(text, {
    bom: true,
    skip_empty_lines: true,
    relax_column_count: false,
  }) as string[][];

  if (rows.length === 0) {
    throw new Error('El archivo CSV no contiene encabezados.');
  }

  const columns = rows[0].map((col) => col.trim());
  const records: Record<string, string>[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const record: Record<string, string> = {};
    for (let j = 0; j < columns.length; j++) {
      record[columns[j]] = row[j] ?? '';
    }
    records.push(record);
  }

  return { columns, records };
}

function isMissingCell(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' || trimmed.toLowerCase() === 'nan' || trimmed.toLowerCase() === 'null';
  }
  return false;
}

export function parseStrictNumeric(value: unknown): number | null {
  if (isMissingCell(value)) return null;
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : NaN;
  }
  const str = String(value).trim();
  const num = Number(str);
  return num;
}

export function parseBooleanLike(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') {
    if (value === 1) return true;
    if (value === 0) return false;
    return null;
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0') return false;
  }
  return null;
}

export function normalizeTargetSeries(values: unknown[]): boolean[] {
  const result: boolean[] = [];
  let hasTrue = false;
  let hasFalse = false;

  for (const val of values) {
    if (isMissingCell(val)) {
      throw new Error('Revenue debe estar completa y contener las dos clases False/True (o 0/1).');
    }
    const parsed = parseBooleanLike(val);
    if (parsed === null) {
      throw new Error('Revenue debe contener solamente las clases 0/1 o True/False.');
    }
    if (parsed) hasTrue = true;
    else hasFalse = true;
    result.push(parsed);
  }

  if (!hasTrue || !hasFalse) {
    throw new Error('Revenue debe estar completa y contener las dos clases False/True (o 0/1).');
  }
  return result;
}

export function inspectDataset(columns: string[], records: Record<string, unknown>[]): DatasetInspection {
  const expectedSet = new Set<string>(EXPECTED_COLUMNS);
  const actualSet = new Set<string>(columns);

  const missingColumns = [...expectedSet].filter((c) => !actualSet.has(c)).sort();
  const extraColumns = [...actualSet].filter((c) => !expectedSet.has(c)).sort();
  const issues: string[] = [];

  if (missingColumns.length > 0) {
    issues.push('Faltan columnas requeridas: ' + missingColumns.join(', '));
  }
  if (extraColumns.length > 0) {
    issues.push('Hay columnas no esperadas: ' + extraColumns.join(', '));
  }
  if (records.length < 10) {
    issues.push('Se requieren al menos 10 filas.');
  }

  for (const column of NUMERIC_COLUMNS) {
    if (!actualSet.has(column)) continue;
    let hasNonNumeric = false;
    let hasNonFinite = false;
    for (const row of records) {
      const cell = row[column];
      if (isMissingCell(cell)) continue;
      const num = Number(String(cell).trim());
      if (Number.isNaN(num)) {
        hasNonNumeric = true;
      } else if (!Number.isFinite(num)) {
        hasNonFinite = true;
      }
    }
    if (hasNonNumeric) {
      issues.push(`${column} contiene valores que no son numéricos.`);
    }
    if (hasNonFinite) {
      issues.push(`${column} contiene valores no finitos.`);
    }
  }

  if (actualSet.has('Weekend')) {
    for (const row of records) {
      const cell = row['Weekend'];
      if (isMissingCell(cell)) continue;
      if (parseBooleanLike(cell) === null) {
        issues.push('Weekend debe contener valores booleanos o 0/1.');
        break;
      }
    }
  }

  if (actualSet.has('Revenue')) {
    try {
      normalizeTargetSeries(records.map((r) => r['Revenue']));
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }
  }

  const seen = new Set<string>();
  let duplicates = 0;
  for (const row of records) {
    const key = columns.map((col) => normalizeRowCellForDedup(row[col])).join('\u0001');
    if (seen.has(key)) {
      duplicates++;
    } else {
      seen.add(key);
    }
  }

  return {
    valid: issues.length === 0,
    rows: records.length,
    columns: columns.length,
    duplicates,
    missing_columns: missingColumns,
    extra_columns: extraColumns,
    issues,
  };
}

function normalizeRowCellForDedup(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value).trim();
  if (str === '') return '';
  const lower = str.toLowerCase();
  if (lower === 'true' || lower === 'false') return lower;
  const num = Number(str);
  if (!Number.isNaN(num) && Number.isFinite(num)) {
    return String(num);
  }
  return str;
}

export function deduplicateRecords(
  columns: string[],
  records: Record<string, string>[]
): { cleanRecords: Record<string, string>[]; duplicatesRemoved: number } {
  const seen = new Set<string>();
  const cleanRecords: Record<string, string>[] = [];
  let duplicatesRemoved = 0;

  for (const row of records) {
    const key = columns.map((col) => normalizeRowCellForDedup(row[col])).join('\u0001');
    if (seen.has(key)) {
      duplicatesRemoved++;
    } else {
      seen.add(key);
      cleanRecords.push(row);
    }
  }

  return { cleanRecords, duplicatesRemoved };
}

export function loadVerifiedMetrics(csvBuffer: Buffer): Array<Record<string, string | number>> {
  const { columns, records } = parseCsvBuffer(csvBuffer);
  if (!columns.includes('name') || !columns.includes('accuracy') || !columns.includes('f1')) {
    throw new Error('El archivo de métricas debe contener las columnas name, accuracy y f1.');
  }

  return records.map((row) => {
    const metric: Record<string, string | number> = {
      name: String(row['name']),
    };
    for (const col of columns) {
      if (col === 'name' || col === 'scale' || isMissingCell(row[col])) {
        continue;
      }
      const num = Number(row[col]);
      if (!Number.isFinite(num)) {
        throw new Error(`La métrica ${col} de ${row['name']} no es finita.`);
      }
      metric[col] = num;
    }
    return metric;
  });
}
