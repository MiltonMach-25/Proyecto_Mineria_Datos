# ShopPredict · Intención de Compra

Entrega final del proyecto de Minería de Datos y Métodos Numéricos.

**Repositorio:** [Proyecto_Mineria_Datos](https://github.com/MiltonMach-25/Proyecto_Mineria_Datos)
**Equipo:** Milton Cesar Machado Barreto · Raúl Andrés Triana Ortega · Santiago Molina Maldonado
**Institución:** UNIMINUTO · Ingeniería de Sistemas · 2026

> **Modo principal de apertura:** desde **Visual Studio Code** o directamente desde la **carpeta del proyecto** (`index.html` o `http://localhost:3000`).  
> **Opción alternativa en la web (entorno de desarrollo y nube):** disponible más abajo en la sección [`Opción alternativa · Acceso web (entorno de desarrollo y despliegue en la nube)`](#opción-alternativa--acceso-web-entorno-de-desarrollo-y-despliegue-en-la-nube).

## Estado real de la entrega

- Incluye dataset (`data/online_shoppers_intention.csv`), presentación HTML autónoma de 12 diapositivas (`index.html`), dashboard React + Vite + Tailwind CSS compilado (`frontend/` → `dist/`), respaldo estático (`dashboard.html`) y servidor API con rutas `/health`, `/metadata`, `/stats`, `/metrics`, `/schema`, `/predict`, `/dataset/validate`, `/dataset/sample-csv` y `/docs`.
- **Probado localmente en este entorno (Node.js 22 / Express / TypeScript):** el frontend y la API se compilaron, probaron con pruebas unitarias (`node:test`) y verificaron en navegador real con Playwright sobre `http://127.0.0.1:3000`.
- **Preparado para Google Cloud Run (sin depender de Visual Studio Code):** se conserva el `Dockerfile` para publicar todo (frontend + API + presentación) y entregar únicamente el enlace web al profesor/jurado.
- **No desplegado en producción desde este contenedor:** en este sandbox no existe `gcloud` CLI ni credenciales/proyecto de Google Cloud ni repositorio Git remoto adjunto. Por lo tanto, no se afirma ninguna URL pública de producción.
- La validación de CSV es temporal (`persisted: false`) y no persiste ni reemplaza datos.

## Arquitectura objetivo

```text
GitHub (código y dataset)
        ↓
Frontend React + Vite + Tailwind (integrado en frontend/ y compilado a dist/)
        ↓
API REST (/health, /metadata, /stats, /metrics, /schema, /predict, /dataset/validate, /docs)
        ↓
Google Cloud Run (pendiente de despliegue manual con gcloud y permisos de proyecto)
```

La API también sirve el dashboard compilado en `/`, la presentación de 12 diapositivas en `/index.html` y la documentación de contrato en `/docs`. No se requieren claves para la ejecución local. No hay integración activa con bases de datos externas.

## Contenido

| Ruta | Propósito |
|---|---|
| `frontend/` | Aplicación web moderna en React + Vite + Tailwind CSS v4 (se compila a `dist/`). |
| `dashboard.html` | Dashboard HTML autónomo equivalente (compatible directamente con FastAPI sin compilación adicional). |
| `index.html` | Presentación final (12 láminas): portada, 8 de minería/arquitectura y 3 de métodos numéricos con fórmulas y gráficos interactivos. |
| `data/online_shoppers_intention.csv` | Dataset de entrada original (`12.330` filas, `18` columnas). |
| `assets/evidencias/` | EDA, métricas verificadas (`metricas_modelos.csv`) y visualizaciones del proyecto. |
| `AUDITORIA.md` | Alcance, resultados verificados, limitaciones y pendientes. |
| `GUION_SUSTENTACION_FINAL.md` | Guion ejecutivo para la sustentación ante jurado y demo en vivo. |
| `PROMPT_MAESTRO_IA_STUDIO.md` | Instrucción utilizada para generar e integrar el frontend. |
| `docs/` | Material académico complementario. |

## Datos y resultados documentados

El dataset contiene **12.330 filas**, **18 columnas** y **0 valores faltantes**.
Se identificaron **125 duplicados exactos**; después de deduplicar quedan
**12.205 sesiones** y **1.908 compras**. La tasa sobre el archivo original es
**15,47 %**; sobre las filas deduplicadas, que usa el dashboard, es **15,63 %**.

La comparación de modelos registrada usa una partición estratificada 80/20,
semilla 42:

| Modelo | Accuracy | F1 |
|---|---:|---:|
| Árbol de decisión | 0,8574 | 0,5561 |
| Random Forest | 0,9029 | 0,6348 |
| Regresión logística | 0,8873 | 0,5347 |

Random Forest obtuvo el mayor F1 en esa partición concreta; esto no demuestra
superioridad universal ni desempeño en producción. Naive Bayes, KNN y K-means
no tienen resultados finales verificados para ShopPredict y no deben mostrarse
como métricas calculadas.

La presentación relaciona `ProductRelated` con `ProductRelated_Duration` para
explicar regresión lineal e interpolación de Lagrange. Las cifras y el método
se detallan en la auditoría.

## 1. Ejecución principal · Abrir desde Visual Studio Code o la carpeta del trabajo

El proyecto está configurado para ejecutarse principalmente en local desde la propia carpeta o en **Visual Studio Code**:

- **Presentación directa desde la carpeta:** haz doble clic en `Entregable_Final_ShopPredict/index.html` para abrir las 12 diapositivas con evidencias y gráficos interactivos sin iniciar servidor.
- **Aplicación completa en VS Code (`.vscode/` listo para usar con `F5`):**

### Opción A: Paquete exportado completo (Node.js 22 + React · recomendado)

Abre la carpeta raíz del proyecto en Visual Studio Code y presiona `F5` (o ejecuta en la terminal):

```bash
npm install
npm test
npm run build
npm run dev
```

Abre en el navegador:
- **Dashboard interactivo:** `http://localhost:3000/` (o `http://localhost:3000/dashboard.html`)
- **Presentación (12 diapositivas):** `http://localhost:3000/index.html`
- **Control y contrato de API:** `http://localhost:3000/docs` (`OpenAPI JSON` en `/openapi.json`)

Para probar el contenedor Docker en local desde la raíz:

```bash
docker build -t shoppredict .
docker run -p 8080:8080 shoppredict
```

### Opción B: Integrar en el repositorio GitHub con el backend Python FastAPI

Si conservas `backend/` (FastAPI + scikit-learn) en `MiltonMach-25/Proyecto_Mineria_Datos`:

1. Copia dentro de `Entregable_Final_ShopPredict/` las carpetas y archivos actualizados (`frontend/`, `dist/`, `dashboard.html`, `README.md`, `AUDITORIA.md`, `GUION_SUSTENTACION_FINAL.md`) **sin borrar** `backend/` ni el `Dockerfile` de Python.
2. En PowerShell (desde `Entregable_Final_ShopPredict/`):

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.api_shoppredict:app --reload --host 127.0.0.1 --port 8080
```

3. Abre:
   - Presentación: `http://127.0.0.1:8080/`
   - Dashboard completo: `http://127.0.0.1:8080/dashboard.html`
   - Documentación interactiva de la API: `http://127.0.0.1:8080/docs`

La API entrena los tres modelos disponibles al iniciar. Para usar otro CSV como dataset principal, define `SHOPPREDICT_DATASET` antes de iniciar el servidor.

## API disponible

| Método y ruta | Función |
|---|---|
| `GET /health` | Estado del servicio y cantidad de modelos cargados. |
| `GET /metadata` | Archivo, filas usadas, duplicados y procedencia del dataset. |
| `GET /schema` | Variables de entrada, tipos y modelos disponibles. |
| `GET /stats?month=...&visitor_type=...` | KPIs filtrados por mes/visitante; las métricas de modelos siguen siendo globales. |
| `GET /metrics` | Métricas guardadas de la partición documentada. |
| `POST /predict` | Predicción individual con Árbol, Random Forest o Regresión Logística. |
| `POST /dataset/validate` | Valida un CSV temporal de hasta 10 MB; no lo importa ni persiste. |

La inferencia de demostración se entrena con las filas etiquetadas disponibles al
iniciar el servicio. Las métricas mostradas en el dashboard se leen del archivo
verificado `assets/evidencias/metricas_modelos.csv`; no se vuelven a calcular
sobre los datos de entrenamiento del servicio.

## Pruebas locales

Desde la carpeta de la entrega:

```powershell
python -m unittest discover -s backend\tests -v
python -m compileall -q backend
```

## Opción alternativa · Acceso web (entorno de desarrollo y despliegue en la nube)

Además de la ejecución principal desde Visual Studio Code o la carpeta del trabajo, puedes acceder a la aplicación en la web mediante estas dos vías alternativas:

### 1) Acceso web del entorno de desarrollo (Google AI Studio)

> **Entorno de desarrollo (`dev`):** https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app  
> **Vista previa compartida (`preview`):** https://ais-pre-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app  
> *Nota:* enlaces correspondientes al **entorno de desarrollo y vista previa en Google AI Studio** donde se compiló y verificó la entrega (requieren acceso del entorno AI Studio; se mantienen como opción alternativa de acceso web).

| Vista / Recurso | Ruta web (local o entorno de desarrollo) | Qué permite demostrar |
|---|---|---|
| **Aplicación web (Dashboard)** | `/` o `/dashboard.html` | KPIs reales interactivos, gráficas por mes/visitante, matriz de confusión, predicción en 3 modelos, curva de sensibilidad e invalidación de CSV |
| **Presentación final (12 láminas)** | `/index.html` | Sustentación ágil de Minería (9 láminas) + Métodos Numéricos interactivos (3 láminas) con retorno `← Volver al Dashboard` |
| **Control interactivo de API** | `/docs` | Prueba directa en navegador de `/health`, `/stats`, `/metrics`, `/schema`, `/predict` y `/dataset/validate` |
| **Contrato OpenAPI JSON** | `/openapi.json` | Especificación de endpoints activos |

### 2) Publicación pública propia en Google Cloud Run (sin depender de Visual Studio Code)

> **Enlace público permanente (Cloud Run propio):** `PENDIENTE_DE_PUBLICACION` — *Al desplegar desde tu cuenta con `gcloud run deploy shoppredict --source .`, sustituye este texto por tu URL permanente `https://shoppredict-xxxxx.a.run.app`.*

Una vez subido todo a GitHub, puedes publicar la aplicación en la nube para que el profesor y el jurado entren **únicamente con el enlace web**, sin instalar nada ni abrir Visual Studio Code.

Requiere una cuenta de Google Cloud con facturación y permisos para Cloud Build y Cloud Run (no guardes credenciales en el repositorio):

#### Opción rápida (desde la raíz exportada con Node.js / React + API integrados)

```bash
gcloud auth login
gcloud config set project TU_PROJECT_ID
gcloud run deploy shoppredict \
  --source . \
  --region us-central1 \
  --allow-unauthenticated
```

Al terminar, Google Cloud imprimirá tu enlace público (`Service URL: https://shoppredict-....a.run.app`). Pega ese enlace en este apartado y en el `README.md` raíz antes de la entrega final.

#### Opción con backend Python FastAPI (dentro de `Entregable_Final_ShopPredict/` si conservaste `backend/`)

```powershell
gcloud auth login
gcloud config set project PROJECT_ID
gcloud artifacts repositories create REPOSITORY --repository-format=docker --location=REGION
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/shoppredict-api:latest .
gcloud run deploy shoppredict-api `
  --image REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/shoppredict-api:latest `
  --region REGION `
  --port 8080 `
  --set-env-vars SHOPPREDICT_DATASET=/app/data/online_shoppers_intention.csv `
  --allow-unauthenticated
```

Después del despliegue, comprueba `/health`, `/stats`, `/docs`, una predicción real y la invalidación de CSV antes de compartir la URL como enlace definitivo.

## Presentación

Abre `index.html` directamente en un navegador o usa la ruta `/` del backend.
El HTML incluye sus diagramas y gráficos; sus imágenes locales están dentro de
`assets/`. La portada y ocho diapositivas siguientes cubren minería de datos;
las tres últimas explican regresión lineal (con fórmulas de pendiente e intercepto),
interpolación de Lagrange (4 nodos y bases `Lᵢ(x)`) y su comparación interactiva. Los
diagramas de árbol y dendrograma son esquemas conceptuales, no resultados
calculados con ShopPredict.

## Documentación canónica

- [`AUDITORIA.md`](./AUDITORIA.md): auditoría técnica y académica.
- [`PROMPT_MAESTRO_IA_STUDIO.md`](./PROMPT_MAESTRO_IA_STUDIO.md): prompt vigente para AI Studio.
- Las guías y archivos de contexto en `docs/` son material complementario. Este
  es el único archivo llamado `README.md` dentro de la entrega.
