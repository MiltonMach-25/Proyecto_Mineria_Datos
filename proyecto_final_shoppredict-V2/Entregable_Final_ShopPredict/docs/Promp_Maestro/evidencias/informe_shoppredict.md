# ShopPredict — Informe de ejecución

Fecha: 2026-10-26 00:19 Hora est. Pacífico, Sudamérica

## Proyecto

Predicción de la intención de compra en una tienda virtual mediante minería de datos y aprendizaje automático.

Pregunta: ¿Podemos predecir si un usuario realizará una compra utilizando los datos de su comportamiento durante una visita a una tienda virtual?

## Datos cargados

- Sesiones: 12,330
- Variables, incluida Revenue: 18
- Compras: 1,908 (15.47%)
- Sin compra: 10,422
- Valores faltantes: 0
- Duplicados exactos: 125
- Revenue se separa como objetivo y Session_ID se excluye de X.

## Metodología

Partición estratificada 80/20 con semilla 42. Los faltantes se imputan dentro de cada pipeline. Las categorías se codifican mediante OneHotEncoder. Regresión Logística usa StandardScaler; Árbol de Decisión y Random Forest no escalan las variables cuantitativas.

- Registros train/test: 9,764 / 2,441
- Duplicados exactos excluidos antes de dividir: 125
- Métricas evaluadas: accuracy, balanced accuracy, precision, recall, F1 y ROC-AUC.

## Resultados de clasificación

| Modelo | Escalamiento | Accuracy | Balanced accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---|---:|---:|---:|---:|---:|---:|
| Árbol de decisión | Sin escalamiento | 0.8574 | 0.7407 | 0.5423 | 0.5707 | 0.5561 | 0.7407 |
| Random Forest | Sin escalamiento | 0.9029 | 0.7548 | 0.7715 | 0.5393 | 0.6348 | 0.9248 |
| Regresión logística | StandardScaler | 0.8873 | 0.6944 | 0.7560 | 0.4136 | 0.5347 | 0.8997 |

Modelo con mayor F1 en esta partición: **Random Forest** (F1 = 0.6348). Este resultado describe únicamente esta evaluación y no demuestra superioridad general.

### Matriz de confusión del modelo con mayor F1

| Real / Predicción | Sin compra | Compra |
|---|---:|---:|
| Sin compra | 1998 | 61 |
| Compra | 176 | 206 |

## Alcance y limitaciones

La fuente de modelado en esta ejecución es el archivo cargado. La base de marketing añadida en el flujo de integración es sintética, por lo que no representa mediciones reales. La evaluación es una demostración académica con una única partición holdout; no constituye una prueba causal ni de producción. Compruebe disponibilidad temporal de las variables antes de plantear predicciones en vivo.

## Equipo académico

Milton Cesar Machado Barreto · Raúl Andrés Triana Ortega · Santiago Molina Maldonado

Ingeniería de Sistemas · Minería de Datos · UNIMINUTO · Ibagué, 2026
