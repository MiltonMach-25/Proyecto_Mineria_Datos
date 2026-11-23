# Escalamiento del Proyecto de Minería de Datos

Esta etapa práctica aplica el bloque de **escalamiento de la Sesión 4** al dataset real de Online Shoppers integrado con la fuente de marketing. Compara `MinMaxScaler`, `StandardScaler` y `RobustScaler`, genera matrices listas para modelado y muestra por qué es necesario escalar antes de trabajar con distancias o PCA.

## Ejecución rápida

Requisito: haber generado `dataset_limpio_cruce_marketing.csv` ejecutando antes el proceso de limpieza e integración desde la raíz del proyecto.

En PowerShell, desde la raíz `ProyectoMineriaDeDatos`:

```powershell
python .\Escalamiento_Proyecto\escalamiento_proyecto.py
```

También se puede ejecutar desde esta carpeta:

```powershell
python .\escalamiento_proyecto.py
```

Las dos formas usan automáticamente el CSV limpio que está en la raíz del proyecto y guardan las salidas en `Escalamiento_Proyecto/resultados/`.

Si Python indica que falta una librería, instala los requisitos en el mismo intérprete que ejecuta el script:

```powershell
python -m pip install pandas numpy scikit-learn joblib
```

En VS Code, verifica que el intérprete seleccionado y el que usas en la terminal sean el mismo.

Se puede cambiar la entrada, carpeta de resultados, proporción de prueba y semilla:

```powershell
python .\Escalamiento_Proyecto\escalamiento_proyecto.py `
  --input .\dataset_limpio_cruce_marketing.csv `
  --output-dir .\Escalamiento_Proyecto\resultados `
  --test-size 0.20 `
  --random-state 42
```

## Qué aplica y por qué

Las decisiones siguen la Sesión 4 y respetan el significado de las columnas del proyecto:

| Grupo de columnas | Tratamiento | Justificación |
|---|---|---|
| Métricas cuantitativas y conteos | Se comparan MinMax, Standard y Robust | Tienen rangos/unidades distintos y afectan distancias euclídeas. |
| `Month`, `VisitorType`, `Canal_Origen`, `Nivel_Fidelidad` | One-hot | Son categorías nominales; no se les inventa una jerarquía. |
| `OperatingSystems`, `Browser`, `Region`, `TrafficType` | One-hot, aunque el CSV las guarde como enteros | Son códigos de categoría, no cantidades; escalar `Region=8` como si fuera el doble de `Region=4` sería incorrecto. |
| `Weekend`, `Cupon_Aplicado` | Se conservan como 0/1 | Ya tienen escala binaria interpretable; estandarizarlas no aporta y dificulta leerlas. |
| `Session_ID` | Se excluye de `X` y se guarda en archivos de referencia | Es un identificador, no una señal predictiva. |
| `Revenue` | Se mantiene separado como `y` | Es la respuesta que se desea predecir; incluirla en `X` causaría fuga de información. |

### Los tres escaladores

- **MinMaxScaler:** transforma cada variable cuantitativa al rango `[0, 1]`. Es sensible a valores extremos porque usa mínimo y máximo.
- **StandardScaler:** centra en media 0 y escala a desviación estándar 1. Es la opción general de esta práctica y la usada antes de PCA. Una variable constante queda con desviación 0 después de transformar, porque no contiene variación.
- **RobustScaler:** centra en la mediana y escala por el rango intercuartílico (IQR). Resulta menos influido por valores extremos que MinMax o Standard.

La comparación no elimina ni recorta valores extremos: compara transformaciones diferentes de las mismas variables y del mismo conjunto de entrenamiento.

## Flujo del proceso

1. Carga y valida el dataset limpio e integrado.
2. Separa `X` (predictores) e `y = Revenue`.
3. Crea particiones estratificadas de entrenamiento y prueba, reproducibles con semilla 42.
4. Ajusta cada escalador y el codificador one-hot solo con `train`; transforma `test` con esos parámetros ya aprendidos.
5. Compara distancias euclídeas de dos registros de entrenamiento antes y después del escalamiento.
6. Aplica PCA a las variables cuantitativas estandarizadas; PCA también se ajusta únicamente con `train`.
7. Guarda matrices, métricas, referencias de filas, reporte y transformadores reutilizables.

Este orden evita que la información de `test` influya en el escalado, la codificación o la reducción dimensional.

## Resultados de la ejecución validada

Con el archivo actual:

- Entrada: `12.205` filas y `23` columnas.
- División estratificada: `9.764` filas de entrenamiento y `2.441` de prueba.
- Matriz de modelado: `84` características después de escalar, codificar y conservar las banderas binarias.
- Distancia entre los mismos dos registros cuantitativos: `299,2105` sin escalar, `0,9171` con MinMax, `3,7288` con Standard y `3,2683` con Robust.
- PCA parte de `11` variables cuantitativas estandarizadas: `5` componentes alcanzan al menos 80% de varianza y `6` alcanzan al menos 90%.

Las distancias de las distintas escalas no se comparan como si fueran unidades equivalentes; su propósito es evidenciar cuánto cambia la influencia relativa de las variables. Consulta los valores detallados de esta ejecución en `resultados/reporte_escalamiento.json`.

## Archivos generados

| Archivo | Contenido |
|---|---|
| `X_minmax_train.csv`, `X_minmax_test.csv` | Predictores con variables cuantitativas en `[0, 1]`. |
| `X_standard_train.csv`, `X_standard_test.csv` | Predictores con variables cuantitativas estandarizadas. |
| `X_robust_train.csv`, `X_robust_test.csv` | Predictores con escalamiento basado en mediana e IQR. |
| `y_train.csv`, `y_test.csv` | Objetivo `Revenue` alineado por orden con la matriz de su partición. |
| `referencias_train.csv`, `referencias_test.csv` | `Session_ID` para rastrear las filas, separado de `X`. |
| `comparacion_escaladores.csv` | Indicadores resumen de cada escalador sobre el entrenamiento. |
| `resumen_escaladores_por_variable.csv` | Media, desviación, mediana, mínimo y máximo transformados por variable. |
| `diagnostico_aportes_distancia.csv` | Aportes cuantitativos a la distancia cruda y diferencias transformadas. |
| `X_pca_train.csv`, `X_pca_test.csv` | Variables cuantitativas reducidas con PCA tras StandardScaler. |
| `pca_varianza.csv` | Varianza explicada y acumulada por componente. |
| `preprocesador_*.joblib` | Escalador y codificador ajustados, reutilizables para datos nuevos. |
| `pca_standard.joblib` | PCA ajustado sobre cuantitativas estandarizadas de train. |
| `reporte_escalamiento.json` | Parámetros, columnas, tamaños, distancias y decisiones de la corrida. |

Los archivos se regeneran al ejecutar el programa y no reemplazan el CSV original.

## Reutilizar el preprocesador

Para transformar registros nuevos debe cargarse el preprocesador correspondiente y pasarle un `DataFrame` con las mismas columnas predictoras de entrada (`FEATURE_COLUMNS` en el script). Las nuevas categorías se toleran mediante `handle_unknown="ignore"`.

```python
import joblib
import pandas as pd

preprocesador = joblib.load("Escalamiento_Proyecto/resultados/preprocesador_standard.joblib")
X_nuevo = pd.read_csv("nuevos_registros.csv")
matriz_nueva = preprocesador.transform(X_nuevo)
```

No se vuelve a llamar a `fit` con datos nuevos; se reutilizan los parámetros aprendidos con entrenamiento.

## Relación con la Sesión 4 y el proyecto

Este directorio profundiza en la comparación y aplicación del **escalamiento**. La etapa general de transformación y reducción ya documentada en `sesion4_transformacion_reduccion/` incluye codificación, discretización y PCA. Aquí PCA se vuelve a mostrar específicamente como demostración de que primero se estandarizan las variables cuantitativas, sin repetir la discretización.

Orden recomendado del proyecto:

1. `proceso_extraccion_limpieza.py` genera el dataset limpio integrado.
2. `Escalamiento_Proyecto/escalamiento_proyecto.py` compara escaladores y prepara matrices de train/test.
3. `sesion4_transformacion_reduccion/transformar_datos_sesion4.py` presenta el flujo integral de transformación y reducción de la Sesión 4.

La matriz `X_standard_train.csv` es una base adecuada para algoritmos sensibles a distancias. Para entrenar y evaluar, utiliza siempre `X_*_train.csv` con `y_train.csv` y `X_*_test.csv` con `y_test.csv`; no entrenes con el archivo de prueba.
