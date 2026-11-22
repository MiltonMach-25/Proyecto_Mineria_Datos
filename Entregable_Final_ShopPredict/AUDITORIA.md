# Auditoría · ShopPredict

## Alcance revisado

Se revisaron el dataset, los scripts de minería, las evidencias, el PowerPoint de segunda entrega y las presentaciones de métodos numéricos.

## Datos confirmados

- Archivo: `online_shoppers_intention.csv`
- 12.330 filas
- 18 columnas
- 0 faltantes
- 125 duplicados exactos
- 12.205 filas después de deduplicar
- 1.908 compras
- 15,47 % de compras
- `Revenue` como objetivo

## Hallazgos EDA reproducibles

- Mediana de `ProductRelated_Duration`: 510 segundos sin compra y 1.110 segundos con compra.
- `PageValues = 0`: 77,86 %.
- Conversión entre filas con `PageValues > 0`: 56,34 %.
- Correlación BounceRates–ExitRates: 0,913.
- Correlación PageValues–Revenue codificada 0/1: 0,493.

No se presentan como causales.

## Modelos documentados

- Árbol de decisión: accuracy 0,8574; F1 0,5561.
- Random Forest: accuracy 0,9029; F1 0,6348.
- Regresión logística: accuracy 0,8873; F1 0,5347.

La partición fue estratificada 80/20 con semilla 42. Random Forest fue el mayor F1 en esa partición, no una afirmación de superioridad universal.

## Métodos numéricos

Se usan `ProductRelated` y `ProductRelated_Duration`.

Regresión preliminar:

```text
ŷ = -0,857242 + 37,566054x
R² = 0,77093
RMSE = 844,436 segundos
```

Lagrange preliminar:

| x | y |
|---:|---:|
| 3,7718 | 145,2464 |
| 12,2917 | 489,1138 |
| 26,5391 | 1.044,8487 |
| 84,6620 | 3.098,1926 |

Predicción aproximada en `x = 20`: 792,7 segundos.

## No implementado o pendiente

- Conexión real a Supabase hasta que existan URL y claves.
- Importación real hasta ejecutar el script con credenciales.
- Despliegue real en Vercel hasta importar el proyecto y configurar variables.
- Ejecución final de Naive Bayes y KNN sobre ShopPredict.
- Ejecución final de K-means y perfiles comerciales sobre ShopPredict.
- Predicciones y clústeres reales si no están disponibles en tablas de Supabase.

## Datos que no deben presentarse como reales

- Marketing sintético y `Canal_Origen`.
- Tasas por canal del Word/PDF si no están reproducidas por el CSV original.
- Causalidad entre PageValues y compra.
- Rendimiento en producción a partir de una única partición.
