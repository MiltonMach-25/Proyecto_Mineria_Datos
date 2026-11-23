import {
  CheckCircle2,
  Cpu,
  ExternalLink,
  FileText,
  GitBranch,
  HelpCircle,
  Layers,
  Sigma,
  Sliders,
  X,
  ZoomIn,
} from 'lucide-react';
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

interface JuryQaItem {
  id: string;
  category: 'stack' | 'mining' | 'numeric';
  tag: string;
  question: string;
  answer: string;
}

const JURY_QA: JuryQaItem[] = [
  {
    id: 'why-shoppredict',
    category: 'stack',
    tag: 'Proyecto',
    question: '¿Por qué elegimos ShopPredict (Intención de Compra)?',
    answer:
      'Resuelve un problema real de comercio electrónico: el 84,37 % de visitas se va sin comprar. Con 12.330 sesiones reales UCI/Kaggle detectamos intención de compra temprana usando variables medibles como PageValues y duración.',
  },
  {
    id: 'why-stack-vercel',
    category: 'stack',
    tag: 'Stack vs. Vercel',
    question: '¿Por qué VS Code + Express/Node + AI Studio / Cloud Run en vez de Vercel?',
    answer:
      'Vercel prioriza sitios estáticos o serverless efímeros y obliga a separar el backend. Nuestro paquete corre React + API de predicción + lectura CSV en un solo servidor 100 % portable que abre en VS Code sin internet y sube directo a Cloud Run (AI Studio solo fue entorno de apoyo y verificación).',
  },
  {
    id: 'why-web-api',
    category: 'stack',
    tag: 'Arquitectura',
    question: '¿Para qué hicimos web + API si bastaba un notebook?',
    answer:
      'Un notebook no lo usa un cliente final. La API REST (/stats, /predict, /dataset/validate, /docs) desacopla el modelo del navegador y permite probar predicciones reales y validar CSV con garantía persisted: false.',
  },
  {
    id: 'ai-role',
    category: 'stack',
    tag: 'Transparencia IA',
    question: '¿La IA generó los resultados o las métricas del proyecto?',
    answer:
      'No. La IA asistió en construcción y auditoría de interfaz/código bajo el prompt documentado. Todos los hallazgos, el holdout 80/20 (semilla 42) y las fórmulas provienen del dataset UCI/Kaggle y están validados con pruebas unitarias.',
  },
  {
    id: 'dedup',
    category: 'mining',
    tag: 'Limpieza',
    question: '¿Por qué borrar 125 filas duplicadas si eran menos del 1,1 %?',
    answer:
      'Para evitar fuga de datos (data leakage): si una fila idéntica queda en train y también en test, el modelo memoriza el ejemplo e infla artificialmente las métricas.',
  },
  {
    id: 'scale',
    category: 'mining',
    tag: 'Preproceso',
    question: '¿Por qué aplicaron StandardScaler solo en Regresión Logística y no en Árboles?',
    answer:
      'Regresión Logística multiplica pesos por magnitudes numéricas y exige media 0 y desviación 1; Árbol y Random Forest cortan por umbrales y son invariantes a la escala.',
  },
  {
    id: 'f1-rf',
    category: 'mining',
    tag: 'Métrica y Modelo',
    question: '¿Qué método de predicción ganó y por qué evalúan F1 en vez de solo Accuracy?',
    answer:
      'Ganó Random Forest (F1 = 0,6348 · AUC = 0,9248). Como el 84,37 % no compra, predecir siempre "Sin compra" daría 84 % de Accuracy y 0 % útil; F1 equilibra Precision (0,7715) y Recall (0,5393).',
  },
  {
    id: 'pending-honest',
    category: 'mining',
    tag: 'Rigor',
    question: '¿Por qué Naive Bayes, KNN y Clustering no muestran métricas ni clústeres?',
    answer:
      'Por honestidad científica: no quedaron con corrida reproducible auditada sobre la partición 80/20 (semilla 42), por eso se documentan como marco conceptual sin cifras inventadas.',
  },
  {
    id: 'why-2-num',
    category: 'numeric',
    tag: 'Propósito',
    question: '¿Para qué aplicamos Regresión y Lagrange si ya teníamos Random Forest?',
    answer:
      'Random Forest clasifica compra sí/no (Revenue); Métodos Numéricos modelan una relación continua: cuántos segundos (y) permanece el usuario según páginas de producto vistas (x).',
  },
  {
    id: 'ols-traps',
    category: 'numeric',
    tag: 'Regresión ŷ',
    question: '¿Por qué se eleva el residuo al cuadrado eᵢ² y por qué RMSE ≈ 844 s?',
    answer:
      'Sin cuadrado los residuos positivos y negativos se cancelan (Σeᵢ ≈ 0). El RMSE alto refleja dispersión real entre compradores distintos, mientras R² = 0,74–0,77 confirma tendencia lineal clara (+37 s/pág).',
  },
  {
    id: 'lagrange-nodes',
    category: 'numeric',
    tag: 'Lagrange P₃',
    question: '¿Para qué sirve Lagrange y por qué solo 4 nodos en vez de las 12.205 filas?',
    answer:
      'Lagrange interpola pasando con error 0 por 4 perfiles representativos (grado ≤ 3). Usar miles de nodos dispararía oscilación extrema (fenómeno de Runge) y fuera de [3,77 ; 84,66] extrapolar es inseguro.',
  },
  {
    id: 'which-num-best',
    category: 'numeric',
    tag: 'Comparación',
    question: '¿Cuál es mejor entre Regresión lineal y Lagrange P₃?',
    answer:
      'Son complementarios: Regresión ŷ sirve para tendencia global tolerando ruido masivo; Lagrange P₃ sirve solo para estimación puntual exacta entre los 4 nodos dentro del rango observado.',
  },
];

const LAGRANGE_NODES: Array<[number, number]> = [
  [3.7718, 145.2464],
  [12.2917, 489.1138],
  [26.5391, 1044.8487],
  [84.662, 3098.1926],
];

const LAGRANGE_DENOMS = [-15690.69, 8784.77, -18853.61, 340254.25];
const NODE_COLORS = ['#4338ca', '#e11d48', '#d97706', '#0d9488'];

function evalLinearRegression(x: number): number {
  return -0.857242 + 37.566054 * x;
}

function evalFullCsvRegression(x: number): number {
  return 20.197716 + 37.034207 * x;
}

function evalLagrangeBasis(i: number, x: number): number {
  let basis = 1;
  for (let j = 0; j < LAGRANGE_NODES.length; j++) {
    if (i !== j) {
      basis *= (x - LAGRANGE_NODES[j][0]) / (LAGRANGE_NODES[i][0] - LAGRANGE_NODES[j][0]);
    }
  }
  return basis;
}

function evalLagrange(x: number): number {
  let sum = 0;
  for (let i = 0; i < LAGRANGE_NODES.length; i++) {
    sum += LAGRANGE_NODES[i][1] * evalLagrangeBasis(i, x);
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
  const [numSectionMode, setNumSectionMode] = useState<'all' | 'ols' | 'lagrange' | 'sim'>('all');
  const [numX, setNumX] = useState<number>(20);
  const [showRegression, setShowRegression] = useState(true);
  const [showLagrange, setShowLagrange] = useState(true);
  const [showBases, setShowBases] = useState(false);
  const [showResiduals, setShowResiduals] = useState(true);
  const [galleryFilter, setGalleryFilter] = useState<'all' | 'eda' | 'modeling'>('all');
  const [zoomedItem, setZoomedItem] = useState<EvidenceFigure | null>(null);
  const [selectedPending, setSelectedPending] = useState<'nb' | 'knn' | 'cluster'>('cluster');
  const [juryFilter, setJuryFilter] = useState<'all' | 'stack' | 'mining' | 'numeric'>('all');

  const visibleJuryQa = JURY_QA.filter((item) =>
    juryFilter === 'all' ? true : item.category === juryFilter
  );

  const activeStage =
    PIPELINE_STAGES.find((s) => s.id === selectedStageId) ?? PIPELINE_STAGES[0];
  const regY = Math.max(0, evalLinearRegression(numX));
  const fullCsvRegY = Math.max(0, evalFullCsvRegression(numX));
  const lagY = Math.max(0, evalLagrange(numX));
  const diffY = Math.abs(regY - lagY);
  const isExtrapolating = numX < LAGRANGE_NODES[0][0] || numX > LAGRANGE_NODES[3][0];

  const basisValues = LAGRANGE_NODES.map(([nx, ny], i) => {
    const lVal = evalLagrangeBasis(i, numX);
    const predAudit = evalLinearRegression(nx);
    const resid = ny - predAudit;
    return {
      i,
      x: nx,
      y: ny,
      xSq: nx * nx,
      xy: nx * ny,
      li: lVal,
      contrib: ny * lVal,
      regAtNode: predAudit,
      residual: resid,
      residualSq: resid * resid,
      devMeanSq: (ny - 1194.35) * (ny - 1194.35),
      color: NODE_COLORS[i],
    };
  });
  const sumLi = basisValues.reduce((acc, row) => acc + row.li, 0);

  const visibleEvidences = EVIDENCES.filter((ev) =>
    galleryFilter === 'all' ? true : ev.category === galleryFilter
  );

  // SVG coordinates for numerical sandbox (x: 0..100, y: 0..3900)
  const toSvgX = (x: number) => 44 + (x / 100) * 336;
  const toSvgY = (y: number) => 172 - (y / 3900) * 145;

  const lagPolyline = Array.from({ length: 51 }, (_, idx) => {
    const x = idx * 2;
    return `${toSvgX(x).toFixed(1)},${toSvgY(evalLagrange(x)).toFixed(1)}`;
  }).join(' ');

  const basisPolylines = LAGRANGE_NODES.map(([, ny], i) =>
    Array.from({ length: 51 }, (_, idx) => {
      const x = idx * 2;
      const y = ny * evalLagrangeBasis(i, x);
      return `${toSvgX(x).toFixed(1)},${toSvgY(y).toFixed(1)}`;
    }).join(' ')
  );

  const showOlsSteps = numSectionMode === 'all' || numSectionMode === 'ols';
  const showLagSteps = numSectionMode === 'all' || numSectionMode === 'lagrange';
  const showSim = numSectionMode === 'all' || numSectionMode === 'sim';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Metodología: 1. Minería de Datos · 2. Métodos Numéricos paso a paso
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Primero se documenta la parte de Minería de Datos (predicción y despliegue) y después los Métodos Numéricos con todas las fórmulas y justificaciones breves listas para exponer.
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
            <span>Abrir presentación (17 diapositivas)</span>
          </a>
        </div>
      </div>

      {/* Salvavidas ante el jurado: Preguntas clave y justificaciones */}
      <section className="rounded-xl border border-indigo-200 bg-indigo-50/40 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-slate-900">
                Salvavidas ante el jurado · Preguntas rápidas y justificaciones («solo ver y responder»)
              </h2>
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Por qué elegimos ShopPredict, por qué VS Code / Node / Cloud Run en vez de Vercel y para qué sirve cada método aplicado.
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5 rounded-lg bg-white/90 p-1 shadow-2xs ring-1 ring-slate-200">
            {(
              [
                { id: 'all', label: `Todas (${JURY_QA.length})` },
                { id: 'stack', label: 'Proyecto y Stack vs. Vercel (4)' },
                { id: 'mining', label: 'Minería de Datos (4)' },
                { id: 'numeric', label: 'Métodos Numéricos (4)' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setJuryFilter(tab.id)}
                className={`cursor-pointer rounded-md px-2.5 py-1 text-xs font-semibold transition-all ${
                  juryFilter === tab.id
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {visibleJuryQa.map((qa) => (
            <article
              key={qa.id}
              className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span
                  className={`rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                    qa.category === 'stack'
                      ? 'bg-amber-50 text-amber-800'
                      : qa.category === 'mining'
                        ? 'bg-indigo-50 text-indigo-800'
                        : 'bg-teal-50 text-teal-800'
                  }`}
                >
                  {qa.tag}
                </span>
              </div>
              <h3 className="mt-1.5 font-display text-xs font-bold text-slate-900">
                {qa.question}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-700">{qa.answer}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ================================================================= */}
      {/* BLOQUE 1: MINERÍA DE DATOS Y DESPLIEGUE                           */}
      {/* ================================================================= */}
      <div className="flex items-center gap-2 pt-1">
        <span className="rounded-md bg-indigo-600 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
          Parte 1 · Minería de Datos y Despliegue
        </span>
        <span className="text-xs text-slate-500">
          Predicción de compra (<code>Revenue</code>), pipeline sin fuga y evidencias EDA
        </span>
      </div>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-indigo-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Cpu className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-slate-900">
                ¿Qué método de predicción usamos en Minería?
              </h2>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-md bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-800">
              RF líder · F1 = 0,6348
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            Comparamos tres clasificadores supervisados sobre el holdout 80/20 (semilla 42). <strong>Random Forest</strong> logró el mejor equilibrio entre precisión y detección de compra (F1 = <code>0,6348</code>; ROC-AUC = <code>0,9248</code>), seguido de <strong>Árbol de Decisión</strong> (<code>0,5561</code>) y <strong>Regresión Logística</strong> (<code>0,5347</code>).
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
              <p className="font-bold text-slate-900">Árbol / Random Forest</p>
              <p className="font-mono-tabular mt-1 font-semibold text-indigo-700">
                G = 1 − Σ pₖ²
              </p>
              <p className="mt-0.5 text-slate-500">Impureza de Gini y votación por ensamble.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
              <p className="font-bold text-slate-900">Regresión Logística</p>
              <p className="font-mono-tabular mt-1 font-semibold text-indigo-700">
                P = 1 / (1 + e⁻ᶻ)
              </p>
              <p className="mt-0.5 text-slate-500">Sigmoide sobre variables con StandardScaler.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
              <p className="font-bold text-slate-900">Métrica clave (F1)</p>
              <p className="font-mono-tabular mt-1 font-semibold text-teal-700">
                2·(P·R) / (P+R)
              </p>
              <p className="mt-0.5 text-slate-500">Evita el sesgo por desbalance 84,37 % / 15,63 %.</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-teal-600" aria-hidden="true" />
              <h2 className="font-display text-base font-bold text-slate-900">
                ¿Qué herramientas usamos para desplegar los datos?
              </h2>
            </div>
            <span className="shrink-0 whitespace-nowrap rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
              VS Code + API + Docker
            </span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-slate-600">
            El despliegue es completamente portátil: se abre principalmente en local desde <strong>Visual Studio Code</strong> o directamente desde la carpeta (<code>index.html</code>), sin depender de plataformas externas cerradas.
          </p>
          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
              <p className="font-bold text-slate-900">Frontend visual</p>
              <p className="mt-1 font-semibold text-indigo-700">React + Vite + Tailwind</p>
              <p className="mt-0.5 text-slate-500">Gráficas SVG, filtros vivos y 17 láminas HTML.</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
              <p className="font-bold text-slate-900">API REST y modelos</p>
              <p className="mt-1 font-semibold text-teal-700">Express / Node.js 22</p>
              <p className="mt-0.5 text-slate-500">Sirve /stats, /predict, /dataset/validate y /docs (compatible FastAPI).</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 text-[11px]">
              <p className="font-bold text-slate-900">Ejecución y nube</p>
              <p className="mt-1 font-semibold text-slate-800">VS Code · Cloud Run</p>
              <p className="mt-0.5 text-slate-500">F5 en local; Dockerfile listo y URL dev alternativa.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive 5-Stage Pipeline Explorer */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-indigo-600" aria-hidden="true" />
            <h2 className="font-display text-base font-semibold text-slate-900">
              Explorador interactivo del pipeline sin fuga de datos
            </h2>
          </div>
          <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700">
            Interactivo · Haz clic en cada etapa
          </span>
        </div>

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

      {/* Pending / conceptual methods notice — strictly no fabricated metrics */}
      <section
        aria-labelledby="pending-methods-heading"
        className="rounded-xl border border-amber-200 bg-amber-50 p-5"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2
            id="pending-methods-heading"
            className="font-display text-base font-semibold text-amber-950"
          >
            Métodos pendientes de evaluación reproducible en ShopPredict
          </h2>
          <span className="rounded bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-900">
            Solo marco conceptual · Sin métricas simuladas
          </span>
        </div>
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

      {/* Filterable Verified Evidence Figures */}
      <section aria-labelledby="evidences-heading">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2
            id="evidences-heading"
            className="font-display text-lg font-semibold text-slate-900"
          >
            Galería interactiva de evidencias verificadas de Minería y EDA (clic para ampliar)
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

      {/* ================================================================= */}
      {/* BLOQUE 2: DESPUÉS DE MINERÍA · MÉTODOS NUMÉRICOS PASO A PASO      */}
      {/* ================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t-2 border-indigo-200 pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-teal-700 px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-white">
            Parte 2 · Métodos Numéricos (después de Minería de Datos)
          </span>
          <span className="text-xs text-slate-600">
            Guía paso a paso «solo ver y explicar» · Cómo se hallan los datos y justificación de cada fórmula
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5 rounded-lg bg-slate-200/70 p-1">
          {[
            { id: 'all' as const, label: 'Ver todo paso a paso' },
            { id: 'ols' as const, label: '1 · Regresión (Pasos 1–4)' },
            { id: 'lagrange' as const, label: '2 · Lagrange (Pasos 1–3)' },
            { id: 'sim' as const, label: 'Simulador y Comparación' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setNumSectionMode(tab.id)}
              className={`cursor-pointer rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                numSectionMode === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Step 0: Context & Variable Choice */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="h-4 w-4 text-indigo-600" aria-hidden="true" />
              <h2 className="font-display text-lg font-semibold text-slate-900">
                Contexto numérico en ShopPredict: qué medimos y por qué dos métodos
              </h2>
            </div>
            <p className="mt-1 text-xs text-slate-600">
              Evaluamos la relación continua entre <strong>x = ProductRelated</strong> (páginas de producto vistas, variable independiente) y{' '}
              <strong>y = ProductRelated_Duration</strong> (tiempo acumulado en segundos, variable dependiente) sobre el dataset limpio de{' '}
              <code>12.205</code> sesiones.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
              1 · Regresión lineal → Tendencia global
            </span>
            <span className="rounded-md border border-teal-200 bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800">
              2 · Lagrange P₃ → Paso exacto por 4 nodos
            </span>
          </div>
        </div>

        {/* ============================================================ */}
        {/* MÉTODO 1: REGRESIÓN LINEAL POR MÍNIMOS CUADRADOS (PASO A PASO) */}
        {/* ============================================================ */}
        {showOlsSteps && (
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-1 text-xs font-bold text-white">
                <Sigma className="h-3.5 w-3.5" aria-hidden="true" />
                Método 1 · Regresión lineal por mínimos cuadrados (Cómo se hallan los datos paso a paso)
              </span>
              <span className="text-xs font-medium text-slate-600">
                Objetivo: hallar <code>ŷ = a₀ + a₁x</code> que minimiza <code>Sᵣ = Σ(yᵢ − ŷᵢ)²</code>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Paso 1: Tabla de sumas + Promedios */}
              <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4 lg:col-span-6">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    1
                  </span>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Paso 1 · Construir la tabla de sumas y los promedios (x̄, ȳ)
                  </h3>
                </div>
                <p className="mt-1.5 rounded-md border border-indigo-200 bg-white px-2.5 py-1.5 text-[11.5px] text-indigo-950">
                  <strong>Pregunta guía:</strong> ¿Qué datos base del CSV necesitamos resumir antes de calcular la recta?
                </p>
                <p className="mt-1.5 text-xs text-slate-700">
                  <strong>Proceso:</strong> se calculan <code>xᵢ²</code> y <code>xᵢ·yᵢ</code> fila por fila para sumar cada columna en la{' '}
                  <strong>fila Σ</strong>. Esas 4 sumas son los únicos números que piden las fórmulas.
                </p>
                <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200 bg-white">
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-900 text-white">
                        <th className="px-2 py-1.5 text-left">Referencia</th>
                        <th className="px-2 py-1.5 text-right">xᵢ</th>
                        <th className="px-2 py-1.5 text-right">yᵢ (s)</th>
                        <th className="px-2 py-1.5 text-right">xᵢ²</th>
                        <th className="px-2 py-1.5 text-right">xᵢ·yᵢ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono-tabular">
                      {basisValues.map((row) => (
                        <tr key={`sum-${row.i}`}>
                          <td className="px-2 py-1 font-sans font-semibold text-slate-700">
                            Tramo {row.i}
                          </td>
                          <td className="px-2 py-1 text-right">{row.x.toFixed(2)}</td>
                          <td className="px-2 py-1 text-right">{row.y.toFixed(1)}</td>
                          <td className="px-2 py-1 text-right text-slate-600">
                            {row.xSq.toFixed(2)}
                          </td>
                          <td className="px-2 py-1 text-right text-indigo-700">
                            {row.xy.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-amber-300 bg-amber-50 font-bold text-slate-900">
                        <td className="px-2 py-1.5 font-sans">Σ (n=12.205 CSV)</td>
                        <td className="px-2 py-1.5 text-right">391.117</td>
                        <td className="px-2 py-1.5 text-right">14.731.221</td>
                        <td className="px-2 py-1.5 text-right">36.802.389</td>
                        <td className="px-2 py-1.5 text-right text-indigo-800">1.370.846.946</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="font-mono-tabular mt-2.5 grid grid-cols-2 gap-2 rounded-lg border border-indigo-200 bg-white p-2.5 text-xs">
                  <div>
                    <span className="text-slate-500">x̄ = Σxᵢ / n = 391.117 / 12.205 =</span>{' '}
                    <strong className="text-indigo-700">32,05 pág</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">ȳ = Σyᵢ / n = 14.731.221 / 12.205 =</span>{' '}
                    <strong className="text-teal-700">1.206,98 s</strong>
                  </div>
                </div>
              </div>

              {/* Pasos 2 y 3: Pendiente a1 e Intercepto a0 */}
              <div className="space-y-3 lg:col-span-6">
                <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      2
                    </span>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Paso 2 · Hallar la pendiente a₁ (sustitución directa)
                    </h3>
                  </div>
                  <div className="font-mono-tabular mt-2 space-y-1 rounded-lg border border-indigo-200 bg-white p-2.5 text-xs text-slate-800">
                    <p className="font-bold text-indigo-800">
                      a₁ = [n·Σxᵢyᵢ − (Σxᵢ)(Σyᵢ)] / [n·Σxᵢ² − (Σxᵢ)²]
                    </p>
                    <p className="text-[11px] text-slate-600">
                      = [12.205(1.370.846.946,5) − (391.117)(14.731.220,9)] / [12.205(36.802.389) − (391.117)²]
                    </p>
                    <p className="text-[11px] text-slate-600">
                      = 10.969.556.059.763 / 296.200.650.056 ={' '}
                      <strong className="text-indigo-700">37,0342 s/pág</strong>{' '}
                      <span className="text-slate-500">(muestra auditada: 37,5661)</span>
                    </p>
                  </div>
                  <p className="mt-1.5 rounded-md border border-teal-200 bg-teal-50/60 px-2.5 py-1.5 text-[11px] text-teal-950">
                    <strong>Respuesta breve:</strong> cada página adicional suma ~37 s esperados.{' '}
                    <span className="text-rose-700">
                      Error típico: no confundir <code>(Σxᵢ)²</code> con <code>Σxᵢ²</code>.
                    </span>
                  </p>
                </div>

                <div className="rounded-xl border border-indigo-200 bg-indigo-50/30 p-4">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                      3
                    </span>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Paso 3 · Hallar el intercepto a₀ y armar el modelo ŷ
                    </h3>
                  </div>
                  <div className="font-mono-tabular mt-2 space-y-1 rounded-lg border border-indigo-200 bg-white p-2.5 text-xs text-slate-800">
                    <p className="font-bold text-indigo-800">a₀ = ȳ − a₁·x̄</p>
                    <p className="text-[11px] text-slate-600">
                      = 1.206,9825 − (37,0342)(32,0456) ={' '}
                      <strong className="text-indigo-700">+20,20 s</strong>{' '}
                      <span className="text-slate-500">(muestra auditada: −0,8572 s)</span>
                    </p>
                    <p className="text-[11px] font-bold text-slate-900">
                      Modelo CSV completo: ŷ = 20,20 + 37,0342·x &nbsp;|&nbsp; Auditado: ŷ = −0,8572 + 37,5661·x
                    </p>
                  </div>
                  <p className="mt-1.5 rounded-md border border-teal-200 bg-teal-50/60 px-2.5 py-1.5 text-[11px] text-teal-950">
                    <strong>Respuesta breve:</strong> valor matemático en <code>x = 0</code>; garantiza que la recta pase por el centroide{' '}
                    <code>(x̄, ȳ) = (32,05 ; 1.206,98)</code>.
                  </p>
                </div>
              </div>
            </div>

            {/* Paso 4: Calidad del ajuste St, Sr, R2, r, Sy/x + Tabla de residuos */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                    4
                  </span>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Paso 4 · Calidad del ajuste: Sₜ, Sᵣ, R², r y dispersión típica (Sᵧ/ₓ y RMSE)
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-600">
                  Sₜ = variación total · Sᵣ = variación que la recta no explica
                </span>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-4 lg:grid-cols-12">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:col-span-6">
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                    <p className="font-mono-tabular font-bold text-slate-900">Sₜ = Σ(yᵢ − ȳ)²</p>
                    <p className="font-mono-tabular mt-0.5 font-semibold text-indigo-700">
                      44.970.147.821 (CSV)
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Mide cuánto varían los tiempos reales respecto a su promedio ȳ.
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white p-3 text-xs">
                    <p className="font-mono-tabular font-bold text-slate-900">
                      Sᵣ = Σ eᵢ² = Σ(yᵢ − ŷᵢ)²
                    </p>
                    <p className="font-mono-tabular mt-0.5 font-semibold text-rose-700">
                      11.684.707.012 (CSV)
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Error residual acumulado: los residuos negativos y positivos cumplen Σeᵢ ≈ 0.
                    </p>
                  </div>
                  <div className="rounded-lg border border-teal-200 bg-teal-50/50 p-3 text-xs">
                    <p className="font-mono-tabular font-bold text-teal-900">
                      R² = (Sₜ − Sᵣ) / Sₜ
                    </p>
                    <p className="font-mono-tabular mt-0.5 font-bold text-teal-700">
                      0,7402 (CSV) · 0,77093 (auditado)
                    </p>
                    <p className="mt-0.5 text-[11px] text-teal-800">
                      La recta explica ~74–77 % de la variación total; correlación r = √R² ≈ 0,86–0,88.
                    </p>
                  </div>
                  <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3 text-xs">
                    <p className="font-mono-tabular font-bold text-amber-900">
                      Sᵧ/ₓ = √(Sᵣ/(n−2)) · RMSE = √(Sᵣ/n)
                    </p>
                    <p className="font-mono-tabular mt-0.5 font-bold text-amber-800">
                      978,5 s (CSV) · 844,4 s (auditado)
                    </p>
                    <p className="mt-0.5 text-[11px] text-amber-900">
                      Dispersión típica alrededor de la recta causada por sesiones reales heterogéneas.
                    </p>
                  </div>
                </div>

                {/* Tabla de residuos paso a paso en los 4 nodos */}
                <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white lg:col-span-6">
                  <div className="border-b border-slate-100 bg-slate-100 px-3 py-1.5 text-[11px] font-bold text-slate-800">
                    Cómo se calculan los residuos eᵢ = yᵢ − ŷᵢ y su cuadrado eᵢ² (ejemplo sobre los 4 nodos)
                  </div>
                  <table className="w-full border-collapse text-[11px]">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-900 text-white">
                        <th className="px-2 py-1.5 text-right">xᵢ</th>
                        <th className="px-2 py-1.5 text-right">yᵢ (s)</th>
                        <th className="px-2 py-1.5 text-right">ŷᵢ</th>
                        <th className="px-2 py-1.5 text-right">eᵢ = yᵢ−ŷᵢ</th>
                        <th className="px-2 py-1.5 text-right">eᵢ²</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono-tabular">
                      {basisValues.map((row) => (
                        <tr key={`res-tbl-${row.i}`}>
                          <td className="px-2 py-1 text-right">{row.x.toFixed(2)}</td>
                          <td className="px-2 py-1 text-right">{row.y.toFixed(1)}</td>
                          <td className="px-2 py-1 text-right text-indigo-700">
                            {row.regAtNode.toFixed(1)}
                          </td>
                          <td
                            className={`px-2 py-1 text-right font-semibold ${
                              row.residual >= 0 ? 'text-teal-700' : 'text-rose-700'
                            }`}
                          >
                            {row.residual >= 0 ? '+' : ''}
                            {row.residual.toFixed(1)}
                          </td>
                          <td className="px-2 py-1 text-right text-slate-600">
                            {Math.round(row.residualSq).toLocaleString('es-CO')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* MÉTODO 2: INTERPOLACIÓN POLINOMIAL DE LAGRANGE (PASO A PASO) */}
        {/* ============================================================ */}
        {showLagSteps && (
          <div className="mt-6 space-y-4 border-t border-slate-200 pt-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-700 px-3 py-1 text-xs font-bold text-white">
                <Sigma className="h-3.5 w-3.5" aria-hidden="true" />
                Método 2 · Interpolación polinomial de Lagrange P₃ (Pasos exactos y pesos)
              </span>
              <span className="text-xs font-medium text-slate-600">
                Por 4 nodos pasa un único polinomio de grado ≤ 3 que no comete error en esos 4 puntos
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
              {/* Lagrange Paso 1: L0..L3 explicit formulas */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 lg:col-span-7">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                    1
                  </span>
                  <h3 className="font-display text-sm font-bold text-slate-900">
                    Paso 1 · Construir los 4 polinomios base Lᵢ(x) = Πⱼ≠ᵢ (x − xⱼ) / (xᵢ − xⱼ)
                  </h3>
                </div>
                <p className="mt-1.5 rounded-md border border-teal-200 bg-white px-2.5 py-1.5 text-[11.5px] text-teal-950">
                  <strong>Pregunta guía:</strong> ¿Por qué usamos 4 nodos (grado ≤ 3) y no los 12.205 puntos del CSV?
                </p>
                <p className="mt-1.5 text-xs text-slate-700">
                  <strong>Proceso y respuesta breve:</strong> miles de nodos causarían oscilación extrema (<strong>fenómeno de Runge</strong>). Con 4 nodos clave logramos paso exacto y estable; cada <code>Lᵢ</code> vale <code>1</code> en su nodo y <code>0</code> en los otros tres.
                </p>
                <div className="font-mono-tabular mt-3 space-y-2 rounded-lg border border-teal-200 bg-white p-3 text-[11px] text-slate-800">
                  {LAGRANGE_NODES.map(([xi, yi], i) => {
                    const others = LAGRANGE_NODES.filter((_, j) => j !== i).map(
                      ([xj]) => `(x − ${xj.toFixed(2)})`
                    );
                    return (
                      <div key={i} className="border-b border-slate-100 pb-1.5 last:border-b-0 last:pb-0">
                        <span className="font-bold" style={{ color: NODE_COLORS[i] }}>
                          L{i}(x)
                        </span>{' '}
                        = [{others.join('·')}] /{' '}
                        <span className="font-semibold text-slate-900">
                          ({LAGRANGE_DENOMS[i].toLocaleString('es-CO', { minimumFractionDigits: 2 })})
                        </span>{' '}
                        <span className="text-slate-500">· peso de y{i} = {yi.toFixed(1)} s</span>
                      </div>
                    );
                  })}
                </div>
                <div className="font-mono-tabular mt-2.5 rounded-lg border border-teal-200 bg-white px-3 py-2 text-[11px] text-teal-900">
                  <strong>Polinomio ensamblado:</strong> P₃(x) = Σᵢ yᵢ·Lᵢ(x) ≈ 0,000107·x³ − 0,064053·x² + 41,3667·x − 9,8752
                </div>
              </div>

              {/* Lagrange Paso 2: Barras de pesos Li(x) y validación */}
              <div className="rounded-xl border border-teal-200 bg-teal-50/30 p-4 lg:col-span-5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-teal-700 text-xs font-bold text-white">
                      2
                    </span>
                    <h3 className="font-display text-sm font-bold text-slate-900">
                      Pesos Lᵢ({numX}) en vivo
                    </h3>
                  </div>
                  <span className="font-mono-tabular rounded bg-white px-2 py-0.5 text-[11px] font-bold text-teal-800">
                    Σ Lᵢ = {sumLi.toFixed(3)}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-slate-700">
                  Cada barra muestra cuánto pesa ese nodo en <code>x = {numX}</code>. Si eliges un nodo exacto, su peso vale <code>1,000</code> y los demás <code>0</code>.
                </p>
                <div className="mt-3 space-y-2.5 rounded-lg border border-teal-200 bg-white p-3">
                  {basisValues.map((row) => {
                    const widthPct = Math.min(Math.abs(row.li) / 1.5, 1) * 50;
                    const leftPct = row.li >= 0 ? 50 : 50 - widthPct;
                    return (
                      <div key={`bar-${row.i}`} className="grid grid-cols-[44px_1fr_58px] items-center gap-2 text-xs">
                        <span className="font-mono-tabular font-bold" style={{ color: row.color }}>
                          L{row.i}(x)
                        </span>
                        <div className="relative h-4 overflow-hidden rounded-md bg-slate-100">
                          <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-slate-400" />
                          <div
                            className="absolute top-0 bottom-0 rounded-sm transition-all duration-150"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              backgroundColor: row.color,
                            }}
                          />
                        </div>
                        <span className="font-mono-tabular text-right font-semibold text-slate-800">
                          {row.li.toFixed(3)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[11px] text-slate-600">
                  <strong>Justificación de rango:</strong> dentro de <code>[3,77 ; 84,66]</code> interpola suavemente; fuera de ese rango extrapolar puede divergir.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/* SIMULADOR INTERACTIVO, TABLA DINÁMICA Y CUÁL ES CUÁL         */}
        {/* ============================================================ */}
        {showSim && (
          <div className="mt-6 border-t border-slate-200 pt-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-900 text-xs font-bold text-white">
                  3
                </span>
                <h3 className="font-display text-base font-bold text-slate-900">
                  Simulador interactivo en vivo: evalúa x, tabla de pesos Lᵢ(x) y «Cuál es cuál»
                </h3>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                    isExtrapolating
                      ? 'border border-rose-200 bg-rose-50 text-rose-800'
                      : 'border border-teal-200 bg-teal-50 text-teal-800'
                  }`}
                >
                  {isExtrapolating
                    ? '⚠ Extrapolación (fuera de nodos [3,77 ; 84,66])'
                    : '✔ Interpolación dentro de nodos'}
                </span>
                <span className="font-mono-tabular rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  Diferencia |ŷ − P₃(x)| = {Math.round(diffY)} s
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
              <div className="space-y-4 lg:col-span-5">
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
                    step={0.5}
                    value={numX}
                    aria-label="Evaluar x para comparación numérica"
                    onChange={(e) => setNumX(Number(e.target.value))}
                    className="mt-2.5 w-full cursor-pointer accent-indigo-600"
                  />
                  {/* Quick value presets including nodes */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5">
                    {[
                      { label: 'x₀ = 3,77', val: 3.7718 },
                      { label: 'x₁ = 12,29', val: 12.2917 },
                      { label: 'x = 20', val: 20 },
                      { label: 'x₂ = 26,54', val: 26.5391 },
                      { label: 'x = 65', val: 65 },
                      { label: 'x₃ = 84,66', val: 84.662 },
                      { label: 'Extrapolar 95', val: 95 },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => setNumX(preset.val)}
                        className={`cursor-pointer rounded-md border px-2 py-1 text-[11px] font-semibold transition-all ${
                          Math.abs(numX - preset.val) < 0.05
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-indigo-300'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2.5 text-xs">
                    <div className="rounded-lg border border-indigo-200 bg-white p-2.5">
                      <span className="text-[11px] font-semibold text-indigo-700">
                        1 · Regresión lineal ŷ(x)
                      </span>
                      <p className="font-mono-tabular mt-0.5 text-lg font-bold text-slate-900">
                        {Math.round(regY).toLocaleString('es-CO')} s
                      </p>
                      <p className="font-mono-tabular text-[10px] text-slate-500">
                        CSV 12.205: {Math.round(fullCsvRegY).toLocaleString('es-CO')} s
                      </p>
                    </div>
                    <div className="rounded-lg border border-teal-200 bg-white p-2.5">
                      <span className="text-[11px] font-semibold text-teal-700">
                        2 · Lagrange P₃(x)
                      </span>
                      <p className="font-mono-tabular mt-0.5 text-lg font-bold text-slate-900">
                        {Math.round(lagY).toLocaleString('es-CO')} s
                      </p>
                      <p className="font-mono-tabular text-[10px] text-slate-500">
                        Σ yᵢ·Lᵢ({numX})
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Lagrange Decomposition & Residual Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                  <div className="border-b border-slate-100 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-800">
                    Tabla dinámica en x = {numX}: pesos Lᵢ(x), contribución yᵢ·Lᵢ(x) y ΣLᵢ = 1
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-900 text-white">
                        <th className="px-2.5 py-2 text-left">Nodo</th>
                        <th className="px-2 py-2 text-right">xᵢ</th>
                        <th className="px-2 py-2 text-right">yᵢ (s)</th>
                        <th className="px-2 py-2 text-right">Lᵢ(x)</th>
                        <th className="px-2 py-2 text-right">yᵢ·Lᵢ(x)</th>
                        <th className="px-2.5 py-2 text-right">eᵢ = yᵢ−ŷ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono-tabular">
                      {basisValues.map((row) => (
                        <tr key={row.i} className="hover:bg-slate-50">
                          <td className="px-2.5 py-1.5 font-sans font-bold" style={{ color: row.color }}>
                            i={row.i}
                          </td>
                          <td className="px-2 py-1.5 text-right">{row.x.toFixed(2)}</td>
                          <td className="px-2 py-1.5 text-right">{row.y.toFixed(1)}</td>
                          <td className="px-2 py-1.5 text-right font-semibold text-indigo-700">
                            {row.li.toFixed(3)}
                          </td>
                          <td className="px-2 py-1.5 text-right font-semibold text-teal-700">
                            {row.contrib.toFixed(1)}
                          </td>
                          <td
                            className={`px-2.5 py-1.5 text-right ${
                              row.residual >= 0 ? 'text-teal-700' : 'text-rose-700'
                            }`}
                          >
                            {row.residual >= 0 ? '+' : ''}
                            {row.residual.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                      <tr className="border-t-2 border-amber-300 bg-amber-50 font-bold text-slate-900">
                        <td className="px-2.5 py-2 font-sans">Σ</td>
                        <td className="px-2 py-2 text-right">—</td>
                        <td className="px-2 py-2 text-right">—</td>
                        <td className="px-2 py-2 text-right text-indigo-700">{sumLi.toFixed(3)}</td>
                        <td className="px-2 py-2 text-right text-teal-800">{lagY.toFixed(1)}</td>
                        <td className="px-2.5 py-2 text-right text-slate-500">—</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="space-y-4 lg:col-span-7">
                {/* Interactive Graph Layer Toggles */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Capas visibles:</span>
                  {[
                    { label: 'Regresión lineal ŷ', active: showRegression, toggle: () => setShowRegression((v) => !v) },
                    { label: 'Lagrange P₃(x)', active: showLagrange, toggle: () => setShowLagrange((v) => !v) },
                    { label: 'Bases yᵢ·Lᵢ(x)', active: showBases, toggle: () => setShowBases((v) => !v) },
                    { label: 'Residuos eᵢ en nodos', active: showResiduals, toggle: () => setShowResiduals((v) => !v) },
                  ].map((layer) => (
                    <button
                      key={layer.label}
                      type="button"
                      onClick={layer.toggle}
                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-all ${
                        layer.active
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-800 shadow-2xs'
                          : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      <CheckCircle2
                        className={`h-3.5 w-3.5 ${layer.active ? 'text-indigo-600' : 'text-slate-300'}`}
                        aria-hidden="true"
                      />
                      <span>{layer.label}</span>
                    </button>
                  ))}
                </div>

                <svg
                  viewBox="0 0 400 200"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50"
                  role="img"
                  aria-label="Comparación gráfica entre regresión lineal, polinomio de Lagrange, bases y residuos"
                >
                  <defs>
                    <clipPath id="numPlotClip">
                      <rect x="44" y="24" width="336" height="148" />
                    </clipPath>
                  </defs>

                  {/* Interpolation range shade */}
                  <rect
                    x={toSvgX(LAGRANGE_NODES[0][0])}
                    y="24"
                    width={toSvgX(LAGRANGE_NODES[3][0]) - toSvgX(LAGRANGE_NODES[0][0])}
                    height="148"
                    fill="rgba(13, 148, 136, 0.06)"
                  />

                  {/* Grid lines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
                    const yy = 172 - frac * 145;
                    return (
                      <g key={frac}>
                        <line x1="44" y1={yy} x2="380" y2={yy} stroke="#e2e8f0" strokeWidth="1" />
                        <text x="38" y={yy + 3} textAnchor="end" className="fill-slate-500 text-[8px]">
                          {Math.round(3900 * frac)}
                        </text>
                      </g>
                    );
                  })}

                  <g clipPath="url(#numPlotClip)">
                    {/* Weighted Lagrange basis curves y_i * L_i(x) */}
                    {showBases &&
                      basisPolylines.map((ptsStr, i) => (
                        <polyline
                          key={i}
                          fill="none"
                          stroke={NODE_COLORS[i]}
                          strokeWidth="1.3"
                          strokeDasharray="4 3"
                          opacity="0.7"
                          points={ptsStr}
                        />
                      ))}

                    {/* Residual stems between nodes and OLS regression line */}
                    {showResiduals &&
                      basisValues.map((row) => {
                        const nx = toSvgX(row.x);
                        const ny = toSvgY(row.y);
                        const ry = toSvgY(row.regAtNode);
                        const side = Math.max(4, Math.abs(ny - ry));
                        return (
                          <g key={`res-${row.i}`}>
                            <rect
                              x={nx}
                              y={Math.min(ny, ry)}
                              width={side}
                              height={side}
                              fill="rgba(225, 29, 72, 0.14)"
                              stroke="rgba(225, 29, 72, 0.45)"
                              strokeWidth="0.8"
                            />
                            <line
                              x1={nx}
                              y1={ny}
                              x2={nx}
                              y2={ry}
                              stroke="#e11d48"
                              strokeWidth="1.5"
                              strokeDasharray="2 2"
                            />
                          </g>
                        );
                      })}

                    {/* Linear regression line */}
                    {showRegression && (
                      <line
                        x1={toSvgX(0)}
                        y1={toSvgY(evalLinearRegression(0))}
                        x2={toSvgX(100)}
                        y2={toSvgY(evalLinearRegression(100))}
                        stroke="#4338ca"
                        strokeWidth="2.5"
                      />
                    )}

                    {/* Lagrange curve */}
                    {showLagrange && (
                      <polyline fill="none" stroke="#0d9488" strokeWidth="2.2" points={lagPolyline} />
                    )}

                    {/* 4 Interpolation nodes */}
                    {LAGRANGE_NODES.map(([nx, ny], i) => (
                      <circle
                        key={i}
                        cx={toSvgX(nx)}
                        cy={toSvgY(ny)}
                        r="4.2"
                        fill={NODE_COLORS[i]}
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                    ))}

                    {/* Active vertical guide & points */}
                    <line
                      x1={toSvgX(numX)}
                      y1="24"
                      x2={toSvgX(numX)}
                      y2="172"
                      stroke="#b45309"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                    />
                    {showRegression && (
                      <circle
                        cx={toSvgX(numX)}
                        cy={toSvgY(regY)}
                        r="5"
                        fill="#4338ca"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    )}
                    {showLagrange && (
                      <circle
                        cx={toSvgX(numX)}
                        cy={toSvgY(lagY)}
                        r="5"
                        fill="#0d9488"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                    )}
                  </g>

                  <text x="48" y="16" className="fill-indigo-700 text-[8.5px] font-bold">
                    — Regresión ŷ
                  </text>
                  <text x="122" y="16" className="fill-teal-700 text-[8.5px] font-bold">
                    — Lagrange P₃(x)
                  </text>
                  <text x="215" y="16" className="fill-slate-500 text-[8px]">
                    Zona sombreada: rango interpolación
                  </text>
                  <text x="12" y="102" textAnchor="middle" transform="rotate(-90 12 102)" className="fill-slate-600 text-[8.5px] font-semibold">
                    Duración en s (Y)
                  </text>
                  <text x="212" y="192" textAnchor="middle" className="fill-slate-600 text-[9px] font-semibold">
                    Eje X: ProductRelated (páginas de 0 a 100)
                  </text>
                </svg>

                {/* Clean Comparison Table: Which is Which */}
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-100 text-slate-800">
                        <th className="px-3 py-2 text-left">Criterio</th>
                        <th className="px-3 py-2 text-left text-indigo-800">
                          Regresión lineal (Mín. Cuadrados)
                        </th>
                        <th className="px-3 py-2 text-left text-teal-800">
                          Interpolación de Lagrange (P₃)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white text-slate-700">
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">Qué hace</td>
                        <td className="px-3 py-2">Minimiza Σeᵢ² sobre las sesiones</td>
                        <td className="px-3 py-2">Pasa exacto por 4 nodos (error 0 ahí)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">Ante ruido real</td>
                        <td className="px-3 py-2">Estable; suaviza dispersión</td>
                        <td className="px-3 py-2">Puede oscilar al subir grado (Runge)</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2 font-semibold text-slate-900">Cuándo usar</td>
                        <td className="px-3 py-2 font-medium text-indigo-700">
                          Tendencia global (ProductRelated → Duración)
                        </td>
                        <td className="px-3 py-2 font-medium text-teal-700">
                          Estimación puntual dentro de [3,77 ; 84,66]
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
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
