import type { SchemaResponse } from '../types';

export interface FeatureFieldMeta {
  label: string;
  description: string;
  step?: string;
}

export const FEATURE_LABELS: Record<string, FeatureFieldMeta> = {
  Administrative: {
    label: 'Páginas administrativas',
    description: 'Cantidad de páginas administrativas visitadas.',
    step: '1',
  },
  Administrative_Duration: {
    label: 'Duración administrativa (s)',
    description: 'Tiempo total en páginas administrativas en segundos.',
    step: 'any',
  },
  Informational: {
    label: 'Páginas informativas',
    description: 'Cantidad de páginas informativas visitadas.',
    step: '1',
  },
  Informational_Duration: {
    label: 'Duración informativa (s)',
    description: 'Tiempo total en páginas informativas en segundos.',
    step: 'any',
  },
  ProductRelated: {
    label: 'Páginas de producto',
    description: 'Cantidad de páginas de producto visitadas en la sesión.',
    step: '1',
  },
  ProductRelated_Duration: {
    label: 'Duración en producto (s)',
    description: 'Tiempo total en páginas de producto en segundos.',
    step: 'any',
  },
  BounceRates: {
    label: 'Tasa de rebote',
    description: 'Promedio de tasa de rebote de las páginas visitadas (0 a 0,2).',
    step: 'any',
  },
  ExitRates: {
    label: 'Tasa de salida',
    description: 'Promedio de tasa de salida de las páginas visitadas (0 a 0,2).',
    step: 'any',
  },
  PageValues: {
    label: 'Valor de página',
    description: 'Valor promedio de página previo a completar transacción.',
    step: 'any',
  },
  SpecialDay: {
    label: 'Cercanía a fecha especial',
    description: 'Proximidad normalizada (0 a 1) a una fecha comercial especial.',
    step: 'any',
  },
  Month: {
    label: 'Mes de la sesión',
    description: 'Mes calendario registrado en la sesión.',
  },
  OperatingSystems: {
    label: 'Sistema operativo (código)',
    description: 'Identificador categórico del sistema operativo.',
  },
  Browser: {
    label: 'Navegador (código)',
    description: 'Identificador categórico del navegador web.',
  },
  Region: {
    label: 'Región (código)',
    description: 'Identificador geográfico codificado.',
  },
  TrafficType: {
    label: 'Tipo de tráfico (código)',
    description: 'Fuente o canal de tráfico codificado.',
  },
  VisitorType: {
    label: 'Tipo de visitante',
    description: 'Clasificación del visitante en la tienda virtual.',
  },
  Weekend: {
    label: 'Fin de semana',
    description: 'Indica si la sesión ocurrió durante el fin de semana.',
  },
};

export function formatCount(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return Math.round(value).toLocaleString('es-CO');
}

export function formatPercent(ratio: number | null | undefined, decimals = 2): string {
  if (ratio === null || ratio === undefined || !Number.isFinite(ratio)) return '—';
  return `${(ratio * 100).toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })} %`;
}

export function formatMetric(value: number | null | undefined, decimals = 4): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return value.toLocaleString('es-CO', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatSeconds(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds)) return '—';
  return `${Math.round(seconds).toLocaleString('es-CO')} s`;
}

export function buildDefaultFeaturesFromSchema(
  schema: SchemaResponse
): Record<string, string | number | boolean> {
  const defaults: Record<string, string | number | boolean> = {};

  for (const col of schema.numeric_features) {
    if (col === 'Weekend') {
      defaults[col] = false;
      continue;
    }
    const range = schema.numeric_ranges[col];
    defaults[col] = range ? Number(range.median.toFixed(4)) : 0;
  }

  for (const col of schema.categorical_features) {
    const options = schema.categorical_options[col] ?? [];
    if (col === 'Month' && options.includes('Nov')) {
      defaults[col] = 'Nov';
    } else if (col === 'VisitorType' && options.includes('Returning_Visitor')) {
      defaults[col] = 'Returning_Visitor';
    } else {
      defaults[col] = options[0] ?? '';
    }
  }

  return defaults;
}

export function validatePredictionInputs(
  schema: SchemaResponse,
  values: Record<string, string | number | boolean>
): { valid: boolean; payloadFeatures: Record<string, string | number | boolean>; errors: string[] } {
  const errors: string[] = [];
  const payloadFeatures: Record<string, string | number | boolean> = {};

  for (const col of schema.numeric_features) {
    const raw = values[col];
    if (col === 'Weekend') {
      payloadFeatures[col] = Boolean(raw);
      continue;
    }
    if (raw === '' || raw === null || raw === undefined) {
      errors.push(`${FEATURE_LABELS[col]?.label ?? col} es obligatorio.`);
      continue;
    }
    const num = typeof raw === 'number' ? raw : Number(String(raw).trim());
    if (!Number.isFinite(num)) {
      errors.push(`${FEATURE_LABELS[col]?.label ?? col} debe ser un número válido.`);
      continue;
    }
    const range = schema.numeric_ranges[col];
    if (range && (num < range.minimum || num > range.maximum)) {
      errors.push(
        `${FEATURE_LABELS[col]?.label ?? col} debe estar entre ${range.minimum} y ${range.maximum}.`
      );
      continue;
    }
    payloadFeatures[col] = num;
  }

  for (const col of schema.categorical_features) {
    const raw = String(values[col] ?? '').trim();
    if (!raw) {
      errors.push(`Selecciona un valor para ${FEATURE_LABELS[col]?.label ?? col}.`);
      continue;
    }
    payloadFeatures[col] = raw;
  }

  return {
    valid: errors.length === 0,
    payloadFeatures,
    errors,
  };
}
