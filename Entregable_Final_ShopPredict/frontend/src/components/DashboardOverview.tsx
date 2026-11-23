import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Clock,
  Filter,
  Layers,
  MousePointerClick,
  RotateCcw,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react';
import { useState } from 'react';
import type {
  HealthResponse,
  MetadataResponse,
  ModelMetric,
  StatsResponse,
} from '../types';
import {
  formatCount,
  formatMetric,
  formatPercent,
  formatSeconds,
} from '../utils/formatters';

interface DashboardOverviewProps {
  health: HealthResponse | null;
  metadata: MetadataResponse | null;
  stats: StatsResponse | null;
  metrics: ModelMetric[];
  monthOptions: string[];
  visitorOptions: string[];
  selectedMonth: string;
  selectedVisitor: string;
  onMonthChange: (value: string) => void;
  onVisitorChange: (value: string) => void;
  onResetFilters: () => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
  onGoToPrediction: () => void;
  onGoToCsv: () => void;
}

type KpiInspectorKey = 'dedup' | 'revenue' | 'conversion' | 'duration';
type ModelPanelTab = 'chart' | 'matrix' | 'table';
type ChartMetricKey = 'f1' | 'roc_auc' | 'accuracy' | 'precision' | 'recall';

const CONFUSION_CELLS = [
  {
    id: 'vn',
    title: 'Verdaderos Negativos (VN)',
    count: 1998,
    actual: 'Sin compra',
    predicted: 'Sin compra',
    tone: 'bg-slate-800 text-white border-slate-900',
    note: 'Sesiones correctamente descartadas sin falsa alarma.',
  },
  {
    id: 'fp',
    title: 'Falsos Positivos (FP)',
    count: 61,
    actual: 'Sin compra',
    predicted: 'Compra',
    tone: 'bg-amber-50 text-amber-950 border-amber-300',
    note: 'Sesiones etiquetadas como compra sin conversión final.',
  },
  {
    id: 'fn',
    title: 'Falsos Negativos (FN)',
    count: 176,
    actual: 'Compra',
    predicted: 'Sin compra',
    tone: 'bg-rose-50 text-rose-950 border-rose-300',
    note: 'Compras reales no detectadas; principal punto de cautela operativa.',
  },
  {
    id: 'vp',
    title: 'Verdaderos Positivos (VP)',
    count: 206,
    actual: 'Compra',
    predicted: 'Compra',
    tone: 'bg-teal-600 text-white border-teal-700',
    note: 'Compras correctamente anticipadas (Precision 77,15 % · Recall 53,93 %).',
  },
] as const;

export function DashboardOverview({
  health,
  metadata,
  stats,
  metrics,
  monthOptions,
  visitorOptions,
  selectedMonth,
  selectedVisitor,
  onMonthChange,
  onVisitorChange,
  onResetFilters,
  isLoading,
  error,
  onRetry,
  onGoToPrediction,
  onGoToCsv,
}: DashboardOverviewProps) {
  const [activeInspector, setActiveInspector] = useState<KpiInspectorKey>('dedup');
  const [hoveredMonth, setHoveredMonth] = useState<string | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<'buy' | 'no' | null>(null);
  const [hoveredModel, setHoveredModel] = useState<string | null>(null);
  const [modelTab, setModelTab] = useState<ModelPanelTab>('chart');
  const [chartMetric, setChartMetric] = useState<ChartMetricKey>('f1');
  const [selectedCell, setSelectedCell] = useState<string>('vp');

  const hasFilters = Boolean(selectedMonth || selectedVisitor);
  const displayModels = metrics.length > 0 ? metrics : stats?.models ?? [];
  const total = stats?.total ?? 0;
  const purchases = stats?.purchases ?? 0;
  const noPurchase = Math.max(0, total - purchases);

  const byMonth = stats?.breakdown?.by_month ?? [];
  const byVisitor = stats?.breakdown?.by_visitor ?? [];
  const byWeekend = stats?.breakdown?.by_weekend ?? [];
  const pvSignal = stats?.breakdown?.page_values_signal;
  const averages = stats?.breakdown?.averages;

  const maxMonthTotal = Math.max(1, ...byMonth.map((m) => m.total));
  const hoveredMonthData =
    byMonth.find((m) => m.month === hoveredMonth) ??
    byMonth.find((m) => m.month === selectedMonth) ??
    null;

  const hoveredModelData =
    displayModels.find((m) => m.name === hoveredModel) ??
    displayModels.find((m) => m.name === 'Random Forest') ??
    displayModels[0] ??
    null;

  const activeConfusion =
    CONFUSION_CELLS.find((c) => c.id === selectedCell) ?? CONFUSION_CELLS[3];

  const buyPct = total > 0 ? (purchases / total) * 100 : 0;
  const donutRadius = 52;
  const donutCirc = 2 * Math.PI * donutRadius;
  const buyStroke = (buyPct / 100) * donutCirc;

  const getMetricValue = (m: ModelMetric, key: ChartMetricKey): number => {
    const val = m[key];
    return typeof val === 'number' ? val : 0;
  };

  return (
    <div className="space-y-6">
      {/* Header strip */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Resumen operativo de sesiones
          </h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-600">
            <span>Fuente: {metadata ? metadata.file : 'Cargando dataset...'}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono-tabular">
              {metadata
                ? `${formatCount(metadata.rows_loaded)} filas originales / ${formatCount(metadata.duplicates_removed)} duplicados excluidos`
                : 'Deduplicación en curso'}
            </span>
            <span aria-hidden="true">·</span>
            <span
              className={
                health?.status === 'ready' ? 'font-semibold text-teal-700' : 'text-slate-600'
              }
            >
              {health
                ? `Backend conectado (${health.models_loaded} modelos activos)`
                : 'Verificando /health'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onGoToCsv}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/40 hover:shadow-sm"
          >
            <span>Auditar o invalidar CSV</span>
          </button>
          <button
            type="button"
            onClick={onGoToPrediction}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-sm"
          >
            <span>Probar predicción individual</span>
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="flex flex-col justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900 sm:flex-row sm:items-center"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" aria-hidden="true" />
            <div>
              <p className="font-semibold">No se pudieron cargar las estadísticas del backend</p>
              <p className="mt-0.5 text-red-800">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-red-700 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-red-800"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Reintentar</span>
          </button>
        </div>
      )}

      {/* Interactive Filter Toolbar + Quick Filter Buttons */}
      <section
        aria-label="Filtros de sesiones"
        className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs sm:p-5"
      >
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[180px] flex-1 sm:max-w-xs">
            <label htmlFor="monthFilter" className="block text-xs font-semibold text-slate-700">
              Mes de la sesión
            </label>
            <select
              id="monthFilter"
              value={selectedMonth}
              onChange={(e) => onMonthChange(e.target.value)}
              className="mt-1.5 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">Todos los meses</option>
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-[200px] flex-1 sm:max-w-xs">
            <label htmlFor="visitorFilter" className="block text-xs font-semibold text-slate-700">
              Tipo de visitante
            </label>
            <select
              id="visitorFilter"
              value={selectedVisitor}
              onChange={(e) => onVisitorChange(e.target.value)}
              className="mt-1.5 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 transition-colors hover:border-indigo-400 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">Todos los tipos</option>
              {visitorOptions.map((visitor) => (
                <option key={visitor} value={visitor}>
                  {visitor}
                </option>
              ))}
            </select>
          </div>

          {hasFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-indigo-200 bg-indigo-50 px-3.5 py-2 text-sm font-semibold text-indigo-700 transition-all hover:-translate-y-0.5 hover:bg-indigo-100"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span>Limpiar filtros</span>
            </button>
          )}
        </div>

        {/* One-click tactile preset buttons */}
        <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            Atajos de segmento:
          </span>
          {[
            { label: 'Todo el dataset', month: '', visitor: '' },
            { label: 'Nov (temporada alta)', month: 'Nov', visitor: '' },
            { label: 'May (mayor volumen)', month: 'May', visitor: '' },
            { label: 'Mar', month: 'Mar', visitor: '' },
            { label: 'Visitantes nuevos', month: '', visitor: 'New_Visitor' },
            { label: 'Visitantes recurrentes', month: '', visitor: 'Returning_Visitor' },
          ].map((preset) => {
            const active =
              selectedMonth === preset.month && selectedVisitor === preset.visitor;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  onMonthChange(preset.month);
                  onVisitorChange(preset.visitor);
                }}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all hover:-translate-y-0.5 ${
                  active
                    ? 'border-indigo-600 bg-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/60 hover:text-indigo-900'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        <p className="mt-2.5 text-xs text-slate-600">
          {stats?.metrics_scope ??
            'Los filtros actualizan KPIs y gráficas reales del CSV; las métricas de modelos corresponden al holdout global (80/20, semilla 42).'}
        </p>
      </section>

      {/* Tactile Clickable 4-column KPI strip */}
      <section aria-label="Indicadores clave interactivos">
        <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
          <span className="inline-flex items-center gap-1.5 font-medium">
            <MousePointerClick className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
            Haz clic en cualquier tarjeta KPI para inspeccionar su desglose real
          </span>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {isLoading && !stats ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="h-32 animate-pulse rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="h-3 w-28 rounded bg-slate-200" />
                <div className="mt-4 h-8 w-24 rounded bg-slate-200" />
              </div>
            ))
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveInspector('dedup')}
                className={`group cursor-pointer rounded-xl border p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                  activeInspector === 'dedup'
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600 group-hover:text-indigo-700">
                    Sesiones sin duplicados
                  </p>
                  <Layers className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                </div>
                <p
                  data-testid="kpi-total"
                  className="font-mono-tabular mt-2 text-3xl font-bold tracking-tight text-slate-900"
                >
                  {formatCount(stats?.total)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-indigo-700">
                  Ver auditoría 12.330 → 12.205 →
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveInspector('revenue')}
                className={`group cursor-pointer rounded-xl border p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                  activeInspector === 'revenue'
                    ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/20'
                    : 'border-slate-200 bg-white hover:border-teal-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600 group-hover:text-teal-700">
                    Sesiones con compra (Revenue)
                  </p>
                  <ShoppingBag className="h-4 w-4 text-teal-600" aria-hidden="true" />
                </div>
                <p
                  data-testid="kpi-purchases"
                  className="font-mono-tabular mt-2 text-3xl font-bold tracking-tight text-teal-700"
                >
                  {formatCount(stats?.purchases)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-teal-700">
                  Ver señal PageValues &gt; 0 →
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveInspector('conversion')}
                className={`group cursor-pointer rounded-xl border p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                  activeInspector === 'conversion'
                    ? 'border-indigo-500 bg-indigo-50/40 ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-indigo-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600 group-hover:text-indigo-700">
                    Tasa de conversión
                  </p>
                  <TrendingUp className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                </div>
                <p
                  data-testid="kpi-conversion"
                  className="font-mono-tabular mt-2 text-3xl font-bold tracking-tight text-indigo-700"
                >
                  {formatPercent(stats?.conversion)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-indigo-700">
                  Inspeccionar segmentos →
                </p>
              </button>

              <button
                type="button"
                onClick={() => setActiveInspector('duration')}
                className={`group cursor-pointer rounded-xl border p-5 text-left transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md ${
                  activeInspector === 'duration'
                    ? 'border-amber-500 bg-amber-50/40 ring-2 ring-amber-500/20'
                    : 'border-slate-200 bg-white hover:border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-600 group-hover:text-amber-800">
                    Duración promedio en producto
                  </p>
                  <Clock className="h-4 w-4 text-amber-600" aria-hidden="true" />
                </div>
                <p
                  data-testid="kpi-duration"
                  className="font-mono-tabular mt-2 text-3xl font-bold tracking-tight text-slate-900"
                >
                  {formatSeconds(stats?.avg_duration)}
                </p>
                <p className="mt-1.5 text-xs font-medium text-amber-800">
                  Ver promedios y fin de semana →
                </p>
              </button>
            </>
          )}
        </div>

        {/* Interactive KPI Inspector Drawer Panel */}
        {stats && stats.total > 0 && (
          <div
            data-testid="kpi-inspector-panel"
            className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
          >
            {activeInspector === 'dedup' && (
              <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    Auditoría de deduplicación e integridad
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    El servidor elimina <strong>125 filas duplicadas exactas</strong> antes de entrenar o calcular estadísticas para evitar fuga de información entre particiones. En la selección actual hay{' '}
                    <span className="font-mono-tabular font-semibold text-slate-900">
                      {formatCount(stats.total)}
                    </span>{' '}
                    sesiones limpias.
                  </p>
                </div>
                <div className="space-y-3 lg:col-span-7">
                  <div>
                    <div className="mb-1 flex justify-between text-xs font-semibold">
                      <span className="text-slate-700">Sesiones válidas deduplicadas (98,99 %)</span>
                      <span className="font-mono-tabular text-teal-700">12.205 / 12.330</span>
                    </div>
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full bg-teal-600 transition-all"
                        style={{ width: '98.99%' }}
                        title="12.205 sesiones limpias"
                      />
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: '1.01%' }}
                        title="125 duplicados excluidos"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                      <span className="text-slate-500">Filas originales CSV</span>
                      <p className="font-mono-tabular mt-0.5 text-base font-bold text-slate-900">12.330</p>
                    </div>
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-2.5">
                      <span className="text-amber-800">Duplicados excluidos</span>
                      <p className="font-mono-tabular mt-0.5 text-base font-bold text-amber-900">−125</p>
                    </div>
                    <div className="rounded-lg border border-teal-200 bg-teal-50 p-2.5">
                      <span className="text-teal-800">Valores nulos</span>
                      <p className="font-mono-tabular mt-0.5 text-base font-bold text-teal-900">0</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeInspector === 'revenue' && pvSignal && (
              <div className="grid grid-cols-1 items-center gap-5 lg:grid-cols-12">
                <div className="lg:col-span-5">
                  <h2 className="font-display text-base font-semibold text-slate-900">
                    Impacto real de PageValues en la conversión
                  </h2>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    En el filtro actual, las sesiones con{' '}
                    <code className="font-mono-tabular">PageValues &gt; 0</code> registran una conversión drásticamente superior frente a{' '}
                    <code className="font-mono-tabular">PageValues = 0</code>.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-7">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 transition-all hover:border-slate-300">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-slate-700">PageValues = 0</span>
                      <span className="font-mono-tabular text-sm font-bold text-slate-900">
                        {formatPercent(pvSignal.zero_conversion)}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-slate-600"
                        style={{ width: `${(pvSignal.zero_conversion ?? 0) * 100}%` }}
                      />
                    </div>
                    <p className="font-mono-tabular mt-1.5 text-[11px] text-slate-500">
                      {formatCount(pvSignal.zero_purchases)} compras de {formatCount(pvSignal.zero_total)} sesiones
                    </p>
                  </div>

                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-3.5 transition-all hover:border-teal-300">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs font-semibold text-teal-900">PageValues &gt; 0</span>
                      <span className="font-mono-tabular text-sm font-bold text-teal-700">
                        {formatPercent(pvSignal.positive_conversion)}
                      </span>
                    </div>
                    <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-teal-100">
                      <div
                        className="h-full rounded-full bg-teal-600"
                        style={{ width: `${(pvSignal.positive_conversion ?? 0) * 100}%` }}
                      />
                    </div>
                    <p className="font-mono-tabular mt-1.5 text-[11px] text-teal-800">
                      {formatCount(pvSignal.positive_purchases)} compras de {formatCount(pvSignal.positive_total)} sesiones
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeInspector === 'conversion' && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {byVisitor.map((v) => {
                  const isSel = selectedVisitor === v.visitor_type;
                  return (
                    <button
                      key={v.visitor_type}
                      type="button"
                      onClick={() => onVisitorChange(isSel ? '' : v.visitor_type)}
                      className={`cursor-pointer rounded-lg border p-3.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-sm ${
                        isSel
                          ? 'border-indigo-600 bg-indigo-50'
                          : 'border-slate-200 bg-slate-50 hover:border-indigo-300'
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-bold text-slate-900">{v.visitor_type}</span>
                        <span className="font-mono-tabular text-sm font-bold text-indigo-700">
                          {formatPercent(v.conversion)}
                        </span>
                      </div>
                      <p className="font-mono-tabular mt-1 text-[11px] text-slate-600">
                        {formatCount(v.purchases)} compras / {formatCount(v.total)} sesiones
                      </p>
                      <p className="mt-1 text-[11px] font-semibold text-indigo-600">
                        {isSel ? 'Filtro activo (clic para quitar)' : 'Clic para filtrar segmento'}
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {activeInspector === 'duration' && (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {byWeekend.map((w) => (
                  <div
                    key={w.label}
                    className="rounded-lg border border-slate-200 bg-slate-50 p-3.5"
                  >
                    <p className="text-xs font-semibold text-slate-600">{w.label}</p>
                    <p className="font-mono-tabular mt-1 text-xl font-bold text-slate-900">
                      {formatPercent(w.conversion)}
                    </p>
                    <p className="font-mono-tabular text-[11px] text-slate-500">
                      {formatCount(w.purchases)} compras / {formatCount(w.total)} sesiones
                    </p>
                  </div>
                ))}
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold text-slate-600">Tasa de rebote media</p>
                  <p className="font-mono-tabular mt-1 text-xl font-bold text-slate-900">
                    {averages?.bounce_rate != null ? averages.bounce_rate.toFixed(4) : '—'}
                  </p>
                  <p className="text-[11px] text-slate-500">Promedio BounceRates</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold text-slate-600">PageValues promedio</p>
                  <p className="font-mono-tabular mt-1 text-xl font-bold text-teal-700">
                    {averages?.page_values != null ? averages.page_values.toFixed(2) : '—'}
                  </p>
                  <p className="text-[11px] text-slate-500">Promedio en filtro actual</p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Empty filter state */}
      {!isLoading && stats && stats.total === 0 && (
        <section
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-8 text-center"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Sin sesiones para los filtros seleccionados
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            La combinación de mes y tipo de visitante no registra sesiones en el dataset depurado.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Restablecer filtros
          </button>
        </section>
      )}

      {/* Interactive Charts Row 1: Monthly Interactive Bar Chart + Donut & Visitor Segments */}
      {total > 0 && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Interactive Monthly SVG Chart */}
          <section
            aria-labelledby="monthly-chart-heading"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2
                  id="monthly-chart-heading"
                  className="font-display text-lg font-semibold text-slate-900"
                >
                  Sesiones y conversión por mes
                </h2>
                <p className="mt-0.5 text-xs text-slate-600">
                  Pasa el mouse para inspeccionar un mes o haz clic en cualquier barra para filtrar.
                </p>
              </div>
              {hoveredMonthData && (
                <div
                  data-testid="monthly-hover-badge"
                  className="rounded-lg border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs text-indigo-950"
                >
                  <span className="font-bold">{hoveredMonthData.month}:</span>{' '}
                  <span className="font-mono-tabular">
                    {formatCount(hoveredMonthData.total)} ses. ·{' '}
                    {formatCount(hoveredMonthData.purchases)} compras (
                    {formatPercent(hoveredMonthData.conversion)})
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4">
              <div
                className="flex h-56 items-end gap-2 rounded-xl border border-slate-100 bg-slate-50/70 px-3 pt-6 pb-3"
                role="list"
                aria-label="Barras interactivas por mes"
              >
                {byMonth.map((item) => {
                  const totalHeightPct = Math.max(8, (item.total / maxMonthTotal) * 100);
                  const purchaseRatio = item.total > 0 ? (item.purchases / item.total) * 100 : 0;
                  const isActive = selectedMonth === item.month;
                  const isHovered = hoveredMonth === item.month;

                  return (
                    <button
                      key={item.month}
                      type="button"
                      onMouseEnter={() => setHoveredMonth(item.month)}
                      onMouseLeave={() => setHoveredMonth(null)}
                      onFocus={() => setHoveredMonth(item.month)}
                      onClick={() => onMonthChange(isActive ? '' : item.month)}
                      aria-pressed={isActive}
                      className="group flex h-full flex-1 cursor-pointer flex-col items-center justify-end gap-1.5 focus:outline-none"
                    >
                      <span
                        className={`font-mono-tabular text-[10px] font-bold transition-opacity ${
                          isHovered || isActive ? 'text-indigo-700 opacity-100' : 'text-slate-500 opacity-80'
                        }`}
                      >
                        {item.conversion != null ? `${Math.round(item.conversion * 100)}%` : '—'}
                      </span>
                      <div className="relative flex h-36 w-full max-w-[44px] items-end justify-center">
                        <div
                          className={`relative w-full overflow-hidden rounded-t-md border transition-all duration-150 ${
                            isActive
                              ? 'scale-105 border-indigo-700 bg-indigo-600 shadow-md'
                              : isHovered
                                ? '-translate-y-1 border-indigo-500 bg-indigo-500 shadow-sm'
                                : 'border-indigo-200 bg-indigo-200/90 group-hover:bg-indigo-400'
                          }`}
                          style={{ height: `${totalHeightPct}%` }}
                        >
                          <div
                            className="absolute inset-x-0 bottom-0 bg-teal-500 transition-all"
                            style={{ height: `${purchaseRatio}%` }}
                          />
                        </div>
                      </div>
                      <span
                        className={`text-xs font-semibold ${
                          isActive || isHovered ? 'text-indigo-700' : 'text-slate-700'
                        }`}
                      >
                        {item.month}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-indigo-300" />
                    Volumen total de sesiones
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-xs bg-teal-500" />
                    Proporción con compra (Revenue)
                  </span>
                </div>
                {selectedMonth && (
                  <button
                    type="button"
                    onClick={() => onMonthChange('')}
                    className="cursor-pointer font-semibold text-indigo-700 hover:underline"
                  >
                    Ver todos los meses
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Interactive Donut & Visitor Type Segments */}
          <section
            aria-labelledby="distribution-heading"
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5"
          >
            <h2
              id="distribution-heading"
              className="font-display text-lg font-semibold text-slate-900"
            >
              Desbalance y tipo de visitante
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Pasa el cursor sobre el anillo o haz clic en un segmento de visitante para filtrar.
            </p>

            <div className="mt-4 flex flex-col items-center gap-4 sm:flex-row">
              {/* Interactive SVG Donut */}
              <div className="relative h-36 w-36 shrink-0">
                <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="none"
                    stroke={hoveredSlice === 'no' ? '#4338ca' : '#c7d2fe'}
                    strokeWidth={hoveredSlice === 'no' ? 20 : 16}
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredSlice('no')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                  <circle
                    cx="70"
                    cy="70"
                    r={donutRadius}
                    fill="none"
                    stroke={hoveredSlice === 'buy' ? '#0f766e' : '#0d9488'}
                    strokeWidth={hoveredSlice === 'buy' ? 22 : 17}
                    strokeDasharray={`${buyStroke} ${donutCirc}`}
                    strokeLinecap="round"
                    className="cursor-pointer transition-all duration-150"
                    onMouseEnter={() => setHoveredSlice('buy')}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                </svg>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono-tabular text-lg font-bold text-slate-900">
                    {hoveredSlice === 'no'
                      ? formatPercent(noPurchase / total)
                      : formatPercent(purchases / total)}
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {hoveredSlice === 'no' ? 'Sin compra' : 'Con compra'}
                  </span>
                </div>
              </div>

              <div className="w-full space-y-2.5 text-xs">
                <div
                  onMouseEnter={() => setHoveredSlice('buy')}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                    hoveredSlice === 'buy'
                      ? 'border-teal-400 bg-teal-50 shadow-xs'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between font-semibold">
                    <span className="text-teal-900">Con compra (True)</span>
                    <span className="font-mono-tabular text-teal-700">
                      {formatCount(purchases)} · {formatPercent(purchases / total)}
                    </span>
                  </div>
                </div>
                <div
                  onMouseEnter={() => setHoveredSlice('no')}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`cursor-pointer rounded-lg border p-2.5 transition-all ${
                    hoveredSlice === 'no'
                      ? 'border-indigo-400 bg-indigo-50 shadow-xs'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">Sin compra (False)</span>
                    <span className="font-mono-tabular text-indigo-700">
                      {formatCount(noPurchase)} · {formatPercent(noPurchase / total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Visitor Segments */}
            <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
              {byVisitor.map((v) => {
                const pctOfTotal = total > 0 ? (v.total / total) * 100 : 0;
                const isSelected = selectedVisitor === v.visitor_type;
                return (
                  <button
                    key={v.visitor_type}
                    type="button"
                    onClick={() => onVisitorChange(isSelected ? '' : v.visitor_type)}
                    className={`w-full cursor-pointer rounded-lg border p-2 text-left transition-all hover:-translate-y-0.5 ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/70 shadow-xs'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="font-semibold text-slate-800">{v.visitor_type}</span>
                      <span className="font-mono-tabular text-slate-600">
                        {formatCount(v.total)} ({formatPercent(v.conversion)} conv.)
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-indigo-600 transition-all duration-200"
                        style={{ width: `${pctOfTotal}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </div>
      )}

      {/* Interactive Model Comparison + Confusion Matrix Section */}
      <section
        aria-labelledby="models-heading"
        className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs"
      >
        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-indigo-600" aria-hidden="true" />
              <h2
                id="models-heading"
                className="font-display text-lg font-semibold text-slate-900"
              >
                Evaluación comparativa de modelos supervisados
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Partición estratificada 80/20 (semilla 42: 9.764 entrenamiento / 2.441 prueba). Métricas globales fijas; explora barras, matriz de confusión de Random Forest o tabla completa.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap gap-1 rounded-lg bg-slate-100 p-1">
            {(
              [
                { id: 'chart', label: 'Gráfico interactivo' },
                { id: 'matrix', label: 'Matriz de confusión RF' },
                { id: 'table', label: 'Tabla de métricas' },
              ] as Array<{ id: ModelPanelTab; label: string }>
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setModelTab(tab.id)}
                className={`cursor-pointer whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
                  modelTab === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {modelTab === 'chart' && (
          <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Métrica comparada:</span>
                {(
                  [
                    { key: 'f1', label: 'F1-Score (criterio)' },
                    { key: 'roc_auc', label: 'ROC-AUC' },
                    { key: 'accuracy', label: 'Accuracy' },
                    { key: 'precision', label: 'Precision' },
                    { key: 'recall', label: 'Recall' },
                  ] as Array<{ key: ChartMetricKey; label: string }>
                ).map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setChartMetric(item.key)}
                    className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                      chartMetric === item.key
                        ? 'border-indigo-600 bg-indigo-600 text-white'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-indigo-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {displayModels.map((model) => {
                  const val = getMetricValue(model, chartMetric);
                  const isBest = model.name === 'Random Forest';
                  const isHovered = hoveredModel === model.name;
                  return (
                    <div
                      key={model.name}
                      onMouseEnter={() => setHoveredModel(model.name)}
                      onMouseLeave={() => setHoveredModel(null)}
                      className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                        isHovered
                          ? 'border-indigo-400 bg-indigo-50/40 shadow-sm'
                          : isBest
                            ? 'border-teal-200 bg-teal-50/40'
                            : 'border-slate-200 bg-white'
                      }`}
                    >
                      <div className="flex items-baseline justify-between text-sm">
                        <span className="font-semibold text-slate-900">
                          {model.name}{' '}
                          {isBest && (
                            <span className="ml-1 text-xs font-semibold text-teal-700">
                              (Mejor F1)
                            </span>
                          )}
                        </span>
                        <span className="font-mono-tabular text-base font-bold text-indigo-700">
                          {formatMetric(val)}
                        </span>
                      </div>
                      <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isBest ? 'bg-teal-600' : 'bg-indigo-600'
                          }`}
                          style={{ width: `${Math.min(100, val * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {hoveredModelData && (
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 lg:col-span-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                  Ficha del modelo inspeccionado
                </p>
                <h3 className="font-display mt-1 text-lg font-bold text-slate-900">
                  {hoveredModelData.name}
                </h3>
                <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="text-slate-500">F1-Score</span>
                    <p className="font-mono-tabular mt-0.5 text-base font-bold text-teal-700">
                      {formatMetric(hoveredModelData.f1)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="text-slate-500">ROC-AUC</span>
                    <p className="font-mono-tabular mt-0.5 text-base font-bold text-indigo-700">
                      {formatMetric(hoveredModelData.roc_auc)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="text-slate-500">Precision</span>
                    <p className="font-mono-tabular mt-0.5 text-base font-bold text-slate-900">
                      {formatMetric(hoveredModelData.precision)}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5">
                    <span className="text-slate-500">Recall</span>
                    <p className="font-mono-tabular mt-0.5 text-base font-bold text-slate-900">
                      {formatMetric(hoveredModelData.recall)}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onGoToPrediction}
                  className="mt-4 inline-flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                >
                  <span>Probar este modelo en Predicción →</span>
                </button>
              </div>
            )}
          </div>
        )}

        {modelTab === 'matrix' && (
          <div className="mt-4 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
            <div className="grid grid-cols-2 gap-3 lg:col-span-6">
              {CONFUSION_CELLS.map((cell) => {
                const isActive = selectedCell === cell.id;
                return (
                  <button
                    key={cell.id}
                    type="button"
                    onMouseEnter={() => setSelectedCell(cell.id)}
                    onClick={() => setSelectedCell(cell.id)}
                    className={`cursor-pointer rounded-xl border p-4 text-left transition-all hover:-translate-y-0.5 hover:shadow-md ${cell.tone} ${
                      isActive ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
                    }`}
                  >
                    <p className="text-[11px] font-semibold opacity-90">{cell.title}</p>
                    <p className="font-mono-tabular mt-1 text-3xl font-bold">
                      {formatCount(cell.count)}
                    </p>
                    <p className="mt-1 text-[11px] opacity-85">
                      Real: {cell.actual} · Pred: {cell.predicted}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 lg:col-span-6">
              <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700">
                Detalle de celda seleccionada (Random Forest · 2.441 prueba)
              </p>
              <h3 className="font-display mt-1 text-lg font-bold text-slate-900">
                {activeConfusion.title}: {formatCount(activeConfusion.count)} sesiones
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-700">{activeConfusion.note}</p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-slate-500">Valor real</span>
                  <p className="mt-0.5 font-semibold text-slate-900">{activeConfusion.actual}</p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <span className="text-slate-500">Predicción</span>
                  <p className="mt-0.5 font-semibold text-slate-900">{activeConfusion.predicted}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {modelTab === 'table' && (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <th className="py-2.5 pr-3">Modelo</th>
                  <th className="px-2 py-2.5 text-right">Accuracy</th>
                  <th className="px-2 py-2.5 text-right">Bal. Acc.</th>
                  <th className="px-2 py-2.5 text-right">Precision</th>
                  <th className="px-2 py-2.5 text-right">Recall</th>
                  <th className="px-2 py-2.5 text-right">F1</th>
                  <th className="pl-2 py-2.5 text-right">ROC-AUC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayModels.map((model) => {
                  const isBestF1 = model.name === 'Random Forest';
                  return (
                    <tr
                      key={model.name}
                      onMouseEnter={() => setHoveredModel(model.name)}
                      className={`transition-colors ${
                        isBestF1 ? 'bg-teal-50/50 hover:bg-teal-50' : 'hover:bg-indigo-50/40'
                      }`}
                    >
                      <td className="py-3 pr-3 font-medium text-slate-900">
                        <span>{model.name}</span>
                        {isBestF1 && (
                          <span className="ml-2 text-xs font-semibold text-teal-700">
                            (Mayor F1 en partición)
                          </span>
                        )}
                      </td>
                      <td className="font-mono-tabular px-2 py-3 text-right text-slate-700">
                        {formatMetric(model.accuracy)}
                      </td>
                      <td className="font-mono-tabular px-2 py-3 text-right text-slate-700">
                        {formatMetric(model.balanced_accuracy)}
                      </td>
                      <td className="font-mono-tabular px-2 py-3 text-right text-slate-700">
                        {formatMetric(model.precision)}
                      </td>
                      <td className="font-mono-tabular px-2 py-3 text-right text-slate-700">
                        {formatMetric(model.recall)}
                      </td>
                      <td className="font-mono-tabular px-2 py-3 text-right font-semibold text-slate-900">
                        {formatMetric(model.f1)}
                      </td>
                      <td className="font-mono-tabular pl-2 py-3 text-right text-slate-700">
                        {formatMetric(model.roc_auc)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
