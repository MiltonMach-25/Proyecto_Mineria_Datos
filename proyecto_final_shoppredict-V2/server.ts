import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import multer from 'multer';

import {
  inspectDataset,
  loadVerifiedMetrics,
  parseCsvBuffer,
  TARGET,
} from './src/dataset.js';
import {
  MODEL_NAMES,
  type ModelName,
  prepareTrainingDataset,
  trainAllModels,
} from './src/models.js';
import { computeFilteredStats } from './src/stats.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PACKAGE_DIR = path.resolve(__dirname, 'Entregable_Final_ShopPredict');
const DEFAULT_DATASET = path.join(PACKAGE_DIR, 'data', 'online_shoppers_intention.csv');
const METRICS_FILE = path.join(PACKAGE_DIR, 'assets', 'evidencias', 'metricas_modelos.csv');
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const KAGGLE_SOURCE =
  'https://www.kaggle.com/datasets/imakash3011/online-shoppers-purchasing-intention-dataset';
const UCI_SOURCE =
  'https://archive.ics.uci.edu/dataset/468/online+shoppers+purchasing+intention+dataset';

function resolveDatasetPath(): string {
  const configured = process.env.SHOPPREDICT_DATASET || DEFAULT_DATASET;
  if (path.isAbsolute(configured)) {
    if (fs.existsSync(configured)) return configured;
    // Handle Docker path (/app/data/...) gracefully when running locally in workspace
    const fallback = path.join(PACKAGE_DIR, 'data', path.basename(configured));
    if (fs.existsSync(fallback)) return fallback;
    return configured;
  }
  const relToPackage = path.resolve(PACKAGE_DIR, configured);
  if (fs.existsSync(relToPackage)) return relToPackage;
  return path.resolve(__dirname, configured);
}

function initializeAppState() {
  const datasetPath = resolveDatasetPath();
  if (!fs.existsSync(datasetPath) || !fs.statSync(datasetPath).isFile()) {
    throw new Error(
      `No se encontró el dataset: ${datasetPath}. Define SHOPPREDICT_DATASET o restaura data/online_shoppers_intention.csv.`
    );
  }

  const csvBuffer = fs.readFileSync(datasetPath);
  const { columns, records } = parseCsvBuffer(csvBuffer);

  const validation = inspectDataset(columns, records);
  if (!validation.valid) {
    throw new Error(`El dataset no pasó la validación: ${validation.issues.join('; ')}`);
  }

  const dataset = prepareTrainingDataset(columns, records);
  const models = trainAllModels(dataset);

  if (!fs.existsSync(METRICS_FILE)) {
    throw new Error(`No se encontró el archivo de métricas verificadas: ${METRICS_FILE}`);
  }
  const modelMetrics = loadVerifiedMetrics(fs.readFileSync(METRICS_FILE));

  const metadata = {
    file: path.basename(datasetPath),
    rows_loaded: dataset.rowsLoaded,
    rows_used: dataset.rowsUsed,
    features: dataset.featureColumns.length,
    duplicates_removed: dataset.duplicatesRemoved,
    target: TARGET,
    training: 'All available labeled rows; this is for API demonstration.',
    kaggle_source: KAGGLE_SOURCE,
    uci_reference: UCI_SOURCE,
  };

  return { dataset, models, modelMetrics, metadata };
}

const state = initializeAppState();

const app = express();
app.use(express.json({ limit: '1mb' }));

const corsOrigins = (
  process.env.FRONTEND_ORIGINS ||
  'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173'
)
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || corsOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, true);
      }
    },
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_UPLOAD_BYTES },
});

app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ready',
    models_loaded: MODEL_NAMES.length,
  });
});

app.get('/metadata', (_req: Request, res: Response) => {
  res.json(state.metadata);
});

app.get('/stats', (req: Request, res: Response) => {
  const month = typeof req.query.month === 'string' && req.query.month ? req.query.month : null;
  const visitorType =
    typeof req.query.visitor_type === 'string' && req.query.visitor_type
      ? req.query.visitor_type
      : null;

  if (month && !state.dataset.categoricalOptions['Month']?.includes(month)) {
    res.status(422).json({ detail: 'El mes seleccionado no existe.' });
    return;
  }
  if (visitorType && !state.dataset.categoricalOptions['VisitorType']?.includes(visitorType)) {
    res.status(422).json({ detail: 'El tipo de visitante seleccionado no existe.' });
    return;
  }

  const computed = computeFilteredStats(state.dataset.rows, month, visitorType);

  res.json({
    total: computed.total,
    purchases: computed.purchases,
    conversion: computed.conversion,
    avg_duration: computed.avg_duration,
    filters: { month, visitor_type: visitorType },
    metrics_scope: 'Métricas de modelos: holdout global documentado, sin filtros.',
    models: state.modelMetrics,
    breakdown: computed.breakdown,
  });
});

app.get('/dataset/sample-csv', (_req: Request, res: Response) => {
  const cols = [...state.dataset.featureColumns, TARGET];
  const sampleBuy = state.dataset.rows.filter((r) => r.revenue).slice(0, 10);
  const sampleNoBuy = state.dataset.rows.filter((r) => !r.revenue).slice(0, 15);
  const subset = [...sampleBuy, ...sampleNoBuy];
  const header = cols.join(',');
  const lines = subset.map((row) =>
    cols
      .map((col) => {
        if (col === TARGET) return row.revenue ? 'TRUE' : 'FALSE';
        if (col === 'Weekend') return row.numeric['Weekend'] === 1 ? 'TRUE' : 'FALSE';
        if (col in row.categorical) return String(row.categorical[col]);
        return String(row.numeric[col] ?? 0);
      })
      .join(',')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="shoppredict_muestra_valida.csv"');
  res.send([header, ...lines].join('\n'));
});

app.get('/metrics', (_req: Request, res: Response) => {
  res.json(state.modelMetrics);
});

app.get('/schema', (_req: Request, res: Response) => {
  res.json({
    target: TARGET,
    features: state.dataset.featureColumns,
    numeric_features: state.dataset.numericColumns,
    categorical_features: state.dataset.categoricalColumns,
    categorical_options: state.dataset.categoricalOptions,
    numeric_ranges: state.dataset.numericRanges,
    models: MODEL_NAMES,
  });
});

app.post(
  '/dataset/validate',
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err: unknown) => {
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(413).json({
          detail: `El archivo supera el límite de ${MAX_UPLOAD_BYTES / (1024 * 1024)} MB.`,
        });
        return;
      }
      if (err) {
        next(err);
        return;
      }
      next();
    });
  },
  (req: Request, res: Response) => {
    const file = req.file;
    if (!file || !file.buffer || file.buffer.length === 0) {
      res.status(422).json({ detail: 'El archivo está vacío.' });
      return;
    }

    try {
      const { columns, records } = parseCsvBuffer(file.buffer);
      const validation = inspectDataset(columns, records);
      res.json({
        ...validation,
        persisted: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      res.status(422).json({ detail: `No se pudo leer el CSV: ${message}` });
    }
  }
);

app.post('/predict', (req: Request, res: Response) => {
  const body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    res.status(422).json({ detail: 'El cuerpo de la solicitud debe ser un objeto JSON.' });
    return;
  }

  const allowedTopKeys = new Set(['model', 'features']);
  const extraTopKeys = Object.keys(body).filter((k) => !allowedTopKeys.has(k));
  if (extraTopKeys.length > 0) {
    res.status(422).json({
      detail: `Campos no permitidos en la solicitud: ${extraTopKeys.join(', ')}`,
    });
    return;
  }

  const modelName: ModelName = body.model ?? 'Random Forest';
  if (!MODEL_NAMES.includes(modelName)) {
    res.status(422).json({
      detail: `Modelo no válido. Opciones disponibles: ${MODEL_NAMES.join(', ')}`,
    });
    return;
  }

  const features = body.features;
  if (!features || typeof features !== 'object' || Array.isArray(features)) {
    res.status(422).json({ detail: 'El campo features debe ser un objeto con los predictores.' });
    return;
  }

  const expected = new Set(state.dataset.featureColumns);
  const provided = new Set(Object.keys(features));
  const missing = [...expected].filter((c) => !provided.has(c)).sort();
  const unexpected = [...provided].filter((c) => !expected.has(c)).sort();

  if (missing.length > 0 || unexpected.length > 0) {
    const details: string[] = [];
    if (missing.length > 0) details.push(`Faltan variables: ${missing.join(', ')}`);
    if (unexpected.length > 0) details.push(`Variables no esperadas: ${unexpected.join(', ')}`);
    res.status(422).json({ detail: details.join('; ') });
    return;
  }

  try {
    const probability = state.models.predictProbability(modelName, features as Record<string, unknown>);
    const prediction = probability >= 0.5;
    res.json({
      model: modelName,
      revenue: prediction,
      label: prediction ? 'Compra' : 'Sin compra',
      probability_purchase: probability,
      note: 'Demostración académica; la estimación no garantiza una compra ni representa desempeño en producción.',
    });
  } catch (error) {
    res.status(422).json({
      detail: error instanceof Error ? error.message : String(error),
    });
  }
});

app.get('/openapi.json', (_req: Request, res: Response) => {
  res.json({
    openapi: '3.1.0',
    info: {
      title: 'ShopPredict · Intención de Compra API',
      version: '1.0.0',
      description:
        'API para consultar estadísticas verificadas, validar CSV temporales y estimar Revenue sobre Online Shoppers Purchasing Intention.',
    },
    paths: {
      '/health': { get: { summary: 'Estado del servicio y modelos cargados' } },
      '/metadata': { get: { summary: 'Procedencia, filas cargadas y duplicados excluidos' } },
      '/stats': { get: { summary: 'KPIs filtrados por month y visitor_type; métricas globales' } },
      '/metrics': { get: { summary: 'Métricas verificadas del holdout global 80/20 (semilla 42)' } },
      '/schema': { get: { summary: 'Variables, opciones categóricas, rangos numéricos y modelos' } },
      '/predict': { post: { summary: 'Predicción individual con Árbol, Random Forest o Regresión logística' } },
      '/dataset/validate': { post: { summary: 'Validación temporal de CSV (máx. 10 MB, persisted=false)' } },
    },
  });
});

app.get('/docs', (_req: Request, res: Response) => {
  res.type('html').send(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ShopPredict API · Control y Documentación</title>
<style>
body{margin:0;background:#f8fafc;color:#0f172a;font-family:system-ui,-apple-system,sans-serif;line-height:1.5}
.wrap{max-width:980px;margin:0 auto;padding:32px 20px}
.head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-bottom:1px solid #e2e8f0;padding-bottom:16px}
a{color:#4338ca;text-decoration:none;font-weight:600}a:hover{text-decoration:underline}
.grid{display:grid;grid-template-columns:1.1fr .9fr;gap:18px;margin-top:18px}
.card{background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:16px 18px;margin-bottom:12px;transition:border-color .15s,box-shadow .15s}
.card:hover{border-color:#c7d2fe;box-shadow:0 6px 18px rgba(15,23,42,.05)}
.ep-top{display:flex;justify-content:space-between;align-items:center;gap:10px}
.ep{display:flex;align-items:center;gap:10px;font-family:ui-monospace,monospace;font-size:13.5px;font-weight:700}
.m{padding:2px 8px;border-radius:6px;font-size:11px;background:#eef2ff;color:#3730a3}
.m.post{background:#ecfdf5;color:#065f46}
button.try{border:1px solid #c7d2fe;background:#eef2ff;color:#3730a3;border-radius:8px;padding:6px 11px;font-size:12px;font-weight:700;cursor:pointer}
button.try:hover{background:#4338ca;color:#fff}
p{margin:8px 0 0;font-size:13.5px;color:#475569}
pre{background:#0f172a;color:#e2e8f0;padding:14px;border-radius:10px;overflow:auto;max-height:540px;font-size:12px;line-height:1.45;margin:10px 0 0}
.console{position:sticky;top:20px}
@media(max-width:860px){.grid{grid-template-columns:1fr}}
</style>
</head>
<body>
<main class="wrap">
<div class="head">
  <div><h1 style="margin:0;font-size:24px">ShopPredict · Control interactivo y contrato de API</h1><p>Prueba endpoints en tiempo real · <a href="/openapi.json">openapi.json</a></p></div>
  <div style="display:flex;gap:14px"><a href="/">← Volver al Dashboard</a><a href="/index.html">Presentación (12 láminas)</a></div>
</div>
<div class="grid">
  <div>
    <div class="card"><div class="ep-top"><div class="ep"><span class="m">GET</span><span>/health</span></div><button class="try" onclick="callApi('GET','/health')">Probar</button></div><p>Confirma disponibilidad del servicio y cantidad de modelos entrenados en memoria.</p></div>
    <div class="card"><div class="ep-top"><div class="ep"><span class="m">GET</span><span>/metadata</span></div><button class="try" onclick="callApi('GET','/metadata')">Probar</button></div><p>Retorna archivo fuente, 12.330 filas cargadas, 12.205 limpias y 125 duplicados removidos.</p></div>
    <div class="card"><div class="ep-top"><div class="ep"><span class="m">GET</span><span>/stats?month=Nov</span></div><button class="try" onclick="callApi('GET','/stats?month=Nov')">Probar Nov</button></div><p>KPIs y desgloses reales por mes, visitante, fin de semana y señal de PageValues.</p></div>
    <div class="card"><div class="ep-top"><div class="ep"><span class="m">GET</span><span>/metrics</span></div><button class="try" onclick="callApi('GET','/metrics')">Probar</button></div><p>Métricas verificadas del holdout 80/20 (semilla 42) para Árbol, Random Forest y Regresión logística.</p></div>
    <div class="card"><div class="ep-top"><div class="ep"><span class="m">GET</span><span>/schema</span></div><button class="try" onclick="callApi('GET','/schema')">Probar</button></div><p>Describe las 17 variables predictoras, opciones categóricas y rangos numéricos.</p></div>
    <div class="card"><div class="ep-top"><div class="ep"><span class="m post">POST</span><span>/predict</span></div><button class="try" onclick="testPredict()">Probar inferencia</button></div><p>Recibe <code>{ model, features }</code> y retorna clase, probabilidad y nota académica.</p></div>
    <div class="card"><div class="ep-top"><div class="ep"><span class="m post">POST</span><span>/dataset/validate</span></div><button class="try" onclick="testInvalidCsv()">Probar CSV inválido</button></div><p>Audita estructura CSV temporal (<code>persisted: false</code>). Prueba un rechazo real por columnas faltantes.</p></div>
  </div>
  <aside class="card console">
    <div class="ep-top"><strong>Respuesta en vivo</strong><span id="apiStatus" class="m">Listo</span></div>
    <pre id="apiOut">Pulsa "Probar" en cualquier endpoint para inspeccionar la respuesta JSON real del backend.</pre>
  </aside>
</div>
</main>
<script>
const out=document.getElementById('apiOut'),st=document.getElementById('apiStatus');
async function callApi(method,url,opts){
  st.textContent='Consultando...';
  try{
    const res=await fetch(url,{method,...(opts||{})});
    const data=await res.json();
    st.textContent=method+' '+url+' · HTTP '+res.status;
    out.textContent=JSON.stringify(data,null,2);
  }catch(e){st.textContent='Error';out.textContent=String(e);}
}
async function testPredict(){
  const payload={model:'Random Forest',features:{Administrative:4,Administrative_Duration:120,Informational:0,Informational_Duration:0,ProductRelated:35,ProductRelated_Duration:1650,BounceRates:0.002,ExitRates:0.008,PageValues:55,SpecialDay:0,Month:'Nov',OperatingSystems:'1',Browser:'1',Region:'1',TrafficType:'1',VisitorType:'Returning_Visitor',Weekend:false}};
  await callApi('POST','/predict',{headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
}
async function testInvalidCsv(){
  const bad=new Blob(['ProductRelated,Month,Weekend\\n10,Nov,False\\n'],{type:'text/csv'});
  const fd=new FormData();fd.append('file',bad,'csv_invalido_prueba.csv');
  await callApi('POST','/dataset/validate',{body:fd});
}
</script>
</body>
</html>`);
});

const DIST_DIR = path.join(PACKAGE_DIR, 'dist');
const DIST_INDEX = path.join(DIST_DIR, 'index.html');

app.use('/dashboard-assets', express.static(path.join(DIST_DIR, 'dashboard-assets')));
app.use('/assets', express.static(path.join(PACKAGE_DIR, 'assets')));

app.get('/', (_req: Request, res: Response) => {
  if (fs.existsSync(DIST_INDEX)) {
    res.sendFile(DIST_INDEX);
    return;
  }
  res.sendFile(path.join(PACKAGE_DIR, 'dashboard.html'));
});

app.get('/dashboard.html', (_req: Request, res: Response) => {
  if (fs.existsSync(DIST_INDEX)) {
    res.sendFile(DIST_INDEX);
    return;
  }
  res.sendFile(path.join(PACKAGE_DIR, 'dashboard.html'));
});

app.get('/index.html', (_req: Request, res: Response) => {
  res.sendFile(path.join(PACKAGE_DIR, 'index.html'));
});

app.get('/presentacion', (_req: Request, res: Response) => {
  res.sendFile(path.join(PACKAGE_DIR, 'index.html'));
});

const PORT = Number(process.env.PORT || 3000);
app.listen(PORT, '0.0.0.0', () => {
  console.log(
    `ShopPredict server listening on http://0.0.0.0:${PORT} (${state.metadata.rows_used} deduplicated sessions loaded)`
  );
});
