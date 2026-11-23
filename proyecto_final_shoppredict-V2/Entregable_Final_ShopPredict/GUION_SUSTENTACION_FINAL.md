# Guion de Sustentación Final · ShopPredict · Intención de Compra

**Equipo:** Milton Cesar Machado Barreto · Raúl Andrés Triana Ortega · Santiago Molina Maldonado  
**Programa:** Ingeniería de Sistemas · UNIMINUTO Ibagué · 2026  
**Duración sugerida:** 10–12 minutos (presentación + demostración en vivo) + 3–5 minutos de preguntas del jurado.

---

## 1. Apertura y propósito del sistema (1,5 min)

> *"Buenos días/tardes al jurado. Hoy presentamos **ShopPredict · Intención de Compra**, un sistema analítico completo diseñado para estimar la probabilidad de compra en sesiones de comercio electrónico a partir del comportamiento real de navegación."*

- **Problema de negocio:** En tiendas virtuales, la gran mayoría de visitas no termina en transacción. Identificar señales tempranas de compra permite priorizar estrategias de conversión sin depender de intuición.
- **Solución entregada:** No nos limitamos a un cuaderno estático: construimos un producto funcional con **dashboard interactivo, API de inferencia, validación de datos de entrada y presentación técnica** respaldada por auditoría de datos.

---

## 2. Datos, limpieza y hallazgos verificados (Diapositivas 1–4 · 2 min)

- **Contexto rápido:** Elegimos *ShopPredict* porque el `84,37 %` de sesiones no compra; construimos web + API en **VS Code + Express** (y Cloud Run como opción) para probar datos reales sin depender de un servicio externo ni separar el backend.
- **Fuente:** *Online Shoppers Purchasing Intention Dataset* (UCI / Kaggle).
- **Auditoría real de calidad:**
  - `12.330` filas originales, `18` columnas, `0` valores faltantes en el archivo fuente.
  - Detectamos y removimos **`125` duplicados exactos** antes de modelar, quedando **`12.205` sesiones depuradas** y **`1.908` compras** (`15,63 %` sobre filas deduplicadas; `15,47 %` sobre las originales).
- **Hallazgos exploratorios clave:**
  - La mediana de `ProductRelated_Duration` pasa de **510 segundos** en sesiones sin compra a **1.110 segundos** en sesiones con compra.
  - `PageValues = 0` en el **77,86 %** de los registros; cuando `PageValues > 0`, la conversión observada sube a **56,34 %**.
  - Correlaciones documentadas: `BounceRates`–`ExitRates` (`r = 0,913`) y `PageValues`–`Revenue` (`r = 0,493`).
  - *Aclaración rigurosa ante el jurado:* las correlaciones describen asociación estadística en los datos observados, **no causalidad**.

---

## 3. Metodología, modelado supervisado y transparencia (Diapositivas 5–9 · 2,5 min)

- **Pipeline sin fuga de datos:** Partición estratificada **80/20** con semilla `42` (`9.764` entrenamiento / `2.441` prueba), `OneHotEncoder` para variables categóricas y `StandardScaler` aplicado únicamente donde corresponde (Regresión Logística).
- **Resultados verificados en la partición documentada:**
  - **Árbol de decisión:** Accuracy `0,8574` · F1 `0,5561`
  - **Random Forest (mayor F1 en esta partición):** Accuracy `0,9029` · Precision `0,7715` · Recall `0,5393` · Balanced Accuracy `0,7548` · F1 `0,6348` · ROC-AUC `0,9248`
  - **Regresión logística:** Accuracy `0,8873` · F1 `0,5347` · ROC-AUC `0,8997`
- **Matriz de confusión (Random Forest):** `1.998` verdaderos negativos, `61` falsos positivos, `176` falsos negativos y `206` verdaderos positivos. El recall (`0,5393`) evidencia que aún se escapan compras reales por el desbalance de clases.
- **Rigor científico (qué NO inventamos):** Naive Bayes, KNN y Clustering (K-means y jerárquico) se presentan explícitamente como **marcos metodológicos pendientes de evaluación reproducible**, sin porcentajes ni clústeres simulados.

---

## 4. Métodos numéricos aplicados (Diapositivas 10–12 · 2 min)

Sobre `ProductRelated` ($x$) y `ProductRelated_Duration` ($y$):
- **Regresión lineal por mínimos cuadrados:** $\hat{y} = -0,857242 + 37,566054x$ ($R^2 = 0,77093$, $\text{RMSE} = 844,436\text{ s}$). Resume la tendencia global en presencia de ruido.
- **Interpolación de Lagrange (4 nodos):** Polinomio de grado máximo $3$ que pasa exactamente por los cuatro puntos representativos.
- **Criterio de selección:** Usamos **Regresión lineal** para tendencia global y **Lagrange** solo como estimación puntual didáctica dentro del intervalo observado (evitando oscilaciones de Runge). Ninguno reemplaza la clasificación supervisada.

---

## 5. Demostración en vivo de la aplicación (3 min)

Abrir principalmente desde **Visual Studio Code** o la carpeta del trabajo (`http://localhost:3000`, o `index.html` directo; como opción alternativa en línea está disponible el acceso web del entorno de desarrollo `https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app` o tu enlace de Cloud Run):

1. **Pestaña `Resumen`:**
   - Mostrar la barra de estado conectada al backend (`/health` + `12.330` filas / `125` duplicados).
   - Filtrar por mes **`Nov`** (y luego por `VisitorType = Returning_Visitor`) para mostrar cómo los KPIs cambian en vivo mientras las métricas de modelos permanecen en el holdout global.
2. **Pestaña `Predicción`:**
   - Cargar **`Perfil mediana`** → ejecutar predicción (`Sin compra`).
   - Cargar **`Perfil compra probable`** → ejecutar predicción (`Compra`) mostrando probabilidad real y nota de uso académico.
3. **Pestaña `Validar CSV`:**
   - Subir un CSV para demostrar la auditoría instantánea de estructura, duplicados y la garantía **`persisted = false`** (no modifica ni sobrescribe los datos en producción).
4. **Contrato técnico (`/docs`):**
   - Mostrar la documentación de endpoints (`/health`, `/metadata`, `/stats`, `/metrics`, `/schema`, `/predict`, `/dataset/validate`).

---

## 6. Respuestas preparadas para preguntas difíciles del jurado

- **¿Por qué elegir F1 y Balanced Accuracy en lugar de solo Accuracy?**  
  Porque solo el `15,63 %` de las sesiones depuradas son compras; un modelo trivial que predijera siempre "Sin compra" tendría `84,37 %` de Accuracy pero `0 %` de utilidad para detectar compradores.
- **¿Por qué Random Forest no se declara "el mejor para siempre"?**  
  Porque el F1 de `0,6348` corresponde a una única partición holdout 80/20 (semilla 42). En producción requeriría validación cruzada temporal, monitoreo de *data drift* y ajuste de umbral según costo de falso negativo vs. falso positivo.
- **¿Qué pasa si un usuario sube un CSV mal formado o con datos distintos?**  
  El endpoint `/dataset/validate` verifica columnas esperadas, tipos numéricos finitos, valores válidos en `Weekend` y `Revenue`, tamaño máximo de `10 MB`, y devuelve observaciones detalladas sin persistir el archivo (`persisted: false`).
- **¿Por qué separar el frontend de la lógica del modelo?**  
  Por arquitectura empresarial: el navegador nunca reimplementa pesos ni reglas de decisión; toda validación, preprocesamiento e inferencia vive en la API del servidor.
- **¿Por qué usaron VS Code + Express + Google AI Studio / Cloud Run y no Vercel?**  
  Vercel está orientado a hosting estático o funciones serverless separadas del backend; nosotros integramos React + API REST + lectura CSV en un único servidor que funciona 100 % offline desde la carpeta en VS Code y en Docker/Cloud Run. AI Studio solo fue herramienta asistida de desarrollo y auditoría.
- **¿Para qué aplicaron Regresión y Lagrange si ya tienen Random Forest?**  
  Random Forest clasifica compra sí/no (`Revenue`); **Regresión lineal** mide la tendencia continua global (`+37 s/pág` en las `12.205` sesiones con ruido) y **Lagrange (`P₃`)** interpola con error cero por 4 perfiles representativos dentro de `[3,77 ; 84,66]` evitando el fenómeno de Runge.
