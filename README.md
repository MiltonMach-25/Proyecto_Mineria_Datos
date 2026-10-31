# ShopPredict AI — Predicción de intención de compra

## Proyecto académico de Minería de Datos

## Información general

## Integrantes del equipo

**Milton Cesar Machado Barreto**  
**Raúl Andrés Triana Ortega**  
**Santiago Molina Maldonado**

**Programa:** Ingeniería de Sistemas  
**Curso:** Minería de Datos 
**Facultad de Ingeniería**  
**Corporación Universitaria Minuto de Dios – UNIMINUTO**  
**Vicerrectoría Regional Centro Sur**  
 
**Año:** 2026

---

## Descripción del proyecto

Este proyecto estudia si el comportamiento de navegación de una sesión permite
predecir si se realizará una compra. Sobre el dataset Online Shoppers
Purchasing Intention se documentan exploración, limpieza, transformación,
escalamiento, reducción con PCA y comparación de modelos de clasificación. Una
etapa separada agrega una fuente de marketing sintética para practicar la
integración de datos; esa información simulada no se presenta como evidencia
real ni se usa en la evaluación que ejecuta la aplicación.

El proyecto busca:

- cargar y revisar la base de datos,
- validar la estructura del dataset,
- limpiar registros duplicados y anomalías,
- generar identificadores por sesión,
- cruzar información de navegación con datos de marketing,
- preparar una base unificada para análisis posterior.

## Segunda entrega: ShopPredict

El paquete de la sustentación está organizado en
[`Promp_Maestro/`](./Promp_Maestro/). Abre primero la
[guía del paquete](./Promp_Maestro/README.md) y el
[informe EDA actualizado](./Promp_Maestro/Miner%C3%ADa%20De%20Datos%20EDA%20%E2%80%93%20Proyecto%20Shoppredict%20-%20Actualizado.md).
También se incluyen el informe [Word](./Promp_Maestro/Miner%C3%ADa%20De%20Datos%20EDA%20%E2%80%93%20Proyecto%20Shoppredict%20-%20Actualizado.docx),
[PDF](./Promp_Maestro/Miner%C3%ADa%20De%20Datos%20EDA%20%E2%80%93%20Proyecto%20Shoppredict%20-%20Actualizado.pdf),
la [presentación PowerPoint](./Promp_Maestro/ShopPredict%20Intenci%C3%B3n%20de%20Compra.pptx)
y los prompts de apoyo. El informe y la guía incluyen diagramas Mermaid para
visualización directa en GitHub.

La aplicación ejecutable, sus dependencias y su copia local del dataset están
reunidas en `Promp_Maestro\prototipo_Shoppredict`. Desde la raíz del repositorio:

```powershell
python -m pip install -r .\Promp_Maestro\prototipo_Shoppredict\requirements.txt
python .\Promp_Maestro\prototipo_Shoppredict\app_shoppredict_gui.py
```

El código que reproduce las figuras EDA está en
[`reproducir_graficos_eda.py`](./Promp_Maestro/reproducir_graficos_eda.py).

---

## Objetivo del trabajo

Desarrollar un proceso de minería y preparación de datos que permita:

1. Comprender la estructura del dataset.
2. Identificar inconsistencias o valores atípicos.
3. Realizar un cruce de información entre variables de navegación y marketing.
4. Generar una versión limpia y usable para análisis exploratorio y modelado.

---

## Dataset utilizado

El proyecto usa el archivo:

- `online_shoppers_intention.csv`

Este conjunto de datos contiene información de usuarios que navegan en una tienda en línea, con indicadores de comportamiento y si finalmente realizaron una compra.

---

## Estructura del proyecto

```text
ProyectoMineriaDeDatos/
├── 01_preparacion_y_cruce_de_datos.py   # Preparación del dataset y cruce con base de marketing
├── proceso_extraccion_limpieza.py       # Pipeline de limpieza, validación y exportación
├── proyecto.py                          # Exploración inicial del dataset
├── online_shoppers_intention.csv        # Base de datos principal del proyecto
├── dataset_limpio_cruce_marketing.csv   # Archivo generado por el proceso de limpieza
├── Promp_Maestro/
│   ├── evidencias/                       # Informe, métricas, matriz y gráficas
│   ├── prototipo_Shoppredict/            # Aplicación autocontenida para la demo
│   │   ├── app_shoppredict_gui.py        # Interfaz gráfica
│   │   ├── shoppredict_model.py          # Preprocesamiento y modelos
│   │   ├── api_shoppredict.py            # API REST local opcional
│   │   ├── descargar_dataset_uci.py      # Descarga opcional desde UCI
│   │   ├── descargar_dataset_uci.bat
│   │   ├── online_shoppers_intention.csv # Dataset local del prototipo
│   │   ├── iniciar_app.bat
│   │   ├── iniciar_api.bat
│   │   └── requirements.txt
│   ├── reproducir_graficos_eda.py        # Código fuente de las figuras del informe
│   ├── evidencias/eda/                   # Gráficas EDA reproducibles
│   ├── Minería De Datos EDA – Proyecto Shoppredict - Actualizado.md
│   ├── Minería De Datos EDA – Proyecto Shoppredict - Actualizado.docx
│   ├── Minería De Datos EDA – Proyecto Shoppredict - Actualizado.pdf
│   ├── ShopPredict Intención de Compra.pptx
│   ├── README.md                         # Guía y portada del paquete
│   └── promp_*.md                       # Prompt maestro y módulos de exposición
├── capturas_shoppredict/                # Informe, métricas y gráficas para exposición
├── Escalamiento_Proyecto/               # Práctica de escalamiento y matrices train/test
│   ├── escalamiento_proyecto.py
│   ├── README.md
│   └── resultados/
├── sesion4_transformacion_reduccion/    # Transformación, discretización y PCA
│   ├── transformar_datos_sesion4.py
│   ├── README.md
│   └── resultados/                       # Matrices generadas para modelar
├── README.md                            # Documentación del proyecto
└── .git/                                # Git del repositorio
```

---

## Descripción de archivos

### 1. `proyecto.py`
Este archivo funciona como una primera exploración del dataset. Se encarga de:

- cargar el CSV,
- verificar que existan columnas importantes,
- mostrar los primeros registros,
- mostrar el tamaño del dataset,
- mostrar la estructura y tipos de datos.

Se usa como punto de partida para conocer la base antes de limpiar o transformar datos.

### 2. `01_preparacion_y_cruce_de_datos.py`
Este archivo realiza la preparación del dataset y el cruce con una base artificial de marketing.

Incluye:

- lectura del dataset local,
- generación de identificadores de sesión,
- creación de una tabla de marketing con canal, cupón, nivel de fidelidad y gasto histórico,
- unión de ambas fuentes por `Session_ID`,
- impresión de resultados del cruce.

### 3. `proceso_extraccion_limpieza.py`
Es el flujo principal de extracción y limpieza.

Realiza:

- carga del CSV,
- eliminación de duplicados,
- generación de `Session_ID`,
- normalización de columnas de texto,
- validación de rangos de datos,
- tratamiento de outliers con IQR,
- cruce con la tabla de marketing,
- exportación del resultado final en un CSV limpio.

---

## Requisitos

Desde la raíz, instala las dependencias del prototipo con el mismo intérprete de Python que usarás para ejecutarlo:

```powershell
python -m pip install -r .\Promp_Maestro\prototipo_Shoppredict\requirements.txt
```

---

## Cómo ejecutar el proyecto

Desde la carpeta del proyecto, puedes correr cada script con:

```bash
python proyecto.py
```

```bash
python 01_preparacion_y_cruce_de_datos.py
```

```bash
python proceso_extraccion_limpieza.py
```

### Aplicación de demostración ShopPredict AI

Desde la raíz del repositorio, ejecuta:

```bash
python .\Promp_Maestro\prototipo_Shoppredict\app_shoppredict_gui.py
```

También puedes entrar a `Promp_Maestro\prototipo_Shoppredict` y abrir `iniciar_app.bat`. La interfaz
conserva el tema oscuro del prototipo y carga por defecto
`online_shoppers_intention.csv` desde esa misma carpeta. También incorpora pestañas de
resumen del proyecto, diagnóstico del dataset, metodología, comparación de
modelos y bitácora. Si el CSV incluido está junto a la aplicación, se carga
automáticamente al iniciar; el botón **Cargar dataset** permite elegir otro CSV
con la columna `Revenue`.

La pestaña **Datos y EDA** muestra filas, columnas, tipos, faltantes, duplicados,
distribución de compras y tasas de compra por una categoría disponible. El botón
**Entrenar y evaluar** ejecuta Árbol de Decisión, Random Forest y Regresión
Logística con partición estratificada 80/20 y semilla 42. Los pipelines imputan
faltantes dentro del entrenamiento, excluyen duplicados exactos antes de la
partición, codifican categorías con OneHotEncoder y aplican StandardScaler solo
a Regresión Logística; `Session_ID` se excluye y `Revenue` se mantiene como
objetivo. Se presentan accuracy, balanced accuracy, precision, recall, F1,
ROC-AUC y una matriz de confusión.

**Guardar informe** produce un resumen Markdown de los datos cargados y, si se
entrenaron los modelos, sus métricas y matriz de confusión. **Exportar
evidencias** guarda tres gráficos PNG, `metricas_modelos.csv` y
`matriz_confusion_mejor_f1.csv` en la carpeta elegida. Las métricas describen
una única partición holdout; no demuestran desempeño en producción.

### Fuentes web y descarga mediante API

El dataset **Online Shoppers Purchasing Intention** está distribuido en Kaggle
por Akash Patel:

- [Copia en Kaggle](https://www.kaggle.com/datasets/imakash3011/online-shoppers-purchasing-intention-dataset)
- [Ficha original en UCI, ID 468](https://archive.ics.uci.edu/dataset/468/online+shoppers+purchasing+intention+dataset)
- DOI de UCI: `10.24432/C5F88Q`
- Artículo asociado: Sakar et al., *Real-time prediction of online shoppers’ purchasing intention using multilayer perceptron and LSTM recurrent neural networks*, DOI `10.1007/s00521-018-3523-0`. Es contexto bibliográfico, no resultado de los modelos de este proyecto.

Para acreditar la procedencia y refrescar una copia desde el repositorio original
se puede usar la API de UCI con `ucimlrepo`. Esta operación necesita Internet,
pero no una credencial de Kaggle. Guarda una copia aparte y no modifica el CSV
principal:

```powershell
python .\Promp_Maestro\prototipo_Shoppredict\descargar_dataset_uci.py
```
O ejecuta `.\Promp_Maestro\prototipo_Shoppredict\descargar_dataset_uci.bat`.

En la validación de este repositorio, el CSV local y la descarga UCI coincidieron
en forma, nombres de columna y todos los valores. La afirmación aplica a esas
versiones contrastadas, no garantiza que cualquier copia futura de Kaggle o UCI
permanezca idéntica.

Se crean `online_shoppers_intention_uci.csv` y
`online_shoppers_intention_uci.metadata.json`, que registra origen, DOI, fecha
de consulta y dimensiones. Para guardar en otra ubicación:

```powershell
python .\Promp_Maestro\prototipo_Shoppredict\descargar_dataset_uci.py --output .\Promp_Maestro\prototipo_Shoppredict\descargas\online_shoppers_uci.csv
```

El descargador se conecta en vivo al repositorio UCI; la aplicación de escritorio
continúa funcionando sin Internet con el CSV local. La copia de Kaggle se cita
como fuente de distribución del archivo del proyecto; el descargador no usa la
API de Kaggle ni requiere sus tokens.

### API REST local de predicción

La API FastAPI es un servicio separado y opcional. Conserva intacta la apariencia
de la GUI (prototipo visual de segunda fase) y permite que otra aplicación
consulte una predicción. Las APIs son una extensión funcional separada, sin
botones ni cambios de diseño en la captura. Inicia el servicio desde la raíz:

```powershell
.\Promp_Maestro\prototipo_Shoppredict\iniciar_api.bat
```

Abre `http://127.0.0.1:8000/docs` para probar los endpoints interactivos:

- `GET /health`: estado del servicio.
- `GET /metadata`: archivo y filas usados, objetivo y referencias de origen.
- `GET /schema`: nombres de variables requeridas y modelos disponibles.
- `POST /predict`: predicción de compra/sin compra y probabilidad estimada.

Ejemplo de cuerpo para `POST /predict` (omitir `Revenue`, que es el objetivo):

```json
{
  "model": "Random Forest",
  "features": {
    "Administrative": 0, "Administrative_Duration": 0,
    "Informational": 0, "Informational_Duration": 0,
    "ProductRelated": 1, "ProductRelated_Duration": 0,
    "BounceRates": 0.2, "ExitRates": 0.2, "PageValues": 0,
    "SpecialDay": 0, "Month": "Feb", "OperatingSystems": 1,
    "Browser": 1, "Region": 1, "TrafficType": 1,
    "VisitorType": "Returning_Visitor", "Weekend": false
  }
}
```

La API local entrena los tres pipelines con las filas etiquetadas del archivo al
iniciarse; ese entrenamiento es para demostrar inferencia, no una segunda
evaluación ni una validación independiente. La puntuación del proyecto se debe
tomar de la GUI y su partición estratificada 80/20. Para usar otra fuente, define
`SHOPPREDICT_DATASET` con la ruta del CSV antes de iniciar Uvicorn. El servicio
se enlaza a `127.0.0.1` para uso local de demostración.

Por ejemplo, para que el servicio use el CSV recién descargado, en PowerShell
define `$env:SHOPPREDICT_DATASET = '.\online_shoppers_intention_uci.csv'` antes
de ejecutar `.\Promp_Maestro\prototipo_Shoppredict\iniciar_api.bat`.

## Paquete para presentar o comprimir

La carpeta `Promp_Maestro` reúne el informe, las visualizaciones reproducibles,
la presentación, los prompts y las evidencias. La aplicación, sus dependencias
y el dataset local están organizados en `prototipo_Shoppredict`. Las
instrucciones de instalación, inicio de la interfaz y API, equipo y contenido
están en [`Promp_Maestro/README.md`](./Promp_Maestro/README.md). El informe
actualizado, con diagramas Mermaid renderizados por GitHub, está en
[`Promp_Maestro/Minería De Datos EDA – Proyecto Shoppredict - Actualizado.md`](./Promp_Maestro/Miner%C3%ADa%20De%20Datos%20EDA%20%E2%80%93%20Proyecto%20Shoppredict%20-%20Actualizado.md).
No se genera el
ZIP automáticamente: cuando quieras entregarlo, comprime la carpeta completa
`Promp_Maestro` desde el Explorador de archivos.

### Datos verificados y alcance

La inspección de `online_shoppers_intention.csv` en el entorno de desarrollo
encontró **12.330 filas, 18 columnas, cero valores faltantes, 125 duplicados
exactos y 1.908 compras (15,47%)**. El archivo integrado disponible tiene
**12.205 filas y 23 columnas**, sin faltantes ni duplicados exactos. La fuente
adicional de marketing (`Canal_Origen`, `Cupon_Aplicado`, `Nivel_Fidelidad` y
`Gasto_Historico_USD`) se genera aleatoriamente con una semilla fija: es
sintética, no representa observaciones reales de clientes ni evidencia de
campañas reales.

La aplicación de modelado carga por defecto el CSV original de 18 columnas y no
usa las variables de marketing sintéticas. Los scripts de escalamiento y
transformación utilizan el CSV integrado para demostrar preparación,
codificación, discretización y PCA. Esta distinción evita presentar información
simulada como resultados medidos del negocio.

### Sesión 4: transformación y reducción

Después de generar `dataset_limpio_cruce_marketing.csv`, ejecuta:

```bash
python sesion4_transformacion_reduccion/transformar_datos_sesion4.py
```

Esta etapa compara escaladores, aplica one-hot a las variables categóricas,
discretiza `Gasto_Historico_USD`, separa `Revenue` como objetivo y genera una
versión reducida con PCA. La documentación detallada está en
[`sesion4_transformacion_reduccion/README.md`](sesion4_transformacion_reduccion/README.md).

### Práctica: escalamiento del proyecto

Para comparar `MinMaxScaler`, `StandardScaler` y `RobustScaler` sobre el dataset
limpio, y generar matrices de entrenamiento/prueba sin fuga de información:

```bash
python Escalamiento_Proyecto/escalamiento_proyecto.py
```

La práctica escala variables cuantitativas, codifica las categorías nominales,
conserva las banderas binarias, separa `Revenue` y demuestra PCA después de
`StandardScaler`. Su guía de ejecución y decisiones está en
[`Escalamiento_Proyecto/README.md`](Escalamiento_Proyecto/README.md).

> La ejecución de la versión corregida de `01_preparacion_y_cruce_de_datos.py` usa el archivo local del proyecto para evitar errores por URL no disponible.

---

## Resultado esperado

La ejecución correcta del proyecto permite obtener:

- análisis inicial del dataset,
- limpieza de registros duplicados,
- validación de variables relevantes,
- unión con información de marketing,
- archivo final de datos procesados y listos para análisis,
- matrices de características transformadas y reducidas para las siguientes sesiones,
- matrices comparativas de escalamiento con `X` e `y` separados.

---

## Observaciones importantes

El proyecto evidencia la aplicación de procesos de minería de datos básicos, especialmente en etapas de:

- preparación de datos,
- limpieza,
- integración de fuentes,
- tratamiento de valores atípicos,
- transformación para análisis posterior.

---

## Conclusión

El repositorio reúne un flujo académico de inspección y limpieza, una
integración demostrativa con datos de marketing sintéticos, prácticas de
escalamiento y PCA, y una aplicación que compara tres clasificadores sobre el
dataset original sin duplicados exactos. La evaluación es un holdout
reproducible y no equivale a validación externa, causalidad ni despliegue
comercial. Cualquier conclusión sobre impacto en ventas requiere evidencia
adicional y datos de marketing observados.

---

## Autoría

Proyecto académico desarrollado por:

- Milton Cesar Machado Barreto
- Raúl Andrés Triana Ortega
- Santiago Molina Maldonado

Docente:

- Esteban Ernesto Morales Castro

---

## Licencia

Este proyecto fue desarrollado con fines académicos dentro del curso de Minería de Datos.
