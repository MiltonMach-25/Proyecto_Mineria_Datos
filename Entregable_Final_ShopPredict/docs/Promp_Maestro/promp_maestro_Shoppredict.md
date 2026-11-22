<div align="center">

# ShopPredict AI
### Del comportamiento de navegación a una decisión informada

**PROMPT MAESTRO · PRESENTACIÓN DEL PROYECTO**

Minería de Datos · Python · Tkinter · scikit-learn · FastAPI

</div>

> **Propósito:** preparar una exposición académica clara y visual que presente
> el proyecto, su proceso, la aplicación y los resultados comprobados.<br>
> **Audiencia:** docentes y compañeros que necesitan entender qué resuelve,
> cómo funciona y qué está listo para demostrar.

> **Orden de lectura para esta entrega:** primero el
> [informe EDA actualizado](./Minería%20De%20Datos%20EDA%20%E2%80%93%20Proyecto%20Shoppredict%20-%20Actualizado.md),
> luego este prompt maestro y finalmente sus tres módulos de apoyo.

---

## 01 · Encargo

Actúa como **asesor de presentación académica y comunicación de proyectos de
datos**. Crea una presentación breve, convincente y fiel al repositorio ShopPredict
AI. Usa este prompt como guía principal y los tres subprompts como módulos de
apoyo; integra sus contenidos en una sola historia, sin repetirlos.

### Resultado esperado

- Nueve diapositivas: portada y ocho láminas de contenido, alineadas con el
  PowerPoint incluido.
- Un guion oral natural, con lenguaje claro y términos técnicos explicados.
- El estado real del proyecto, la procedencia de los datos, la GUI, los servicios
  opcionales y los resultados documentados.
- Una demostración que pueda seguirse desde la carpeta `Promp_Maestro` en VS Code.

## 02 · Antes de redactar

1. Revisa el informe actualizado, el `README.md`, las evidencias y el código
   reproducible disponible.
2. Usa los subprompts de [datos y limpieza](./promp_sub_01_datos_y_limpieza.md),
   [transformación y PCA](./promp_sub_02_transformacion_y_pca.md) y
   [aplicación y modelos](./promp_sub_03_aplicacion_y_modelos.md).
3. Distingue entre **implementado**, **documentado** y **por mejorar**. No afirmes
   que algo se ejecutó en vivo si solo existe su código o documentación.
4. Comprueba las cifras en las evidencias antes de incluirlas. Distingue el CSV
   original de los campos sintéticos y respeta las aclaraciones del informe. Si
   un resultado no está disponible, escribe `[dato por verificar]` en lugar de
   inventarlo.

## 03 · Ficha del proyecto

| Elemento | Descripción |
|---|---|
| **Pregunta** | ¿El comportamiento de una sesión de navegación ayuda a estimar si termina en compra? |
| **Objetivo del dataset** | `Revenue`: compra (`True`) o no compra (`False`). |
| **Datos** | Online Shoppers Purchasing Intention, con atributos de navegación y contexto de sesión. |
| **Aplicación** | Interfaz de escritorio en `prototipo_Shoppredict/`, construida con Python/Tkinter para explorar datos, evaluar modelos y exportar evidencias. |
| **Modelos comparados** | Árbol de Decisión, Random Forest y Regresión Logística. |
| **Equipo** | Milton Cesar Machado Barreto · Raúl Andrés Triana Ortega · Santiago Molina Maldonado |

### Procedencia y servicios

- **Kaggle:** distribución del dataset atribuida a Akash Patel:
  [ficha del conjunto](https://www.kaggle.com/datasets/imakash3011/online-shoppers-purchasing-intention-dataset).
- **UCI:** ficha original, conjunto 468, DOI `10.24432/C5F88Q`:
  [Online Shoppers Purchasing Intention](https://archive.ics.uci.edu/dataset/468/online+shoppers+purchasing+intention+dataset).
- El descargador opcional consulta UCI mediante `ucimlrepo`; genera otra copia y
  metadatos, no usa credenciales de Kaggle ni sobrescribe el CSV local.
- La API REST local es un servicio FastAPI independiente de la GUI. No digas que
  la ventana Tkinter la consume.
- El artículo asociado tiene DOI `10.1007/s00521-018-3523-0`. Preséntalo como
  contexto web de la idea, no como evidencia de rendimiento de ShopPredict.

## 04 · Historia de la presentación

| # | Diapositiva | Idea que debe quedar |
|---:|---|---|
| 1 | **Portada y propósito** | Qué es ShopPredict AI, quiénes lo desarrollaron y qué busca estimar. |
| 2 | **Problema y metodología** | Qué pregunta se aborda y cómo se organiza el análisis con CRISP-DM. |
| 3 | **Datos y calidad** | Qué representa `Revenue`, de dónde viene el dataset y qué se verificó. |
| 4 | **Exploración y preparación** | Cómo se explora y organiza la información; identificar los campos sintéticos. |
| 5 | **Transformación y PCA** | Para qué se escala, codifica y reduce dimensionalidad; separar las prácticas. |
| 6 | **Hallazgos EDA** | Mostrar las gráficas reproducibles y distinguir correlación de causalidad. |
| 7 | **Modelos y resultados** | Comparación y métricas del holdout, con sus límites. |
| 8 | **Prototipo y servicios** | Recorrido de la GUI; explicar la API como componente opcional separado. |
| 9 | **Conclusiones y siguientes pasos** | Hallazgos respaldados, limitaciones y una mejora futura viable. |

## 05 · Dirección visual

Diseña la exposición como una **demo de producto de datos**: profesional, limpia y
legible al proyectarla.

- **Composición:** título corto, una conclusión destacada, hasta cuatro viñetas y
  una visualización o diagrama por diapositiva.
- **Jerarquía:** resalta cifras y palabras clave; no pegues párrafos del informe.
- **Gráficas:** prioriza las evidencias existentes en `evidencias/`; el código
  reproducible está en `reproducir_graficos_eda.py`. Añade una frase que indique
  cómo leer cada visual.
- **Diagramas:** usa Mermaid en Markdown para los flujos del proyecto y la
  arquitectura. GitHub renderiza los bloques `mermaid`; conserva también el
  código fuente del diagrama, no solo una captura.
- **Flujo sugerido:** datos → preparación → transformación → modelos → aplicación/API.
- **Código:** como máximo **30–40 líneas en toda la presentación**. Prefiere un
  diagrama de flujo antes que bloques de código extensos.
- **Tono:** seguro y comprensible, sin prometer ventas, causalidad ni rendimiento
  en producción.

### Evidencias visuales disponibles

| Recurso | Uso sugerido |
|---|---|
| `evidencias/01_diagnostico_dataset.png` | Mostrar la exploración inicial. |
| `evidencias/02_comparacion_modelos.png` | Comparar modelos con métricas observadas. |
| `evidencias/03_matriz_confusion_mejor_f1.png` | Explicar aciertos, errores y clases. |
| `evidencias/eda/01_histograma_pagevalues.png` | Mostrar la distribución de PageValues y el porcentaje de ceros reproducido. |
| `evidencias/eda/02_boxplot_product_duration.png` | Comparar la duración por clase Revenue. |
| `evidencias/eda/04_dispersion_bounce_exit.png` | Mostrar la relación entre tasas de rebote y salida. |
| `evidencias/eda/05_heatmap_correlaciones.png` | Resumir correlaciones numéricas del CSV original. |

## 06 · Cifras y límites que deben respetarse

- El CSV original documentado contiene **12.330 filas y 18 columnas**, **0 faltantes**,
  **125 duplicados exactos** y **1.908 compras (15,47 %)**. Identifica estas cifras
  como correspondientes a ese archivo; el usuario puede cargar otro CSV en la GUI.
- No llames a las 12.330 filas “sesiones únicas”: el archivo contiene 125
  duplicados exactos. El informe actualizado contrasta las cifras del Word/PDF
  con el CSV distribuido. Para ese CSV, `PageValues` es cero en 77,86 % de las
  filas, la tasa de compra entre valores positivos es 56,34 % y la correlación
  `BounceRates`–`ExitRates` es 0,913.
- La integración de demostración documentada contiene **12.205 filas y 23 columnas**.
  Sus campos de marketing se generan sintéticamente; no representan campañas ni
  clientes reales, y no participan en la evaluación actual de la GUI.
- No presentes las tasas de `Canal_Origen` del Word/PDF como resultados reales:
  esa columna no existe en el CSV incluido. El script EDA omite esa figura si no
  recibe un CSV que la contenga y la identifica como sintética cuando sí existe.
- Verifica que `PageValues` esté disponible en el instante de predicción antes
  de describirlo como señal para una decisión en tiempo real.
- En la corrida guardada, se excluyeron 125 duplicados y se evaluó un holdout
  estratificado 80/20 con semilla 42 (**9.764 train / 2.441 test**).
- Random Forest obtuvo en esa corrida **F1 0,6348**, **accuracy 0,9029**,
  **balanced accuracy 0,7548** y **ROC-AUC 0,9248**. Llámalo el de mayor F1 de
  esa partición; no lo presentes como ganador universal ni como resultado futuro.
- Las prácticas de escalamiento y PCA usan conjuntos de entrada distintos. Sus
  resultados son independientes y no deben combinarse.
- La API REST entrena con las filas etiquetadas disponibles para demostrar
  inferencia; esas predicciones **no son una evaluación independiente**.
- La GUI usa por defecto el CSV original, conserva la apariencia del prototipo y
  funciona localmente. La descarga UCI requiere Internet; la demostración puede
  usar el CSV incluido sin conexión.

## 07 · Guion de cada diapositiva

Para **cada una de las nueve diapositivas**, entrega:

1. **Título** y mensaje principal en una frase.
2. **2–4 viñetas** cortas; una cifra importante, si existe.
3. **Propuesta visual** (captura, gráfica, esquema o diagrama) y qué debe observarse.
4. **Guion oral de 2–3 frases**, natural y no redundante con el texto visible.

Abre con una introducción oral de aproximadamente 30 segundos. Cierra con una
conclusión breve y **tres preguntas posibles del público, con respuestas concisas**.

## 08 · Demostración en VS Code

Incluye una secuencia breve y verificable desde la carpeta del paquete:

1. Abrir `Promp_Maestro` y mostrar el README y el informe actualizado.
2. Abrir `prototipo_Shoppredict` y ejecutar `iniciar_app.bat`.
3. Si hay tiempo, ejecutar `iniciar_api.bat` en otra terminal y abrir
   `http://127.0.0.1:8000/docs`.
4. Presentar `descargar_dataset_uci.bat` como consulta opcional; requiere Internet.

La aplicación, la API, sus dependencias y el CSV local están juntos en
`prototipo_Shoppredict`; no se requiere descargar datos para iniciar la GUI.

La GUI, la API REST y el descargador UCI son componentes separados. No simules una
consulta en vivo ni dependas de Internet para mostrar la aplicación.

## 09 · Lista de control final

- [ ] El hilo narrativo va del problema a los datos, el proceso, la aplicación y la conclusión.
- [ ] Los tres integrantes aparecen en portada o créditos.
- [ ] Kaggle y UCI están diferenciados y enlazados.
- [ ] Cada cifra indica archivo, corrida o práctica a la que corresponde.
- [ ] Marketing sintético, GUI y API están claramente diferenciados.
- [ ] Las gráficas tienen título y lectura; no se muestran sin contexto.
- [ ] El contenido cabe en ocho diapositivas y el código no supera 30–40 líneas.
- [ ] No se trasladan a ShopPredict datos ni requisitos del caso StreamAndes de Sesión 6.

---

<div align="center">

**Presentar con evidencia. Explicar con claridad. Reconocer los límites.**

</div>
