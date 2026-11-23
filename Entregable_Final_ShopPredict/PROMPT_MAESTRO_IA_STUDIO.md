# Prompt maestro para Google AI Studio Build

Copia este prompt en Google AI Studio Build y conecta el repositorio
`MiltonMach-25/Proyecto_Mineria_Datos`. Trabaja sobre
`Entregable_Final_ShopPredict/`; no reconstruyas el proyecto desde cero.

---

## PROMPT

Actúa como ingeniero/a senior de frontend y producto de datos. Completa la
interfaz web de **ShopPredict · Intención de Compra** usando los archivos reales
de `Entregable_Final_ShopPredict/`. El objetivo es dejar un dashboard profesional,
usable y preparado para integrarse con el backend FastAPI incluido, sin inventar
resultados ni conexiones.

### Antes de editar

1. Lee `README.md` y `AUDITORIA.md`.
2. Inspecciona `backend/api_shoppredict.py`, `backend/shoppredict_model.py`,
   `backend/requirements.txt`, `dashboard.html`, `index.html`, el CSV y las
   métricas en `assets/evidencias/metricas_modelos.csv`.
3. Trata la auditoría y los resultados guardados como fuente de verdad.
4. Conserva los archivos académicos y las tres diapositivas de métodos
   numéricos. La presentación debe seguir teniendo exactamente 12 diapositivas.

### Arquitectura

- Frontend: genera una interfaz web responsive, en español, que pueda compilarse
  como archivos estáticos e integrarse con el backend Python.
- Backend: conserva FastAPI y scikit-learn como fuente de predicciones. No
  traslades ni reimplementes los modelos en JavaScript.
- API base: usa `VITE_SHOPPREDICT_API_URL` si se crea un frontend Vite; durante
  desarrollo permite configurar la URL local `http://127.0.0.1:8080`. Para
  servir el frontend y la API desde el mismo origen, permite una base vacía.
- Despliegue: prepara el código para que el resultado estático pueda servirse
  junto con FastAPI o desde un origen web separado. Documenta cualquier ajuste
  requerido de `FRONTEND_ORIGINS` en Cloud Run. No afirmes que Cloud Run ya está
  desplegado.
- No incorpores plataformas o servicios externos que no estén configurados y
  probados en el repositorio.

### Funcionalidades requeridas

1. **Dashboard:** consulta `GET /stats` y muestra registros deduplicados,
   compras, tasa de conversión, duración promedio y comparación de modelos.
   Implementa filtros reales por mes y tipo de visitante con los parámetros
   `month` y `visitor_type`; indica que los KPIs se filtran, pero las métricas de
   modelos corresponden al holdout global.
   Construye los gráficos únicamente con respuestas reales de la API o con las
   evidencias versionadas.
2. **Estados de interfaz:** presenta carga, error, respuesta vacía y éxito sin
   sustituir fallos por ceros o datos ficticios. Incluye una acción de reintento.
3. **Predicción individual:** consulta `GET /schema` para construir el formulario.
   Usa `categorical_options` y `numeric_ranges`; envía `model` y `features` a
   `POST /predict`. Presenta la clase, la probabilidad devuelta por la API y su
   nota de uso académico. Valida entradas y muestra errores HTTP de forma clara.
4. **Validación de CSV:** permite enviar un archivo a `POST /dataset/validate`.
   Muestra filas, columnas, duplicados, columnas faltantes, observaciones y el
   indicador `persisted`. Explica que validar no significa importar, guardar ni
   reemplazar el dataset.
5. **Modelos:** presenta como resultados únicamente Árbol de decisión, Random
   Forest y Regresión logística con las métricas de `GET /metrics`. Etiqueta
   claramente que corresponden a una única partición estratificada 80/20 con
   semilla 42.
6. **Métodos no ejecutados:** Naive Bayes, KNN y clustering solo pueden mostrarse
   como métodos pendientes/conceptuales. No les asignes porcentajes, etiquetas
   de clúster, perfiles ni gráficos de resultados sin una ejecución reproducible
   en el backend y actualización de la auditoría.
7. **Diseño:** conserva la identidad ShopPredict y el logotipo local
   `assets/shopredict-logo.png`. Estilo académico, claro, profesional, accesible
   y adaptable a móvil. No incluyas “AI” como parte del nombre de marca.
8. **Presentación:** conserva `index.html`, sus activos locales, navegación y las
   12 diapositivas. No enlaces imágenes externas ni presentes diagramas
   conceptuales como resultados medidos.

### Calidad, seguridad y entrega

- Nunca incluyas claves, tokens ni credenciales en el código o en Git.
- No agregues persistencia, base de datos o servicios externos que no estén
  configurados y probados.
- Mantén el backend Python como autoridad de predicción; evita lógica de ML
  duplicada en frontend.
- Conserva el contrato de endpoints. Si necesitas cambiarlo, actualiza backend,
  frontend, pruebas, README y auditoría conjuntamente.
- Añade pruebas enfocadas para la interfaz o los cambios de API y ejecútalas.
- Comprueba la compilación, navegación, manejo de errores y los endpoints
  locales cuando el entorno lo permita.
- Actualiza el único `README.md` de esta entrega solo con instrucciones
  comprobables. No crees README adicionales.
- Al finalizar, informa qué archivos modificaste, qué pruebas pasaron y qué
  pasos de configuración o despliegue siguen pendientes. Distingue claramente
  entre preparado, probado localmente y desplegado en producción.
