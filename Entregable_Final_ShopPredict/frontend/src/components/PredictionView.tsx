import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { submitPrediction } from '../api';
import type { ModelName, PredictionResponse, SchemaResponse } from '../types';
import {
  FEATURE_LABELS,
  buildDefaultFeaturesFromSchema,
  formatPercent,
  validatePredictionInputs,
} from '../utils/formatters';

interface PredictionViewProps {
  schema: SchemaResponse | null;
  schemaError: string | null;
  onRetrySchema: () => void;
}

interface SensitivityPoint {
  pageValues: number;
  probability: number;
  label: string;
}

type PresetKind = 'median' | 'high-intent' | 'high-bounce' | 'long-browse';

export function PredictionView({
  schema,
  schemaError,
  onRetrySchema,
}: PredictionViewProps) {
  const [selectedModel, setSelectedModel] = useState<ModelName>('Random Forest');
  const [formValues, setFormValues] = useState<
    Record<string, string | number | boolean>
  >({});
  const [showFullForm, setShowFullForm] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [comparingAll, setComparingAll] = useState(false);
  const [runningCurve, setRunningCurve] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [multiResults, setMultiResults] = useState<PredictionResponse[]>([]);
  const [sensitivityCurve, setSensitivityCurve] = useState<SensitivityPoint[]>([]);
  const [hoveredCurveIdx, setHoveredCurveIdx] = useState<number | null>(null);
  const [hoveredBarModel, setHoveredBarModel] = useState<string | null>(null);

  useEffect(() => {
    if (schema) {
      setFormValues(buildDefaultFeaturesFromSchema(schema));
      if (schema.models.includes('Random Forest')) {
        setSelectedModel('Random Forest');
      } else if (schema.models.length > 0) {
        setSelectedModel(schema.models[0]);
      }
    }
  }, [schema]);

  const applyPreset = (kind: PresetKind) => {
    if (!schema) return;
    const base = buildDefaultFeaturesFromSchema(schema);
    if (kind === 'high-intent') {
      base.Administrative = 4;
      base.Administrative_Duration = 120;
      base.ProductRelated = 35;
      base.ProductRelated_Duration = 1650;
      base.BounceRates = 0.002;
      base.ExitRates = 0.008;
      base.PageValues = 55;
      base.Month = schema.categorical_options.Month?.includes('Nov') ? 'Nov' : base.Month;
      base.VisitorType = schema.categorical_options.VisitorType?.includes('Returning_Visitor')
        ? 'Returning_Visitor'
        : base.VisitorType;
    } else if (kind === 'high-bounce') {
      base.Administrative = 0;
      base.Administrative_Duration = 0;
      base.ProductRelated = 2;
      base.ProductRelated_Duration = 32;
      base.BounceRates = 0.16;
      base.ExitRates = 0.18;
      base.PageValues = 0;
      base.Month = schema.categorical_options.Month?.includes('May') ? 'May' : base.Month;
      base.VisitorType = schema.categorical_options.VisitorType?.includes('New_Visitor')
        ? 'New_Visitor'
        : base.VisitorType;
    } else if (kind === 'long-browse') {
      base.Administrative = 2;
      base.Administrative_Duration = 45;
      base.ProductRelated = 65;
      base.ProductRelated_Duration = 2850;
      base.BounceRates = 0.015;
      base.ExitRates = 0.035;
      base.PageValues = 0;
      base.Weekend = true;
    }
    setFormValues(base);
    setSubmitError(null);
    setResult(null);
    setMultiResults([]);
    setSensitivityCurve([]);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!schema) return;

    const validation = validatePredictionInputs(schema, formValues);
    if (!validation.valid) {
      setSubmitError(validation.errors[0]);
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      const response = await submitPrediction({
        model: selectedModel,
        features: validation.payloadFeatures,
      });
      setResult(response);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'Error al ejecutar la predicción.'
      );
      setResult(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompareAllModels = async () => {
    if (!schema) return;
    const validation = validatePredictionInputs(schema, formValues);
    if (!validation.valid) {
      setSubmitError(validation.errors[0]);
      return;
    }

    setComparingAll(true);
    setSubmitError(null);
    try {
      const responses = await Promise.all(
        schema.models.map((model) =>
          submitPrediction({
            model,
            features: validation.payloadFeatures,
          })
        )
      );
      setMultiResults(responses);
      const selectedResp = responses.find((r) => r.model === selectedModel) ?? responses[0];
      if (selectedResp) setResult(selectedResp);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'No se pudo comparar los modelos.'
      );
    } finally {
      setComparingAll(false);
    }
  };

  const handleSensitivityCurve = async () => {
    if (!schema) return;
    const validation = validatePredictionInputs(schema, formValues);
    if (!validation.valid) {
      setSubmitError(validation.errors[0]);
      return;
    }

    setRunningCurve(true);
    setSubmitError(null);
    try {
      const points = [0, 10, 25, 50, 100];
      const responses = await Promise.all(
        points.map(async (pv) => {
          const resp = await submitPrediction({
            model: selectedModel,
            features: {
              ...validation.payloadFeatures,
              PageValues: pv,
            },
          });
          return {
            pageValues: pv,
            probability: resp.probability_purchase,
            label: resp.label,
          };
        })
      );
      setSensitivityCurve(responses);
    } catch (err) {
      setSubmitError(
        err instanceof Error ? err.message : 'No se pudo calcular la curva de sensibilidad.'
      );
    } finally {
      setRunningCurve(false);
    }
  };

  if (schemaError) {
    return (
      <div
        role="alert"
        className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-900 sm:flex-row sm:items-center"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
          <div>
            <p className="font-semibold">No se pudo cargar el esquema de predicción (/schema)</p>
            <p className="mt-0.5 text-red-800">{schemaError}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onRetrySchema}
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-700 px-3.5 py-2 text-xs font-semibold text-white hover:bg-red-800"
        >
          <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Reintentar</span>
        </button>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-8 text-sm text-slate-600">
        Cargando variables y rangos desde <code className="font-mono-tabular">GET /schema</code>...
      </div>
    );
  }

  const sliderConfigs = [
    { key: 'PageValues', label: 'Valor de página (PageValues)', min: 0, max: 120, step: 1 },
    { key: 'ProductRelated', label: 'Páginas de producto', min: 0, max: 120, step: 1 },
    {
      key: 'ProductRelated_Duration',
      label: 'Duración en producto (s)',
      min: 0,
      max: 5000,
      step: 25,
    },
    { key: 'ExitRates', label: 'Tasa de salida (ExitRates)', min: 0, max: 0.2, step: 0.002 },
    { key: 'BounceRates', label: 'Tasa de rebote (BounceRates)', min: 0, max: 0.2, step: 0.002 },
  ];

  const gaugePct = result ? Math.min(100, Math.max(0, result.probability_purchase * 100)) : 0;
  const gaugeCirc = Math.PI * 52;
  const gaugeStroke = (gaugePct / 100) * gaugeCirc;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Simulador e inferencia individual
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Manipula perfiles reales, ajusta controles deslizantes y compara los 3 modelos en el backend vía{' '}
            <code className="font-mono-tabular">POST /predict</code>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => applyPreset('median')}
            className="cursor-pointer whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-slate-50"
          >
            Cargar perfil mediana
          </button>
          <button
            type="button"
            onClick={() => applyPreset('high-intent')}
            className="cursor-pointer whitespace-nowrap rounded-lg border border-teal-300 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-800 transition-all hover:-translate-y-0.5 hover:bg-teal-100"
          >
            Perfil compra probable
          </button>
          <button
            type="button"
            onClick={() => applyPreset('high-bounce')}
            className="cursor-pointer whitespace-nowrap rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-800 transition-all hover:-translate-y-0.5 hover:bg-rose-100"
          >
            Perfil rebote alto
          </button>
          <button
            type="button"
            onClick={() => applyPreset('long-browse')}
            className="cursor-pointer whitespace-nowrap rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-900 transition-all hover:-translate-y-0.5 hover:bg-amber-100"
          >
            Navegación sin compra
          </button>
        </div>
      </div>

      {/* Interactive Quick Sliders + Visual Feature Profile */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-slate-900">
              Simulador interactivo de impulsores principales
            </h2>
          </div>
          <span className="text-xs text-slate-500">
            Sincronizado en tiempo real con el formulario completo de 17 variables
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          {sliderConfigs.map((cfg) => {
            const rawVal = Number(formValues[cfg.key] ?? 0);
            const safeVal = Number.isFinite(rawVal) ? Math.min(cfg.max, Math.max(cfg.min, rawVal)) : 0;
            const med = schema.numeric_ranges[cfg.key]?.median ?? 0;
            return (
              <div
                key={cfg.key}
                className="rounded-lg border border-slate-200 bg-slate-50 p-3 transition-all hover:border-indigo-300"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-xs font-semibold text-slate-800">{cfg.label}</span>
                  <span className="font-mono-tabular text-xs font-bold text-indigo-700">
                    {cfg.step < 1 ? safeVal.toFixed(3) : Math.round(safeVal)}
                  </span>
                </div>
                <input
                  type="range"
                  min={cfg.min}
                  max={cfg.max}
                  step={cfg.step}
                  value={safeVal}
                  aria-label={`Control rápido para ${cfg.label}`}
                  onChange={(e) =>
                    setFormValues((prev) => ({ ...prev, [cfg.key]: Number(e.target.value) }))
                  }
                  className="mt-2.5 w-full cursor-pointer accent-indigo-600"
                />
                <div className="font-mono-tabular mt-1 flex justify-between text-[10px] text-slate-500">
                  <span>{cfg.min}</span>
                  <span>Med: {Number(med.toFixed(2))}</span>
                  <span>{cfg.max}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleSubmit}
          className="space-y-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7"
        >
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[220px] flex-1">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="prediction-model"
                  className="block text-sm font-semibold text-slate-900"
                >
                  Modelo supervisado de predicción
                </label>
                <span className="rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                  Backend POST /predict
                </span>
              </div>
              <select
                id="prediction-model"
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value as ModelName)}
                className="mt-1.5 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              >
                {schema.models.map((model) => (
                  <option key={model} value={model}>
                    {model === 'Random Forest' ? `${model} (recomendado · F1 = 0,6348)` : model}
                  </option>
                ))}
              </select>
              <p className="mt-1.5 text-[11px] text-slate-600">
                {selectedModel === 'Random Forest'
                  ? 'Ensamble de árboles (impureza Gini: G = 1 − Σpₖ²); promedia votos sin requerir escalado.'
                  : selectedModel === 'Árbol de decisión'
                    ? 'Reglas binarias secuenciales por reducción de impureza de Gini (F1 = 0,5561).'
                    : 'Función sigmoide P(Compra) = 1 / (1 + e⁻ᶻ) con StandardScaler previo (F1 = 0,5347).'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowFullForm((v) => !v)}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              {showFullForm ? (
                <>
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                  <span>Ocultar detalle 17 variables</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                  <span>Ver todas las 17 variables</span>
                </>
              )}
            </button>
          </div>

          {showFullForm && (
            <>
              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Variables numéricas de navegación
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {schema.numeric_features.map((col) => {
                    const meta = FEATURE_LABELS[col];
                    const range = schema.numeric_ranges[col];

                    if (col === 'Weekend') {
                      return (
                        <div
                          key={col}
                          className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2.5 sm:col-span-2"
                        >
                          <div>
                            <label
                              htmlFor={`field-${col}`}
                              className="text-sm font-semibold text-slate-800"
                            >
                              {meta?.label ?? col}
                            </label>
                            <p className="text-xs text-slate-500">{meta?.description}</p>
                          </div>
                          <input
                            id={`field-${col}`}
                            type="checkbox"
                            checked={Boolean(formValues[col])}
                            onChange={(e) =>
                              setFormValues((prev) => ({ ...prev, [col]: e.target.checked }))
                            }
                            className="h-5 w-5 cursor-pointer rounded border-slate-300 text-indigo-600 focus:ring-indigo-600"
                          />
                        </div>
                      );
                    }

                    return (
                      <div key={col}>
                        <label
                          htmlFor={`field-${col}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          {meta?.label ?? col}
                        </label>
                        <input
                          id={`field-${col}`}
                          type="number"
                          step={meta?.step ?? 'any'}
                          min={range?.minimum}
                          max={range?.maximum}
                          value={String(formValues[col] ?? '')}
                          onChange={(e) =>
                            setFormValues((prev) => ({
                              ...prev,
                              [col]: e.target.value,
                            }))
                          }
                          className="font-mono-tabular mt-1 block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        />
                        {range && (
                          <p className="font-mono-tabular mt-1 text-[11px] text-slate-500">
                            Rango: {Number(range.minimum.toFixed(2))} a{' '}
                            {Number(range.maximum.toFixed(2))} · Mediana:{' '}
                            {Number(range.median.toFixed(3))}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h2 className="font-display text-sm font-semibold text-slate-900">
                  Variables categóricas de sesión
                </h2>
                <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {schema.categorical_features.map((col) => {
                    const meta = FEATURE_LABELS[col];
                    const options = schema.categorical_options[col] ?? [];
                    return (
                      <div key={col}>
                        <label
                          htmlFor={`field-${col}`}
                          className="block text-xs font-semibold text-slate-700"
                        >
                          {meta?.label ?? col}
                        </label>
                        <select
                          id={`field-${col}`}
                          value={String(formValues[col] ?? '')}
                          onChange={(e) =>
                            setFormValues((prev) => ({ ...prev, [col]: e.target.value }))
                          }
                          className="mt-1 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                        >
                          {options.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {submitError && (
            <div
              role="alert"
              className="flex items-start gap-2.5 rounded-lg border border-red-200 bg-red-50 p-3.5 text-sm text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={handleSensitivityCurve}
              disabled={runningCurve}
              className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50 disabled:cursor-wait disabled:opacity-60"
            >
              <Activity className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <span>{runningCurve ? 'Evaluando curva...' : 'Curva PageValues en vivo'}</span>
            </button>

            <button
              type="button"
              onClick={handleCompareAllModels}
              disabled={comparingAll}
              className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg border border-indigo-300 bg-indigo-50 px-4 py-2.5 text-xs font-semibold text-indigo-800 transition-all hover:-translate-y-0.5 hover:bg-indigo-100 disabled:cursor-wait disabled:opacity-60"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              <span>{comparingAll ? 'Comparando...' : 'Comparar los 3 modelos'}</span>
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Calculando...' : 'Estimar intención de compra'}</span>
            </button>
          </div>
        </form>

        {/* Right Sticky Panel: Gauge + Multi-model chart + Sensitivity chart */}
        <aside
          aria-live="polite"
          className="space-y-4 lg:sticky lg:top-6 lg:col-span-5 lg:h-fit"
        >
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Resultado de inferencia y medidor
            </h2>
            <p className="mt-1 text-xs text-slate-600">
              Respuesta en tiempo real del backend sobre las 17 variables predictoras.
            </p>

            {result ? (
              <div data-testid="prediction-result" className="mt-4 space-y-4">
                <div className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
                  {/* Semicircular SVG Probability Gauge */}
                  <svg viewBox="0 0 140 82" className="h-28 w-44">
                    <path
                      d="M 18 70 A 52 52 0 0 1 122 70"
                      fill="none"
                      stroke="#e2e8f0"
                      strokeWidth="12"
                      strokeLinecap="round"
                    />
                    <path
                      d="M 18 70 A 52 52 0 0 1 122 70"
                      fill="none"
                      stroke={result.revenue ? '#0d9488' : '#4f46e5'}
                      strokeWidth="12"
                      strokeLinecap="round"
                      strokeDasharray={`${gaugeStroke} ${gaugeCirc}`}
                    />
                    <text
                      x="70"
                      y="58"
                      textAnchor="middle"
                      className="font-mono-tabular fill-slate-900 text-[16px] font-bold"
                    >
                      {formatPercent(result.probability_purchase)}
                    </text>
                    <text
                      x="70"
                      y="74"
                      textAnchor="middle"
                      className="fill-slate-500 text-[8px] font-semibold uppercase"
                    >
                      Umbral 50 %
                    </text>
                  </svg>

                  <div
                    className={`mt-2 w-full rounded-lg border p-3 text-center ${
                      result.revenue
                        ? 'border-teal-200 bg-teal-50 text-teal-950'
                        : 'border-slate-200 bg-white text-slate-900'
                    }`}
                  >
                    <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide">
                      <CheckCircle2
                        className={`h-4 w-4 ${result.revenue ? 'text-teal-700' : 'text-slate-600'}`}
                        aria-hidden="true"
                      />
                      <span>Clase estimada:</span>
                    </div>
                    <p className="font-display mt-0.5 text-2xl font-bold">{result.label}</p>
                    <p className="text-xs text-slate-600">Modelo: {result.model}</p>
                  </div>
                </div>

                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-950">
                  {result.note}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-600">
                Ajusta un control rápido o carga un escenario y pulsa{' '}
                <span className="font-semibold text-slate-800">Estimar intención de compra</span> o{' '}
                <span className="font-semibold text-indigo-700">Comparar los 3 modelos</span>.
              </div>
            )}
          </div>

          {/* Interactive 3-Model Live Bar Chart */}
          {multiResults.length > 0 && (
            <div
              data-testid="multi-model-comparison"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-baseline justify-between">
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Consenso entre los 3 modelos (en vivo)
                </h3>
                <span className="font-mono-tabular text-xs font-semibold text-indigo-700">
                  {multiResults.filter((m) => m.revenue).length} / {multiResults.length} predicen compra
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {multiResults.map((item) => {
                  const isHov = hoveredBarModel === item.model;
                  return (
                    <div
                      key={item.model}
                      onMouseEnter={() => setHoveredBarModel(item.model)}
                      onMouseLeave={() => setHoveredBarModel(null)}
                      onClick={() => setResult(item)}
                      className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                        isHov
                          ? 'border-indigo-400 bg-indigo-50/40 shadow-xs'
                          : 'border-slate-200 bg-slate-50'
                      }`}
                    >
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-semibold text-slate-900">{item.model}</span>
                        <span className="font-mono-tabular font-bold text-slate-800">
                          {item.label} · {formatPercent(item.probability_purchase)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            item.revenue ? 'bg-teal-600' : 'bg-indigo-600'
                          }`}
                          style={{
                            width: `${Math.min(100, Math.max(2, item.probability_purchase * 100))}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Interactive SVG Sensitivity Curve */}
          {sensitivityCurve.length > 0 && (
            <div
              data-testid="sensitivity-curve-card"
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
            >
              <div className="flex items-baseline justify-between gap-2">
                <h3 className="font-display text-sm font-semibold text-slate-900">
                  Curva de sensibilidad real (PageValues)
                </h3>
                {hoveredCurveIdx != null && sensitivityCurve[hoveredCurveIdx] && (
                  <span className="font-mono-tabular text-xs font-bold text-teal-700">
                    PV={sensitivityCurve[hoveredCurveIdx].pageValues} →{' '}
                    {formatPercent(sensitivityCurve[hoveredCurveIdx].probability)}
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Pasa el mouse por cada nodo para inspeccionar cómo responde {selectedModel}.
              </p>

              <svg viewBox="0 0 320 140" className="mt-3 w-full rounded-lg border border-slate-100 bg-slate-50">
                {/* 50% threshold dashed line */}
                <line
                  x1="36"
                  y1="65"
                  x2="300"
                  y2="65"
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                <text x="38" y="61" className="fill-amber-700 text-[8px] font-semibold">
                  Umbral 50 %
                </text>

                {/* Polyline connecting evaluated backend points */}
                <polyline
                  fill="none"
                  stroke="#4338ca"
                  strokeWidth="2.5"
                  points={sensitivityCurve
                    .map((pt, idx) => {
                      const x = 44 + idx * 62;
                      const y = 115 - pt.probability * 95;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />

                {sensitivityCurve.map((pt, idx) => {
                  const x = 44 + idx * 62;
                  const y = 115 - pt.probability * 95;
                  const active = hoveredCurveIdx === idx;
                  return (
                    <g
                      key={pt.pageValues}
                      className="cursor-pointer"
                      onMouseEnter={() => setHoveredCurveIdx(idx)}
                      onMouseLeave={() => setHoveredCurveIdx(null)}
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={active ? 7 : 5}
                        fill={pt.probability >= 0.5 ? '#0d9488' : '#4338ca'}
                        stroke="#ffffff"
                        strokeWidth="2"
                      />
                      <text
                        x={x}
                        y="132"
                        textAnchor="middle"
                        className="font-mono-tabular fill-slate-600 text-[9px] font-semibold"
                      >
                        {pt.pageValues}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
