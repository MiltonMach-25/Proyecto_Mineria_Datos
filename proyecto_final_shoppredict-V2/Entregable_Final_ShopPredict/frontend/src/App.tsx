import { useCallback, useEffect, useState } from 'react';
import {
  fetchHealth,
  fetchMetadata,
  fetchMetrics,
  fetchSchema,
  fetchStats,
} from './api';
import { CsvValidationView } from './components/CsvValidationView';
import { DashboardOverview } from './components/DashboardOverview';
import { type ActiveTab, HeaderBar } from './components/HeaderBar';
import { MethodologyView } from './components/MethodologyView';
import { PredictionView } from './components/PredictionView';
import type {
  HealthResponse,
  MetadataResponse,
  ModelMetric,
  SchemaResponse,
  StatsResponse,
} from './types';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('resumen');
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [schema, setSchema] = useState<SchemaResponse | null>(null);
  const [metrics, setMetrics] = useState<ModelMetric[]>([]);
  const [stats, setStats] = useState<StatsResponse | null>(null);

  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState('');

  const [isLoadingBase, setIsLoadingBase] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [baseError, setBaseError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState<string | null>(null);

  const loadBaseData = useCallback(async () => {
    setIsLoadingBase(true);
    setBaseError(null);
    try {
      const [h, m, s, met] = await Promise.all([
        fetchHealth(),
        fetchMetadata(),
        fetchSchema(),
        fetchMetrics(),
      ]);
      setHealth(h);
      setMetadata(m);
      setSchema(s);
      setMetrics(met);
    } catch (err) {
      setBaseError(
        err instanceof Error ? err.message : 'Error de conexión con la API.'
      );
    } finally {
      setIsLoadingBase(false);
    }
  }, []);

  const loadFilteredStats = useCallback(async () => {
    setIsLoadingStats(true);
    setStatsError(null);
    try {
      const data = await fetchStats({
        month: selectedMonth || undefined,
        visitorType: selectedVisitor || undefined,
      });
      setStats(data);
    } catch (err) {
      setStatsError(
        err instanceof Error ? err.message : 'No se pudieron consultar los KPIs.'
      );
    } finally {
      setIsLoadingStats(false);
    }
  }, [selectedMonth, selectedVisitor]);

  useEffect(() => {
    void loadBaseData();
  }, [loadBaseData]);

  useEffect(() => {
    void loadFilteredStats();
  }, [loadFilteredStats]);

  const handleRefresh = () => {
    void loadBaseData();
    void loadFilteredStats();
  };

  const monthOptions = schema?.categorical_options.Month ?? [];
  const visitorOptions = schema?.categorical_options.VisitorType ?? [];

  const tabOrder: ActiveTab[] = ['resumen', 'prediccion', 'validar-csv', 'metodologia'];
  const tabLabels: Record<ActiveTab, string> = {
    resumen: 'Resumen',
    prediccion: 'Predicción',
    'validar-csv': 'Validar CSV',
    metodologia: 'Metodología',
  };
  const currentIdx = tabOrder.indexOf(activeTab);
  const prevTab = currentIdx > 0 ? tabOrder[currentIdx - 1] : null;
  const nextTab = currentIdx < tabOrder.length - 1 ? tabOrder[currentIdx + 1] : null;

  const selectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <HeaderBar
        activeTab={activeTab}
        onSelectTab={selectTab}
        onRefresh={handleRefresh}
        isRefreshing={isLoadingBase || isLoadingStats}
      />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === 'resumen' && (
          <DashboardOverview
            health={health}
            metadata={metadata}
            stats={stats}
            metrics={metrics}
            monthOptions={monthOptions}
            visitorOptions={visitorOptions}
            selectedMonth={selectedMonth}
            selectedVisitor={selectedVisitor}
            onMonthChange={setSelectedMonth}
            onVisitorChange={setSelectedVisitor}
            onResetFilters={() => {
              setSelectedMonth('');
              setSelectedVisitor('');
            }}
            isLoading={isLoadingBase || isLoadingStats}
            error={statsError || baseError}
            onRetry={handleRefresh}
            onGoToPrediction={() => selectTab('prediccion')}
            onGoToCsv={() => selectTab('validar-csv')}
          />
        )}

        {activeTab === 'prediccion' && (
          <PredictionView
            schema={schema}
            schemaError={baseError}
            onRetrySchema={loadBaseData}
          />
        )}

        {activeTab === 'validar-csv' && <CsvValidationView />}

        {activeTab === 'metodologia' && <MethodologyView metadata={metadata} />}

        {/* Tactile Bottom Step Navigation across all modules */}
        <nav
          aria-label="Recorrido entre secciones"
          className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-5 py-3.5 shadow-xs"
        >
          <div className="flex items-center gap-2">
            {prevTab ? (
              <button
                type="button"
                onClick={() => selectTab(prevTab)}
                className="cursor-pointer rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-slate-50"
              >
                ← Anterior: {tabLabels[prevTab]}
              </button>
            ) : (
              <span className="text-xs font-semibold text-slate-500">
                Inicio del recorrido · {tabLabels[activeTab]}
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {nextTab ? (
              <button
                type="button"
                onClick={() => selectTab(nextTab)}
                className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Siguiente: {tabLabels[nextTab]} →
              </button>
            ) : (
              <a
                href="/index.html"
                className="cursor-pointer rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
              >
                Ir a Presentación (17 láminas) →
              </a>
            )}
            <a
              href="/docs"
              className="cursor-pointer rounded-lg border border-slate-300 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-white"
            >
              Control API (/docs)
            </a>
          </div>
        </nav>
      </main>

      <footer className="mt-8 border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-2 px-4 py-5 text-xs text-slate-600 sm:flex-row sm:items-center sm:px-6 lg:px-8">
          <span>
            ShopPredict · Intención de Compra · UNIMINUTO Ingeniería de Sistemas · 2026
          </span>
          <div className="flex flex-wrap items-center gap-4">
            <a href="/index.html" className="hover:text-slate-900 hover:underline">
              Presentación (17 diapositivas)
            </a>
            <a href="/docs" className="hover:text-slate-900 hover:underline">
              Control y Contrato API (/docs)
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
