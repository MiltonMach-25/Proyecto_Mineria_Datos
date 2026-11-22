# Handoff · Presentación ShopPredict

## Estado actual

La única entrega activa es la presentación HTML final:

- Archivo: `ProyectoMineriaDeDatos/presentacion_final.html`
- Entregable final: `Entregable_Final_ShopPredict/index.html`
- Acceso local: `http://127.0.0.1:8080/index.html`
- Inicio local:

```powershell
cd C:\Users\melan\Documents\Semestre_N8\ProyectoMineriaDeDatos
python -m http.server 8080 --bind 127.0.0.1
```

La presentación final contiene 12 diapositivas y navegación por:

- Flecha izquierda/derecha.
- Barra espaciadora.
- Tecla `F` para pantalla completa.

Las láminas 10–12 contienen gráficos interactivos o manipulables:

- Regresión lineal con deslizador de páginas relacionadas.
- Interpolación de Lagrange con deslizador de valor `x`.
- Comparación final entre regresión y Lagrange.

## Actualización visual incorporada

Se revisó el PowerPoint anterior de 9 diapositivas y se incorporó su lenguaje visual a
elementos propios de ShopPredict:

- Diagrama de Árbol de Decisión inspirado en el esquema del PowerPoint, construido sobre
  la segunda entrega y aplicado a sesiones de navegación.
- Visual de aplicación del prototipo y arquitectura de demostración.
- Red visual de las variables candidatas para clustering.
- Flujo gráfico de K-means con cuatro etapas.
- Separación visual de las variables de entrada y la variable objetivo.
- Lámina de sesión 8 ampliada con tres diagramas propios: reglas del árbol, combinación
  probabilística ilustrativa de Naive Bayes y mapa conceptual de vecinos para KNN.
- No se presentan métricas nuevas de NB o KNN como resultados reales; se indica
  claramente que deben ejecutarse sobre el mismo holdout.
- Se retiró “AI” del encabezado visual de la presentación y del dashboard.

No se copiaron fondos, capturas ajenas ni imágenes de League of Legends.
Las imágenes incorporadas representan diagramas del proyecto, no resultados simulados.

## Orden confirmado de las 12 diapositivas

1. Portada y alcance.
2. Objetivo general y contexto.
3. Datos y calidad.
4. Metodología y preparación.
5. Exploración y hallazgos.
6. Árbol de decisión, sesión 7.
7. Sesión 8 y comparación supervisada.
8. Resultados de clasificación.
9. K-means y clustering jerárquico, sesión 9.
10. Regresión lineal.
11. Interpolación de Lagrange.
12. Diferencias entre métodos y decisión final.

No fue necesario cambiar el HTML para usar imágenes o fondos de League of Legends.

## Datos confirmados

Archivo principal:

`ProyectoMineriaDeDatos/online_shoppers_intention.csv`

Datos básicos:

- 12.330 filas.
- 18 columnas.
- 0 faltantes.
- 125 duplicados exactos.
- 12.205 filas después de deduplicar.
- 1.908 compras, 15,47 %.
- `Revenue` es el objetivo.

Hallazgos EDA reproducibles:

- Mediana de `ProductRelated_Duration`: 510 segundos sin compra y 1.110 segundos con compra.
- `PageValues = 0` en 77,86 % de las filas.
- Cuando `PageValues > 0`, la compra aparece en 56,34 % de las filas.
- Correlación `BounceRates–ExitRates`: 0,913.
- Correlación `PageValues–Revenue` codificada 0/1: 0,493.

Advertencias:

- Las asociaciones no prueban causalidad.
- Los campos de marketing sintéticos no representan campañas reales.
- No deben presentarse como resultados reales las tasas por `Canal_Origen`.
- El dataset no debe llamarse “12.330 sesiones únicas”.

## Modelos documentados

Resultados de la partición holdout 80/20 con semilla 42 y 125 duplicados excluidos:

| Modelo | Accuracy | Precision | Recall | F1 | ROC-AUC |
|---|---:|---:|---:|---:|---:|
| Árbol de decisión | 0,8574 | 0,5423 | 0,5707 | 0,5561 | 0,7407 |
| Random Forest | 0,9029 | 0,7715 | 0,5393 | 0,6348 | 0,9248 |
| Regresión logística | 0,8873 | 0,7560 | 0,4136 | 0,5347 | 0,8997 |

Conclusión permitida:

- Random Forest obtuvo el mayor F1 en esa partición.
- No se debe presentar como ganador universal.
- No demuestra superioridad futura ni desempeño en producción.

Pendiente académico:

- Ejecutar Naive Bayes y KNN sobre el mismo holdout de ShopPredict si se desea una comparación completa con todos los modelos solicitados.
- Si no se ejecutan, presentarlos como conceptos aplicables o pendientes, no como resultados medidos.

## Métodos numéricos

Variables usadas:

- `x`: `ProductRelated`.
- `y`: `ProductRelated_Duration`.

Regresión lineal preliminar después de deduplicar y separar 80/20:

```text
ŷ = -0,857242 + 37,566054x
R² holdout = 0,77093
RMSE holdout = 844,436 segundos
MAE holdout = 491,635 segundos
```

Interpolación de Lagrange preliminar:

| x = páginas | y = duración promedio |
|---:|---:|
| 3,7718 | 145,2464 |
| 12,2917 | 489,1138 |
| 26,5391 | 1.044,8487 |
| 84,6620 | 3.098,1926 |

Interpolación en `x = 20`:

```text
P3(20) aproximadamente 792,7 segundos
```

Precauciones:

- Son cálculos preliminares reproducibles.
- Deben recalcularse si cambia la selección de puntos, el tratamiento de duplicados o la partición.
- No deben presentarse como estimación de compra.
- Regresión lineal se debe recomendar para tendencia general.
- Lagrange se debe presentar como estimación puntual dentro del intervalo observado.

## Clustering

Debido al alcance solicitado:

- Sesión 7: Árbol de decisión.
- Sesión 8: Naive Bayes y KNN.
- Sesión 9: K-means y clustering jerárquico.

Variables sugeridas para clustering:

- `ProductRelated`.
- `ProductRelated_Duration`.
- `BounceRates`.
- `ExitRates`.
- `PageValues`.

Método recomendado:

- Estandarizar variables.
- Probar `k=2...8`.
- Mostrar codo e silueta.
- Perfilar los clústeres antes de asignar nombres comerciales.
- Ejecutar jerárquico sobre una muestra, no sobre las 12.205 filas completas.

No hay un resultado K-means validado en el HTML para ShopPredict. El dendrograma visible es un activo demostrativo de la sesión 9 o TelecomUNO; no debe afirmarse que sea el dendrograma final de ShopPredict.

## Arquitectura actual

La arquitectura definitiva es:

```text
GitHub -> Vercel -> Supabase -> Dashboard ShopPredict
```

No se utiliza BigQuery, Google Cloud ni Looker Studio como dependencia.

El paquete final contiene:

- `Entregable_Final_ShopPredict/index.html`
- `Entregable_Final_ShopPredict/dashboard.html`
- `Entregable_Final_ShopPredict/api/stats.js`
- `Entregable_Final_ShopPredict/supabase/schema.sql`
- `Entregable_Final_ShopPredict/supabase/import_csv.py`
- `Entregable_Final_ShopPredict/vercel.json`

Estado real:

- La presentación está lista.
- El dashboard está preparado.
- Supabase no está conectado hasta que existan URL y claves.
- Vercel no está desplegado hasta importar el proyecto y configurar variables.
- “Tiempo real” requiere carga periódica o streaming posterior.

## Archivos relevantes

Presentación:

- `presentacion_final.html`

Evidencias existentes:

- `Promp_Maestro/evidencias/01_diagnostico_dataset.png`
- `Promp_Maestro/evidencias/02_comparacion_modelos.png`
- `Promp_Maestro/evidencias/eda/02_boxplot_product_duration.png`
- `Promp_Maestro/evidencias/eda/05_heatmap_correlaciones.png`
- `presentacion_assets/dendrograma_sesion9.png`
- `presentacion_assets/powerpoint-arbol-decision.png`
- `presentacion_assets/powerpoint-aplicacion.png`
- `presentacion_assets/powerpoint-variables-clustering.png`

Aplicación existente:

- `Promp_Maestro/prototipo_Shoppredict/app_shoppredict_gui.py`
- `Promp_Maestro/prototipo_Shoppredict/shoppredict_model.py`
- `Promp_Maestro/prototipo_Shoppredict/api_shoppredict.py`

Sesiones de clase:

- `mineria-inteligenciaSDLC-OCTAVO/mineria_de_datos/sesion7`
- `mineria-inteligenciaSDLC-OCTAVO/mineria_de_datos/sesion8`
- `mineria-inteligenciaSDLC-OCTAVO/mineria_de_datos/sesion9`

Métodos numéricos:

- `Metodo_Númericos/regresion lineal_v2/regresion lineal/regresion_lineal_subditos_akali.html`
- `Metodo_Númericos/regresion lineal_v2/regresion lineal/regresion_lagrange_subditos_akali.html`
- `Metodo_Númericos/presentacion_metodos_numericos.html`

## Indicaciones para otro chat o cuenta

Continúa desde este punto con el siguiente mensaje:

```text
Estoy continuando el proyecto ShopPredict desde HANDOFF_PRESENTACION.md.
No rehagas el análisis desde cero.

Objetivo: continuar el entregable final ShopPredict.
Conserva exactamente 12 diapositivas: 9 de minería y 3 de métodos numéricos.
Usa GitHub, Vercel y Supabase. No uses BigQuery ni Looker Studio.

Pendientes prioritarios:
1. Ejecutar y documentar K-means sobre ShopPredict.
2. Ejecutar Naive Bayes y KNN sobre el mismo holdout.
3. Sustituir cálculos preliminares por los resultados finales si cambian.
4. Crear las tablas y RLS en Supabase.
5. Preparar tablas derivadas de métricas y clústeres.
6. Añadir una demostración real de Supabase sin prometer tiempo real.

No publiques datos ni claves privadas.
No presentes asociaciones como causalidad.
No presentes el dendrograma de TelecomUNO como resultado de ShopPredict.
No inventes métricas ni resultados de NB, KNN o K-means.
Usa los archivos y cifras confirmados en este documento.
```

## Prohibición de alcance para continuidad

No volver a ampliar la presentación a más de 12 diapositivas.
No volver a investigar BigQuery o Looker Studio.
No crear dashboards públicos hasta que existan credenciales y autorización.
No ejecutar cambios destructivos ni subir claves privadas.
