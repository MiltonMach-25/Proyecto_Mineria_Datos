import { ExternalLink, FileText, GitBranch, Sliders, X, ZoomIn } from 'lucide-react';
import { useState } from 'react';
import type { MetadataResponse } from '../types';

interface MethodologyViewProps {
  metadata: MetadataResponse | null;
}

interface EvidenceFigure {
  src: string;
  title: string;
  caption: string;
  category: 'eda' | 'modeling';
}

const EVIDENCES: EvidenceFigure[] = [
  {
    src: '/assets/evidencias/02_comparacion_modelos.png',
    title: 'Comparación supervisada (partición 80/20)',
    caption: 'Random Forest obtuvo F1 = 0,6348 y Accuracy = 0,9029 en la partición documentada.',
    category: 'modeling',
  },
  {
    src: '/assets/evidencias/03_matriz_confusion_mejor_f1.png',
    title: 'Matriz de confusión · mejor F1',
    caption: 'Random Forest sobre 2.441 registros de prueba: 1.998 VN, 61 FP, 176 FN, 206 VP.',
    category: 'modeling',
  },
  {
    src: '/assets/evidencias/eda/02_boxplot_product_duration.png',
    title: 'Duración en páginas de producto según compra',
    caption: 'Mediana de 510 s sin compra frente a 1.110 s cuando ocurre compra.',
    category: 'eda',
  },
  {
    src: '/assets/evidencias/eda/05_heatmap_correlaciones.png',
    title: 'Correlaciones numéricas del dataset',
    caption: 'BounceRates–ExitRates r = 0,913; PageValues–Revenue r = 0,493.',
    category: 'eda',
  },
  {
    src: '/assets/evidencias/eda/01_histograma_pagevalues.png',
    title: 'Distribución de PageValues positivos',
    caption: 'PageValues = 0 en 77,86 % de sesiones; con PageValues > 0 la conversión sube a 56,34 %.',
    category: 'eda',
  },
  {
    src: '/assets/evidencias/eda/04_dispersion_bounce_exit.png',
    title: 'Dispersión BounceRates vs. ExitRates',
    caption: 'Fuerte colinealidad positiva (r = 0,913); las sesiones de rebote alto casi no convierten.',
    category: 'eda',
  },
];

const PIPELINE_STAGES = [
  {
    id: 'dedup',
    step: '1. Auditoría y deduplicación',
    summary: '12.330 → 12.205 sesiones limpias',
    detail:
      'Se valida esquema completo (18 columnas, 0 nulos) y se excluyen 125 registros exactamente duplicados antes de dividir datos para impedir fuga entre entrenamiento y prueba.',
    badge: 'Calidad 100 %',
  },
  {
    id: 'split',
    step: '2. Holdout estratificado 80/20',
    summary: '9.764 train · 2.441 test (semilla 42)',
    detail:
      'La partición conserva la proporción real de la clase positiva (15,63 % compras) en ambos subconjuntos, asegurando comparaciones justas entre todos los modelos.',
    badge: 'Semilla 42',
  },
  {
    id: 'transform',
    step: '3. ColumnTransformer nominal',
    summary: 'OneHotEncoder en 6 variables categóricas',
    detail:
      'Month, VisitorType y los códigos OperatingSystems, Browser, Region y TrafficType se codifican como nominales dentro del pipeline sin filtrar categorías desde el test.',
    badge: '17 predictores',
  },
  {
    id: 'scale',
    step: '4. Escalamiento (Sesión 4)',
    summary: 'StandardScaler solo dentro del pipeline lineal',
    detail:
      'Regresión logística utiliza StandardScaler ajustado únicamente en train; Árbol de decisión y Random Forest operan en escala original. En la fase de escalamiento también se contrastaron MinMax, Robust y PCA.',
    badge: 'Sin fuga',
  },
  {
    id: 'eval',
    step: '5. Evaluación multidimensional',
    summary: 'F1, Balanced Acc., Precision, Recall y AUC',
    detail:
      'Ante el desbalance 84,37 % / 15,63 %, el criterio principal prioriza F1-Score sobre Accuracy simple. Random Forest lideró con F1 = 0,6348 y ROC-AUC = 0,9248.',
    badge: 'Random Forest líder',
  },
];

const LAGRANGE_NODES: Array<[number, number]> = [
  [3.7718, 145.2464],
  [12.2917, 489.1138],
  [26.5391, 1044.8487],
  [84.662, 3098.1926],
];

function evalLinearRegression(x: number): number {
  return -0.857242 + 37.566054 * x;
}

function evalLagrange(x: number): number {
  let sum = 0;
  for (let i = 0; i < LAGRANGE_NODES.length; i++) {
    let term = LAGRANGE_NODES[i][1];
    for (let j = 0; j < LAGRANGE_NODES.length; j++) {
      if (i !== j) {
        term *= (x - LAGRANGE_NODES[j][0]) / (LAGRANGE_NODES[i][0] - LAGRANGE_NODES[j][0]);
      }
    }
    sum += term;
  }
  return sum;
}

function EvidenceCard({
  item,
  onZoom,
}: {
  item: EvidenceFigure;
  onZoom: (item: EvidenceFigure) => void;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <figure className="group overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-300 hover:shadow-md">
      <button
        type="button"
        onClick={() => !failed && onZoom(item)}
        className="relative flex h-56 w-full cursor-pointer items-center justify-center border-b border-slate-100 bg-slate-50 p-3"
      >
        {failed ? (
          <div className="text-center text-xs text-slate-500">
            <FileText className="mx-auto mb-1.5 h-6 w-6 text-slate-400" aria-hidden="true" />
            <span>{item.title}</span>
          </div>
        ) : (
          <>
            <img
              src={item.src}
              alt={item.title}
              className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-[1.02]"
              referrerPolicy="no-referrer"
              onError={() => setFailed(true)}
            />
            <span className="absolute right-3 bottom-3 inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white/95 px-2 py-1 text-[11px] font-semibold text-slate-700 opacity-0 shadow-xs transition-opacity group-hover:opacity-100">
              <ZoomIn className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
              Ampliar
            </span>
          </>
        )}
      </button>
      <figcaption className="p-4">
        <p className="font-display text-sm font-semibold text-slate-900">{item.title}</p>
        <p className="mt-1 text-xs text-slate-600">{item.caption}</p>
      </figcaption>
    </figure>
  );
}

export function MethodologyView({ metadata }: MethodologyViewProps) {
  const [selectedStageId, setSelectedStageId] = useState<string>('dedup');
  const [numX, setNumX] = useState<number>(20);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'eda' | 'modeling'>('all');
  const [zoomedItem, setZoomedItem] = useState<EvidenceFigure | null>(null);
  const [selectedPending, setSelectedPending] = useState<'nb' | 'knn' | 'cluster'>('cluster');

  const activeStage =
    PIPELINE_STAGES.find((s) => s.id === selectedStageId) ?? PIPELINE_STAGES[0];
  const regY = Math.max(0, evalLinearRegression(numX));
  const lagY = Math.max(0, evalLagrange(numX));
  const diffY = Math.abs(regY - lagY);

  const visibleEvidences = EVIDENCES.filter((ev) =>
    galleryFilter === 'all' ? true : ev.category === galleryFilter
  );

  // SVG coordinates for numerical sandbox (x: 0..100, y: 0..3900)
  const toSvgX = (x: number) => 42 + (x / 100) * 340;
  const toSvgY = (y: number) => 170 - (Math.min(3900, Math.max(0, y)) / 3900) * 145;

  const lagPolyline = Array.from({ length: 51 }, (_, idx) => {
    const x = idx * 2;
    return `${toSvgX(x).toFixed(1)},${toSvgY(evalLagrange(x)).toFixed(1)}`;
  }).join(' ');

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Metodología interactiva, sandbox numérico y evidencias
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Explora cada etapa del pipeline, manipula modelos numéricos y revisa evidencias reales diferenciadas de métodos pendientes.
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          <a
            href="/docs"
            target="_blank"
            rel="noreferrer"
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50"
          >
            <span>Control y Contrato API (/docs)</span>
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          <a
            href="/index.html"
            className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700"
          >
            <span>Abrir presentación (12 diapositivas)</span>
          </a>
        </div>
      </div>

      {/* Interactive 5-Stage Pipeline Explorer */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-2">
          <GitBranch className="h-4 w-4 text-indigo-600" aria-hidden="true" />
          <h2 className="font-display text-base font-semibold text-slate-900">
            Explorador interactivo del pipeline sin fuga de datos
          </h2>
        </div>
        <p className="mt-1 text-xs text-slate-600">
          Haz clic en cualquier etapa del flujo para inspeccionar su configuración técnica real.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-5">
          {PIPELINE_STAGES.map((stage) => {
            const isSel = stage.id === selectedStageId;
            return (
              <button
                key={stage.id}
                type="button"
                onClick={() => setSelectedStageId(stage.id)}
                className={`cursor-pointer rounded-xl border p-3 text-left transition-all hover:-translate-y-0.5 ${
                  isSel
                    ? 'border-indigo-600 bg-indigo-50/70 shadow-sm ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-slate-50 hover:border-indigo-300 hover:bg-white'
                }`}
              >
                <span className="inline-block rounded-md bg-white px-2 py-0.5 text-[10px] font-bold text-indigo-700 shadow-2xs">
                  {stage.badge}
                </span>
                <p className="mt-2 text-xs font-bold text-slate-900">{stage.step}</p>
                <p className="mt-0.5 text-[11px] text-slate-600">{stage.summary}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-4 rounded-xl border border-indigo-200 bg-indigo-50/40 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-indigo-700">
            {activeStage.step}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-slate-800">{activeStage.detail}</p>
        </div>
      </section>

      {/* Interactive Numerical Methods Sandbox (SVG Dual Curve) */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <h2 className="font-display text-lg font-semibold text-slate-900">
              Laboratorio interactivo de métodos numéricos (ProductRelated vs. Duración)
            </h2>
          </div>
          <span className="font-mono-tabular text-xs font-semibold text-amber-800">
            Diferencia |ŷ − P₃(x)| = {Math.round(diffY)} s
          </span>
        </div>

        <div className="mt-4 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          <div className="space-y-3 lg:col-span-5">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-baseline justify-between text-xs font-semibold">
                <span className="text-slate-700">Evaluar páginas relacionadas (x):</span>
                <span className="font-mono-tabular text-base font-bold text-indigo-700">
                  x = {numX}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={numX}
                aria-label="Evaluar x para comparación numérica"
                onChange={(e) => setNumX(Number(e.target.value))}
                className="mt-3 w-full cursor-pointer accent-indigo-600"
              />
              <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-lg border border-indigo-200 bg-white p-2.5">
                  <span className="text-slate-500">Regresión lineal (ŷ)</span>
                  <p className="font-mono-tabular mt-0.5 text-lg font-bold text-indigo-700">
                    {Math.round(regY).toLocaleString('es-CO')} s
                  </p>
                </div>
                <div className="rounded-lg border border-teal-200 bg-white p-2.5">
                  <span className="text-slate-500">Lagrange P₃(x)</span>
                  <p className="font-mono-tabular mt-0.5 text-lg font-bold text-teal-700">
                    {Math.round(lagY).toLocaleString('es-CO')} s
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs text-slate-600">
              <p className="font-mono-tabular font-semibold text-indigo-700">
                ŷ = -0,857242 + 37,566054x · R² = 0,77093 · RMSE = 844,436 s
              </p>
              <p className="mt-1">
                Nodos Lagrange: (3,77; 145,25), (12,29; 489,11), (26,54; 1.044,85) y (84,66; 3.098,19).
              </p>
            </div>
          </div>

          <div className="lg:col-span-7">
            <svg
              viewBox="0 0 400 195"
              className="w-full rounded-xl border border-slate-200 bg-slate-50"
              role="img"
              aria-label="Comparación gráfica entre regresión lineal y polinomio de Lagrange"
            >
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                const yy = 170 - frac * 145;
                return (
                  <g key={frac}>
                    <line x1="42" y1={yy} x2="382" y2={yy} stroke="#e2e8f0" strokeWidth="1" />
                    <text x="36" y={yy + 3} textAnchor="end" className="fill-slate-500 text-[8px]">
                      {Math.round(3900 * frac)}
                    </text>
                  </g>
                );
              })}

              {/* Linear regression line */}
              <line
                x1={toSvgX(0)}
                y1={toSvgY(evalLinearRegression(0))}
                x2={toSvgX(100)}
                y2={toSvgY(evalLinearRegression(100))}
                stroke="#4338ca"
                strokeWidth="2.5"
              />

              {/* Lagrange curve */}
              <polyline fill="none" stroke="#0d9488" strokeWidth="2.2" points={lagPolyline} />

              {/* 4 Interpolation nodes */}
              {LAGRANGE_NODES.map(([nx, ny], i) => (
                <circle
                  key={i}
                  cx={toSvgX(nx)}
                  cy={toSvgY(ny)}
                  r="4"
                  fill="#0f766e"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              ))}

              {/* Active vertical guide & points */}
              <line
                x1={toSvgX(numX)}
                y1="25"
                x2={toSvgX(numX)}
                y2="170"
                stroke="#b45309"
                strokeDasharray="3 3"
                strokeWidth="1.2"
              />
              <circle cx={toSvgX(numX)} cy={toSvgY(regY)} r="5" fill="#4338ca" stroke="#fff" strokeWidth="1.5" />
              <circle cx={toSvgX(numX)} cy={toSvgY(lagY)} r="5" fill="#0d9488" stroke="#fff" strokeWidth="1.5" />

              <text x="52" y="20" className="fill-indigo-700 text-[9px] font-bold">
                — Regresión lineal
              </text>
              <text x="155" y="20" className="fill-teal-700 text-[9px] font-bold">
                — Lagrange P₃(x)
              </text>
              <text x="212" y="188" textAnchor="middle" className="fill-slate-600 text-[9px] font-semibold">
                ProductRelated (x de 0 a 100)
              </text>
            </svg>
          </div>
        </div>
      </section>

      {/* Pending / conceptual methods notice — strictly no fabricated metrics */}
      <section
        aria-labelledby="pending-methods-heading"
        className="rounded-xl border border-amber-200 bg-amber-50 p-5"
      >
        <h2
          id="pending-methods-heading"
          className="font-display text-base font-semibold text-amber-950"
        >
          Métodos pendientes de evaluación reproducible en ShopPredict
        </h2>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-900">
          De acuerdo con la auditoría técnica vigente, los siguientes métodos se presentan únicamente como marco conceptual o metodológico. No cuentan con métricas finales calculadas en la partición documentada, por lo que no se muestran porcentajes, clústeres, matrices ni gráficos simulados:
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            {
              id: 'nb' as const,
              title: 'Naive Bayes',
              short: 'Línea base probabilística basada en independencia condicional.',
              detail:
                'Calcula P(Revenue | X) asumiendo independencia condicional tras codificar categóricas. Pendiente de corrida reproducible en la partición 80/20 (semilla 42).',
            },
            {
              id: 'knn' as const,
              title: 'K-Nearest Neighbors (KNN)',
              short: 'Clasificación por vecindad con StandardScaler previo.',
              detail:
                'Sensible a magnitudes; depende de distancias en espacio escalado (Sesión 4). Pendiente de selección de k y reporte sobre el conjunto de prueba 2.441.',
            },
            {
              id: 'cluster' as const,
              title: 'Clustering (K-means y Jerárquico)',
              short: 'Segmentación no supervisada sin usar Revenue.',
              detail:
                'Diseño metodológico sobre variables de intensidad de navegación. No se reportan centroides, método del codo ni índice de silueta hasta ejecutar validación reproducible.',
            },
          ].map((m) => {
            const active = selectedPending === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelectedPending(m.id)}
                className={`cursor-pointer rounded-lg border p-4 text-left transition-all hover:-translate-y-0.5 ${
                  active
                    ? 'border-amber-500 bg-white shadow-sm ring-2 ring-amber-400/30'
                    : 'border-amber-200 bg-white/90 hover:border-amber-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-display text-sm font-semibold text-slate-900">{m.title}</h3>
                  <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-900">
                    Pendiente
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-600">{active ? m.detail : m.short}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* Filterable Verified Evidence Figures with Zoom Lightbox */}
      <section aria-labelledby="evidences-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="evidences-heading"
            className="font-display text-lg font-semibold text-slate-900"
          >
            Galería interactiva de evidencias verificadas (haz clic para ampliar)
          </h2>
          <div className="flex gap-1.5 rounded-lg bg-slate-200/70 p-1">
            {(
              [
                { id: 'all', label: `Todas (${EVIDENCES.length})` },
                { id: 'eda', label: 'Exploración EDA (4)' },
                { id: 'modeling', label: 'Modelado (2)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGalleryFilter(tab.id)}
                className={`cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                  galleryFilter === tab.id
                    ? 'bg-white text-indigo-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {visibleEvidences.map((item) => (
            <EvidenceCard key={item.src} item={item} onZoom={setZoomedItem} />
          ))}
        </div>
      </section>

      {metadata && (
        <section className="rounded-xl border border-slate-200 bg-white p-5 text-xs text-slate-600">
          <p className="font-semibold text-slate-800">Procedencia del conjunto de datos</p>
          <p className="mt-1">
            Online Shoppers Purchasing Intention Dataset (UCI / Kaggle). Archivo activo:{' '}
            <span className="font-mono-tabular font-medium text-slate-900">{metadata.file}</span> ·{' '}
            <a
              href={metadata.uci_reference}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-700 underline hover:text-indigo-800"
            >
              Referencia UCI
            </a>{' '}
            ·{' '}
            <a
              href={metadata.kaggle_source}
              target="_blank"
              rel="noreferrer"
              className="text-indigo-700 underline hover:text-indigo-800"
            >
              Referencia Kaggle
            </a>
          </p>
        </section>
      )}

      {/* Lightbox Modal for Evidence Figures */}
      {zoomedItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={zoomedItem.title}
          onClick={() => setZoomedItem(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-3.5">
              <div>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {zoomedItem.title}
                </h3>
                <p className="text-xs text-slate-600">{zoomedItem.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setZoomedItem(null)}
                aria-label="Cerrar vista ampliada"
                className="cursor-pointer rounded-lg border border-slate-200 p-1.5 text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="flex max-h-[75vh] items-center justify-center bg-slate-50 p-4">
              <img
                src={zoomedItem.src}
                alt={zoomedItem.title}
                className="max-h-[68vh] w-auto object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
