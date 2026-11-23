import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDefaultFeaturesFromSchema,
  formatCount,
  formatPercent,
  formatSeconds,
  validatePredictionInputs,
} from './formatters';
import type { SchemaResponse } from '../types';

const sampleSchema: SchemaResponse = {
  target: 'Revenue',
  features: ['ProductRelated', 'ProductRelated_Duration', 'Month', 'VisitorType', 'Weekend'],
  numeric_features: ['ProductRelated', 'ProductRelated_Duration', 'Weekend'],
  categorical_features: ['Month', 'VisitorType'],
  categorical_options: {
    Month: ['Feb', 'Nov'],
    VisitorType: ['New_Visitor', 'Returning_Visitor'],
  },
  numeric_ranges: {
    ProductRelated: { minimum: 0, maximum: 705, median: 18 },
    ProductRelated_Duration: { minimum: 0, maximum: 63973.5, median: 598.9 },
    Weekend: { minimum: 0, maximum: 1, median: 0 },
  },
  models: ['Árbol de decisión', 'Random Forest', 'Regresión logística'],
};

test('formatters format numbers cleanly in es-CO', () => {
  assert.equal(formatCount(12205), '12.205');
  assert.equal(formatCount(null), '—');
  assert.equal(formatPercent(0.156329), '15,63 %');
  assert.equal(formatSeconds(1206.98), '1.207 s');
});

test('buildDefaultFeaturesFromSchema selects medians and sensible defaults', () => {
  const defaults = buildDefaultFeaturesFromSchema(sampleSchema);
  assert.equal(defaults.ProductRelated, 18);
  assert.equal(defaults.Month, 'Nov');
  assert.equal(defaults.VisitorType, 'Returning_Visitor');
  assert.equal(defaults.Weekend, false);
});

test('validatePredictionInputs enforces numeric bounds and required fields', () => {
  const defaults = buildDefaultFeaturesFromSchema(sampleSchema);
  const ok = validatePredictionInputs(sampleSchema, defaults);
  assert.equal(ok.valid, true);
  assert.deepEqual(ok.errors, []);

  const outOfBounds = validatePredictionInputs(sampleSchema, {
    ...defaults,
    ProductRelated: -5,
  });
  assert.equal(outOfBounds.valid, false);
  assert.ok(outOfBounds.errors.length === 1);
});
