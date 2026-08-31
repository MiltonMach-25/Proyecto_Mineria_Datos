# 🛒 Predicción de Intención de Compra en una Tienda Virtual

Proyecto de Minería de Datos desarrollado por estudiantes de Ingeniería de Sistemas de la Corporación Universitaria Minuto de Dios – UNIMINUTO.

El proyecto busca analizar el comportamiento de los usuarios durante sus sesiones de navegación en una tienda virtual para identificar patrones relacionados con la realización de una compra.

A partir de técnicas de análisis exploratorio de datos y algoritmos de clasificación, se pretende predecir si una sesión de navegación terminará en una compra o no.

## 🎯 Objetivo general

Desarrollar un modelo de minería de datos que permita predecir la intención de compra de los usuarios de una tienda virtual a partir de su comportamiento durante la navegación.

## ❓ Pregunta de investigación

¿Podemos predecir si un usuario realizará una compra utilizando los datos de su comportamiento durante una visita a una tienda virtual?

## 🔎 Objetivos específicos

- Analizar el comportamiento de los usuarios durante las sesiones de navegación.
- Identificar los factores relacionados con la realización de una compra.
- Preparar y limpiar los datos para su análisis.
- Aplicar algoritmos de clasificación utilizando Python.
- Evaluar el rendimiento de los modelos mediante diferentes métricas.
- Utilizar los resultados obtenidos para apoyar la toma de decisiones comerciales.

## 📊 Dataset

El proyecto utiliza el conjunto de datos:

**Online Shoppers Purchasing Intention Dataset**

El archivo utilizado es:

`online_shoppers.csv`

El dataset contiene aproximadamente **1 millón de sesiones simuladas de compra online**. Cada registro representa una sesión de navegación de un usuario e incluye información relacionada con las visitas a páginas, duración de la navegación, fuentes de tráfico, características de los visitantes y métricas de comportamiento.

El conjunto de datos está inspirado en el dataset **Online Shoppers Purchasing Intention** y está orientado al análisis exploratorio, la clasificación binaria, el análisis del comportamiento de los clientes y la predicción de compras.

### 🎯 Variable objetivo

La variable principal del proyecto es:

`Revenue`

Esta variable indica si la sesión terminó en una compra:

- `True` → se realizó una compra.
- `False` → no se realizó una compra.

## 📋 Variables del dataset

Las principales variables disponibles son:

| Variable | Descripción |
|---|---|
| `Administrative` | Número de páginas administrativas visitadas |
| `Administrative_Duration` | Tiempo dedicado a páginas administrativas |
| `Informational` | Número de páginas informativas visitadas |
| `Informational_Duration` | Tiempo dedicado a páginas informativas |
| `ProductRelated` | Número de páginas relacionadas con productos visitadas |
| `ProductRelated_Duration` | Tiempo dedicado a páginas de productos |
| `BounceRates` | Tasa de rebote de la sesión |
| `ExitRates` | Tasa de salida |
| `PageValues` | Valor promedio de las páginas visitadas |
| `SpecialDay` | Cercanía de la visita a una fecha especial |
| `Month` | Mes en el que ocurrió la sesión |
| `OperatingSystems` | Sistema operativo utilizado |
| `Browser` | Navegador utilizado |
| `Region` | Región geográfica del visitante |
| `TrafficType` | Tipo de fuente de tráfico |
| `VisitorType` | Tipo de visitante |
| `Weekend` | Indica si la sesión ocurrió durante un fin de semana |
| `Revenue` | Indica si la sesión terminó en una compra |

## 📈 Análisis propuesto

Durante el desarrollo del proyecto se analizarán diferentes aspectos del comportamiento de los usuarios:

- Relación entre las páginas de productos visitadas y la realización de una compra.
- Relación entre el tiempo de navegación y la compra.
- Comportamiento de las tasas de rebote y salida.
- Diferencias entre visitantes nuevos y recurrentes.
- Comportamiento de las compras según el mes.
- Diferencias entre sesiones realizadas durante días de semana y fines de semana.
- Relación entre las fuentes de tráfico y la realización de compras.
- Identificación de las variables más relacionadas con la intención de compra.

## 🧹 Preparación y limpieza de datos

Antes de realizar el modelado se realizará un proceso de preparación de los datos que incluirá:

- Carga del archivo CSV.
- Revisión de las dimensiones del dataset.
- Identificación de los tipos de datos.
- Detección de valores faltantes.
- Identificación de datos inconsistentes.
- Revisión de posibles valores duplicados.
- Transformación de variables categóricas cuando sea necesario.
- Separación de variables predictoras y variable objetivo.
- División de los datos en conjuntos de entrenamiento y prueba.

## 🤖 Modelado

El problema será abordado como una tarea de **clasificación binaria**, debido a que la variable `Revenue` permite diferenciar entre dos resultados:

- Compra.
- No compra.

Inicialmente se considerarán los siguientes algoritmos:

- Árbol de Decisión.
- Random Forest.
- Regresión Logística.

## 📏 Evaluación

Los modelos serán evaluados mediante diferentes métricas de clasificación:

- Accuracy.
- Precision.
- Recall.
- F1-Score.
- Matriz de confusión.

El objetivo será determinar qué modelo presenta un mejor desempeño para predecir si una sesión de navegación terminará en una compra.

## 💡 Aplicación de los resultados

Los resultados obtenidos podrían utilizarse para apoyar decisiones comerciales, por ejemplo:

- Identificar usuarios con mayor probabilidad de compra.
- Mejorar estrategias de marketing.
- Recomendar productos.
- Diseñar promociones personalizadas.
- Analizar el comportamiento de diferentes tipos de visitantes.
- Optimizar la experiencia de navegación de los usuarios.

## 🛠️ Tecnologías

- Python
- Pandas
- NumPy
- Matplotlib
- Seaborn
- Scikit-learn
- Google Colab / Jupyter Notebook
- Git
- GitHub

## 📁 Estructura del repositorio

```text
Online_Shoppers/
│
├── CSV/
│   └── online_shoppers.zip
│       └── online_shopper.csv
├── README.md

👥 Integrantes

Milton Cesar Machado Barreto – 89326
Raúl Andrés Triana Ortega – 895237
Santiago Molina Maldonado – 903419

👨‍🏫 Docente

Esteban Ernesto Morales Castro

🎓 Información académica

Programa: Ingeniería de Sistemas
Curso: Minería de Datos – NRC: 60-95400
Facultad: Ingeniería
Institución: Corporación Universitaria Minuto de Dios – UNIMINUTO
Ciudad: Ibagué, Tolima
Año: 2026
