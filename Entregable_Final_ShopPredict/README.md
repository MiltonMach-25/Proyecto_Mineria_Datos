# ShopPredict · Intención de Compra

Entrega final del proyecto de Minería de Datos y Métodos Numéricos.

**Repositorio:** [Proyecto_Mineria_Datos](https://github.com/MiltonMach-25/Proyecto_Mineria_Datos)

**Equipo:** Milton Cesar Machado Barreto · Raúl Andrés Triana Ortega · Santiago Molina Maldonado
**Institución:** UNIMINUTO · Ingeniería de Sistemas · 2026

## Estado real de la entrega

- Incluye dataset, presentación HTML autónoma de 12 diapositivas, dashboard y API FastAPI.
- El backend está preparado para ejecutarse localmente y construirse como imagen Docker para Cloud Run.
- El frontend de Google AI Studio Build está pendiente de generarse e integrarse; el prompt está en [`PROMPT_MAESTRO_IA_STUDIO.md`](./PROMPT_MAESTRO_IA_STUDIO.md).
- No se afirma que la aplicación esté desplegada públicamente. La publicación en Cloud Run requiere configurar el proyecto y ejecutar los pasos de despliegue.
- La validación de CSV es temporal y no persiste ni reemplaza datos.

## Arquitectura objetivo

```text
GitHub (código y dataset)
        ↓
Google AI Studio Build (frontend por generar/integrar)
        ↓
FastAPI + scikit-learn (backend incluido)
        ↓
Google Cloud Run (despliegue pendiente)
```

La API también sirve la presentación y el dashboard HTML incluidos. No se requieren
claves para la ejecución local. No hay integración activa con bases de datos externas.

## Contenido

| Ruta | Propósito |
|---|---|
| `index.html` | Presentación final: 9 diapositivas de minería, incluida la portada, y 3 de métodos numéricos. |
| `dashboard.html` | KPIs, métricas verificadas y validación temporal de archivos CSV. |
| `backend/` | API FastAPI, preparación de datos y modelos de clasificación. |
| `data/online_shoppers_intention.csv` | Dataset de entrada original. |
| `assets/evidencias/` | EDA, métricas y visualizaciones del proyecto. |
| `AUDITORIA.md` | Alcance, resultados verificados, limitaciones y pendientes. |
| `PROMPT_MAESTRO_IA_STUDIO.md` | Instrucción única para generar e integrar el frontend. |
| `docs/` | Material académico complementario; las guías internas se conservaron con nombres distintos para evitar README duplicados. |

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

## Ejecutar localmente en Windows

Desde esta carpeta (`Entregable_Final_ShopPredict`), en PowerShell:

```powershell
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r backend\requirements.txt
python -m uvicorn backend.api_shoppredict:app --reload --host 127.0.0.1 --port 8080
```

Abre:

- Presentación: `http://127.0.0.1:8080/`
- Dashboard: `http://127.0.0.1:8080/dashboard.html`
- Documentación interactiva de la API: `http://127.0.0.1:8080/docs`

La API entrena los tres modelos disponibles al iniciar. El arranque puede tardar
unos segundos. Para usar otro CSV como dataset principal, define
`SHOPPREDICT_DATASET` antes de iniciar el servidor; el archivo debe incluir las
18 columnas originales requeridas.

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

## Preparar el despliegue en Google Cloud Run

Requiere una cuenta de Google Cloud con facturación y permisos para Cloud Build,
Artifact Registry y Cloud Run. Sustituye los valores de ejemplo por los de tu
proyecto y región; no guardes credenciales en el repositorio.

```powershell
gcloud auth login
gcloud config set project PROJECT_ID
gcloud artifacts repositories create REPOSITORY --repository-format=docker --location=REGION
gcloud builds submit --tag REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/shoppredict-api:latest .
gcloud run deploy shoppredict-api `
  --image REGION-docker.pkg.dev/PROJECT_ID/REPOSITORY/shoppredict-api:latest `
  --region REGION `
  --port 8080 `
  --set-env-vars SHOPPREDICT_DATASET=/app/data/online_shoppers_intention.csv
```

Si el frontend se aloja en un origen distinto, agrega ese origen a
`FRONTEND_ORIGINS` como variable del servicio Cloud Run. El acceso público y la
autenticación deben decidirse en la configuración del servicio; no se habilita
acceso público automáticamente en esta guía. Si se decide publicar un demo con
este dataset público, agrega `--allow-unauthenticated` al comando de despliegue.
Después del despliegue, comprueba `/health`, `/stats`, `/docs` y una predicción
real antes de presentar la URL como funcional.

## Presentación

Abre `index.html` directamente en un navegador o usa la ruta `/` del backend.
El HTML incluye sus diagramas y gráficos; sus imágenes locales están dentro de
`assets/`. La portada y ocho diapositivas restantes cubren minería de datos;
las tres últimas explican regresión lineal, Lagrange y su diferencia. Los
diagramas de árbol y dendrograma son esquemas conceptuales, no resultados
calculados con ShopPredict.

## Documentación canónica

- [`AUDITORIA.md`](./AUDITORIA.md): auditoría técnica y académica.
- [`PROMPT_MAESTRO_IA_STUDIO.md`](./PROMPT_MAESTRO_IA_STUDIO.md): prompt vigente para AI Studio.
- Las guías y archivos de contexto en `docs/` son material complementario. Este
  es el único archivo llamado `README.md` dentro de la entrega.
