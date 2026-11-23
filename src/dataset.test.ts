import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  EXPECTED_COLUMNS,
  NUMERIC_COLUMNS,
  inspectDataset,
  loadVerifiedMetrics,
  parseCsvBuffer,
} from './dataset.js';
import { prepareTrainingDataset } from './models.js';
import { computeFilteredStats } from './stats.js';

test('inspectDataset detects duplicates without modifying valid rows', () => {
  const columns = [...EXPECTED_COLUMNS];
  const baseRows = Array.from({ length: 10 }, (_, idx) => {
    const row: Record<string, string> = {};
    for (const col of EXPECTED_COLUMNS) row[col] = '0';
    for (const col of NUMERIC_COLUMNS) row[col] = String(idx);
    row['Month'] = 'Feb';
    row['VisitorType'] = 'Returning_Visitor';
    row['Weekend'] = 'False';
    row['Revenue'] = idx % 2 === 0 ? 'True' : 'False';
    return row;
  });
  baseRows.push({ ...baseRows[0] });

  const result = inspectDataset(columns, baseRows);
  assert.equal(result.valid, true);
  assert.equal(result.rows, 11);
  assert.equal(result.columns, 18);
  assert.equal(result.duplicates, 1);
  assert.deepEqual(result.missing_columns, []);
  assert.deepEqual(result.extra_columns, []);
});

test('inspectDataset reports missing and extra columns', () => {
  const missingResult = inspectDataset(['Revenue'], [{ Revenue: 'True' }, { Revenue: 'False' }]);
  assert.equal(missingResult.valid, false);
  assert.ok(missingResult.missing_columns.includes('Administrative'));
  assert.ok(missingResult.issues.length > 0);

  const extraCols = [...EXPECTED_COLUMNS, 'Session_ID'];
  const extraRows = Array.from({ length: 10 }, (_, idx) => {
    const row: Record<string, string> = {};
    for (const col of EXPECTED_COLUMNS) row[col] = '0';
    row['Month'] = 'Feb';
    row['VisitorType'] = 'Returning_Visitor';
    row['Weekend'] = 'False';
    row['Revenue'] = idx % 2 === 0 ? 'True' : 'False';
    row['Session_ID'] = String(idx);
    return row;
  });
  const extraResult = inspectDataset(extraCols, extraRows);
  assert.equal(extraResult.valid, false);
  assert.deepEqual(extraResult.extra_columns, ['Session_ID']);
});

test('real repository dataset and verified metrics load with expected counts', () => {
  const datasetPath = path.resolve(
    process.cwd(),
    'Entregable_Final_ShopPredict/data/online_shoppers_intention.csv'
  );
  const metricsPath = path.resolve(
    process.cwd(),
    'Entregable_Final_ShopPredict/assets/evidencias/metricas_modelos.csv'
  );

  const { columns, records } = parseCsvBuffer(fs.readFileSync(datasetPath));
  const prepared = prepareTrainingDataset(columns, records);
  assert.equal(prepared.rowsLoaded, 12330);
  assert.equal(prepared.duplicatesRemoved, 125);
  assert.equal(prepared.rowsUsed, 12205);
  assert.equal(prepared.featureColumns.length, 17);

  const purchases = prepared.rows.filter((r) => r.revenue).length;
  assert.equal(purchases, 1908);

  const metrics = loadVerifiedMetrics(fs.readFileSync(metricsPath));
  assert.equal(metrics.length, 3);
  assert.equal(metrics[1].name, 'Random Forest');

  const fullStats = computeFilteredStats(prepared.rows, null, null);
  assert.equal(fullStats.total, 12205);
  assert.equal(fullStats.purchases, 1908);
  assert.equal(fullStats.breakdown.by_month[0].month, 'Feb');
  assert.ok(fullStats.breakdown.by_visitor.length === 3);
  assert.ok((fullStats.breakdown.page_values_signal.positive_conversion ?? 0) > 0.5);

  const novStats = computeFilteredStats(prepared.rows, 'Nov', null);
  assert.ok(novStats.total > 2900 && novStats.total < 3050);
  assert.equal(novStats.breakdown.by_month.length, 1);
});
