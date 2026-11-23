# Auditoría de ShopPredict

## Alcance y estado

Se revisaron la entrega, el dataset, las evidencias de EDA y modelos, la
presentación, el dashboard React integrado y los contratos de la API.

- La entrega contiene una presentación autónoma de **12 diapositivas**: portada,
  8 de minería de datos/arquitectura y 3 de métodos numéricos (`index.html`).
- Se completó e integró el frontend web en español (`frontend/`) con dashboard de
  KPIs y filtros reales (`/stats`), comparación verificada de modelos (`/metrics`),
  formulario dinámico de predicción (`/schema` + `/predict`), validación temporal de
  CSV (`/dataset/validate`), contrato de API (`/docs`) y delimitación explícita de
  métodos pendientes/conceptuales.
- En el entorno de ejecución de Google AI Studio Build (Node.js 22), la API y los
  tres modelos demostrativos se adaptaron al servidor TypeScript/Express (`server.ts`,
  `src/dataset.ts`, `src/models.ts`) conservando los contratos exactos de respuesta;
  **probado localmente** con pruebas unitarias y navegador Chromium.
- Se conserva el `Dockerfile` preparado para Cloud Run (publicación directa vía
  `gcloud run deploy shoppredict --source .`), aunque **no se verificó un
  despliegue público** en Cloud Run ni sincronización de ramas Git porque el
  entorno no dispone de `gcloud`, proyecto GCP, facturación ni remoto `.git`.
  El flujo principal documentado es la apertura desde Visual Studio Code o la
  carpeta del trabajo, y después figura la sección **Opción alternativa · Acceso
  web (entorno de desarrollo y despliegue en la nube)** en `README.md`.
- La carga de CSV solo valida el archivo temporalmente (`persisted: false`); no
  persiste, importa ni reemplaza el dataset.

## Dataset verificado

Archivo: `data/online_shoppers_intention.csv`

- 12.330 filas y 18 columnas.
- 0 valores faltantes en el archivo original.
- 125 duplicados exactos; quedan 12.205 filas al deduplicar.
- 1.908 compras; 15,47 % sobre las 12.330 filas originales y 15,63 % sobre las
  12.205 filas deduplicadas.
- `Revenue` es la variable objetivo.

## Hallazgos exploratorios documentados

- Mediana de `ProductRelated_Duration`: 510 segundos sin compra y 1.110 segundos
  con compra.
- `PageValues = 0`: 77,86 %.
- Conversión entre filas con `PageValues > 0`: 56,34 %.
- Correlación `BounceRates`–`ExitRates`: 0,913.
- Correlación `PageValues`–`Revenue` codificada 0/1: 0,493.

Las asociaciones no prueban causalidad.

## Modelos supervisados

Las métricas guardadas corresponden a una partición estratificada 80/20 con
semilla 42, después de eliminar duplicados:

| Modelo | Accuracy | F1 |
|---|---:|---:|
| Árbol de decisión | 0,8574 | 0,5561 |
| Random Forest | 0,9029 | 0,6348 |
| Regresión logística | 0,8873 | 0,5347 |

Random Forest obtuvo el mayor F1 **en esa partición**. No es una afirmación de
superioridad universal ni de desempeño en producción.

La API entrena estos tres modelos al iniciar para permitir predicciones de
demostración. El dashboard muestra las métricas de la partición documentada,
leídas de `assets/evidencias/metricas_modelos.csv`; no las confunde con una
evaluación del modelo entrenado en memoria.

## Métodos numéricos

Las variables usadas son `ProductRelated` (x) y `ProductRelated_Duration` (y).

Regresión lineal preliminar por mínimos cuadrados:

```text
ŷ = -0,857242 + 37,566054x
R² = 0,77093
RMSE = 844,436 segundos
```

Para `x = 20`, la recta estima aproximadamente 750,5 segundos.

Puntos elegidos para la interpolación de Lagrange:

| x | y (segundos) |
|---:|---:|
| 3,7718 | 145,2464 |
| 12,2917 | 489,1138 |
| 26,5391 | 1.044,8487 |
| 84,6620 | 3.098,1926 |

El polinomio es de grado máximo 3; para `x = 20` estima aproximadamente
792,7 segundos. La regresión resume una tendencia global; Lagrange interpola
exactamente los puntos elegidos y puede oscilar fuera de ellos.

## Límites y pendientes

- Naive Bayes y KNN aparecen como explicaciones metodológicas; **no tienen
  métricas calculadas** en la partición documentada.
- K-means y clustering jerárquico no tienen resultados finales, perfiles de
  clústeres, codo ni silueta calculados para ShopPredict.
- Se retiraron de la presentación los gráficos ajenos al dataset y se
  reemplazaron por esquemas explícitamente conceptuales, no por resultados
  atribuidos al modelo o al clustering de ShopPredict.
- La validación de CSV tiene un límite de 10 MB y no guarda el archivo.
- No se ha configurado autenticación, persistencia de cargas ni una base de
  datos remota; ninguna de ellas se anuncia como funcionalidad implementada.
- No hay claves ni credenciales incluidas en el repositorio.
