# Sesión 4 · Transformación y Reducción de Datos

Esta carpeta incorpora al proyecto `ProyectoMineriaDeDatos` la dinámica de la Sesión 4 de `mineria_de_datos`:

- comparación de escalas y distancias;
- `MinMaxScaler`, `StandardScaler` y `RobustScaler`;
- codificación one-hot de variables categóricas;
- discretización por cuantiles con `KBinsDiscretizer`;
- reducción de dimensionalidad con PCA;
- construcción de matrices `X` e `y` listas para las siguientes sesiones.

La implementación usa el archivo limpio y cruzado generado por la etapa anterior:

```text
dataset_limpio_cruce_marketing.csv
```

## 1. Requisitos

Python 3.10 o superior y estas librerías:

```bash
pip install pandas numpy scikit-learn
```

En el entorno validado del proyecto se ejecutó con `scikit-learn 1.7.2`.

## 2. Ejecución

Desde la raíz `ProyectoMineriaDeDatos`:

```bash
python sesion4_transformacion_reduccion/transformar_datos_sesion4.py
```

También se puede indicar otro CSV o carpeta de salida:

```bash
python sesion4_transformacion_reduccion/transformar_datos_sesion4.py \
  --input dataset_limpio_cruce_marketing.csv \
  --output-dir sesion4_transformacion_reduccion/resultados
```

El programa crea automáticamente la carpeta `resultados/`. La semilla `42` y la división 80/20 son reproducibles; pueden cambiarse con `--random-state` y `--test-size`.

## 3. Adaptación al dataset del proyecto

La presentación usa un dataset de telecomunicaciones con `edad`, `tipo_plan` y `pago_automatico`. Esas columnas no existen en Online Shoppers Intention, así que se aplicó la misma técnica a variables equivalentes y disponibles, sin inventar datos:

| Parte de la sesión | Aplicación en este proyecto |
|---|---|
| Variables numéricas | Métricas de navegación, tasas, `PageValues` y `Gasto_Historico_USD` |
| Variables categóricas | `Month`, `VisitorType`, `Canal_Origen` y `Nivel_Fidelidad` |
| Variables binarias | `Weekend` y `Cupon_Aplicado`, codificadas como categorías 0/1 |
| Discretización | `Gasto_Historico_USD` en cuatro rangos: Bajo, Medio-bajo, Medio-alto y Alto |
| Variable objetivo | `Revenue`, guardada aparte en `y_revenue.csv` |
| Identificador excluido | `Session_ID`, porque identifica el registro y no es una característica predictiva |

`Revenue` nunca entra en `X`; incluirla produciría fuga de información hacia cualquier modelo posterior.

## 4. Flujo aplicado

```text
CSV limpio y cruzado
        |
        +--> división estratificada train/test
        |
        +--> diagnóstico de distancia sin escalar vs. MinMax
        |
        +--> comparación MinMax / Standard / Robust
        |
        +--> StandardScaler para numéricas + OneHotEncoder para categóricas
        |          |
        |          +--> X_transformada.csv
        |          +--> X_train_transformada.csv
        |          +--> X_test_transformada.csv
        |
        +--> KBinsDiscretizer sobre Gasto_Historico_USD
        |
        +--> StandardScaler + PCA sobre numéricas
                   |
                   +--> X_pca.csv
                   +--> pca_varianza.csv
```

Los transformadores se ajustan exclusivamente con `train` y después se aplican a `test` y al conjunto completo. Esto evita que los valores del conjunto de prueba influyan en los parámetros de transformación.

## 5. Resultados validados

Con el archivo actual de `dataset_limpio_cruce_marketing.csv`:

- Entrada: `12.205` filas y `23` columnas.
- División: `9.764` filas de entrenamiento y `2.441` de prueba.
- Matriz final: `X_transformada.csv` con `12.205` filas y `41` predictores numéricos.
- Objetivo: `y_revenue.csv` con `12.205` valores binarios.
- Discretización: cuatro rangos aproximadamente balanceados de gasto histórico.
- PCA: `8` componentes conservan al menos 80% de la varianza y `10` conservan al menos 90%.
- `X_pca.csv`: `12.205` filas y `10` componentes.

El resultado de PCA debe interpretarse con cuidado: sus columnas (`PC1`, `PC2`, etc.) son combinaciones de variables originales, por lo que reducen dimensiones a costa de perder interpretabilidad directa.

## 6. Archivos generados

| Archivo | Propósito |
|---|---|
| `X_transformada.csv` | Matriz completa para modelado, con numéricas estandarizadas y one-hot |
| `X_train_transformada.csv` | Predictores de entrenamiento |
| `X_test_transformada.csv` | Predictores de prueba |
| `X_transformada_con_discretizacion.csv` | Matriz anterior más el rango legible del gasto |
| `y_revenue.csv` | Variable objetivo separada |
| `discretizacion_gasto.csv` | Rango de gasto asignado a cada fila |
| `comparacion_escaladores.csv` | Métricas de MinMax, Standard y Robust |
| `pca_varianza.csv` | Varianza explicada y acumulada por componente |
| `X_pca.csv` | Representación reducida mediante PCA |
| `reporte_transformacion.json` | Parámetros, decisiones y resumen reproducible |

Los CSV de resultados se regeneran al ejecutar el script y no modifican el dataset original.

## 7. Decisiones técnicas

- **StandardScaler** es la matriz principal porque las variables numéricas tienen unidades y rangos muy diferentes; también es el escalado recomendado antes de PCA.
- **MinMaxScaler** se conserva como comparación para observar el efecto de llevar cada variable a `[0, 1]`.
- **RobustScaler** se compara porque las duraciones, valores de página y gasto pueden contener valores extremos reales.
- **One-hot** evita inventar órdenes entre meses, canales, tipos de visitante o niveles de fidelidad.
- **Discretización por cuantiles** transforma el gasto en segmentos de negocio balanceados; se conserva como variable adicional y no reemplaza el valor original.
- **PCA** se calcula sobre las 15 variables numéricas estandarizadas, no sobre texto ni sobre la variable objetivo.

## 8. Relación con el avance del proyecto

Esta etapa completa la transformación posterior a la extracción, limpieza e integración. El orden del proyecto queda así:

1. `proyecto.py`: exploración inicial.
2. `01_preparacion_y_cruce_de_datos.py`: integración con marketing.
3. `proceso_extraccion_limpieza.py`: limpieza y exportación del CSV unificado.
4. `sesion4_transformacion_reduccion/transformar_datos_sesion4.py`: transformación, discretización y reducción.

Las matrices producidas quedan listas para análisis exploratorio avanzado y para los modelos de las sesiones posteriores.
