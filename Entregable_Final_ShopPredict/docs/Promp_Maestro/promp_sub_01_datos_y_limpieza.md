<div align="center">

# Módulo 01
## Datos, exploración y limpieza
### ShopPredict · Material de apoyo para la presentación

</div>

> **Objetivo del módulo:** explicar qué datos utiliza el proyecto, cuál es su
> procedencia y cómo se preparan, sin confundir información original con datos
> sintéticos.

**Se integra en:** diapositivas 3 y 4 del
[prompt maestro](./promp_maestro_Shoppredict.md).<br>
**Formato de salida:** 2 diapositivas · 3–4 viñetas · idea visual · guion oral.

---

## Brief de contenido

Actúa como asesor de exposición académica. Prepara el módulo sobre **dataset,
exploración y limpieza** de ShopPredict. Usa el
[informe EDA actualizado](./Minería%20De%20Datos%20EDA%20%E2%80%93%20Proyecto%20Shoppredict%20-%20Actualizado.md),
el README y las evidencias de esta carpeta; contrasta los detalles con
`proyecto.py`, `01_preparacion_y_cruce_de_datos.py` y
`proceso_extraccion_limpieza.py`. No supongas que estos scripts históricos forman
parte del paquete de demostración.

### Datos y procedencia

- Dataset principal: `online_shoppers_intention.csv`; representa sesiones de
  navegación y usa `Revenue` como etiqueta de compra/no compra.
- El CSV original incluido en `prototipo_Shoppredict/` contiene **12.330 filas,
  18 columnas, 0 faltantes, 125 duplicados exactos y 1.908 compras (15,47 %)**.
  Atribuye las cifras a ese archivo; la GUI actualiza los conteos si se carga
  otro. No describas todas las filas como sesiones únicas.
- **Kaggle** distribuye una copia atribuida a Akash Patel:
  [ficha Kaggle](https://www.kaggle.com/datasets/imakash3011/online-shoppers-purchasing-intention-dataset).
- **UCI** es la ficha original del conjunto, ID 468, DOI `10.24432/C5F88Q`:
  [ficha UCI](https://archive.ics.uci.edu/dataset/468/online+shoppers+purchasing+intention+dataset).
- `prototipo_Shoppredict/descargar_dataset_uci.py` usa
  `ucimlrepo.fetch_ucirepo(id=468)` para consultar UCI y guardar una copia
  separada y sus metadatos. Requiere Internet; no usa la API/credenciales de
  Kaggle ni reemplaza el CSV incluido.
- En una comparación realizada, el CSV local y la copia consultada en UCI
  coincidieron en dimensiones, columnas y valores. Limita la afirmación a esas
  versiones comparadas.

### Preparación e integración

- La limpieza elimina duplicados exactos, genera `Session_ID`, estandariza texto,
  registra validaciones y aplica clipping IQR a variables seleccionadas.
- La integración demostrativa agrega `Canal_Origen`, `Cupon_Aplicado`,
  `Nivel_Fidelidad` y `Gasto_Historico_USD` con una semilla fija.
- El archivo integrado documentado contiene **12.205 filas y 23 columnas**. Esos
  campos de marketing son **sintéticos**: sirven para practicar integración, no
  describen clientes, campañas ni compras reales.
- La GUI de modelado usa por defecto el CSV original, no el archivo integrado con
  esos campos sintéticos.
- El código [`reproducir_graficos_eda.py`](./reproducir_graficos_eda.py) vuelve a
  generar las figuras desde el CSV. `Canal_Origen` no existe en el archivo
  original: no se inventa para completar la gráfica por canal.

### Contraste con las cifras del informe fuente

Para el CSV incluido, `PageValues` es cero en **77,86 %** de las filas; la tasa
de compra cuando es positivo es **56,34 %**, y la correlación entre
`BounceRates` y `ExitRates` es **0,913**. El Word/PDF reporta cifras distintas
para estas gráficas. Presenta las del informe Markdown actualizado, que se
reproducen con el archivo distribuido, o indica que una cifra requiere
verificación.

`Canal_Origen`, `Cupon_Aplicado`, `Nivel_Fidelidad` y `Gasto_Historico_USD` son
campos sintéticos y no respaldan conclusiones sobre campañas o clientes reales.
No describas `PageValues` como señal disponible en tiempo real sin comprobar su
momento de cálculo.
- `Session_ID` ayuda a identificar registros durante el flujo; no se usa como
  característica predictiva. Excluir duplicados evita contar sesiones repetidas
  como observaciones distintas.

## Diapositiva A · Dataset, objetivo y fuentes

Entrega:

- **Título y mensaje:** una frase que relacione comportamiento de navegación con
  la etiqueta de compra.
- **3–4 viñetas:** unidad de análisis, `Revenue`, cifras del CSV original y
  procedencia Kaggle/UCI claramente diferenciada.
- **Idea visual:** tarjeta de ficha técnica o flujo `Kaggle (distribución) →
  CSV local` y `UCI (fuente original/API) → copia opcional`.
- **Guion oral:** 2–3 frases que presenten qué contiene el dataset y qué puede
  verificarse sobre su procedencia.

## Diapositiva B · Exploración, limpieza e integración

Entrega:

- **Título y mensaje:** explicar que preparar los datos permite analizarlos de
  forma ordenada, y que la integración de marketing es una demostración.
- **3–4 viñetas:** duplicados, `Session_ID`, estandarización/validaciones y
  campos sintéticos.
- **Idea visual:** esquema `CSV original → limpieza → integración demostrativa`,
  usando color o leyenda distinta para los cuatro campos simulados.
- **Guion oral:** 2–3 frases sobre el tratamiento y el límite de los datos
  sintéticos; termina conectando con la transformación.

## Código opcional

Si el público necesita ver cómo se consulta la fuente, muestra como máximo **8
líneas**. Prefiere un flujo esquemático; indica que el descargador es opcional,
necesita red, guarda otro CSV/JSON de metadatos y no modifica el archivo de la GUI.
La aplicación funciona offline con el CSV incluido.

## Verificación antes de entregar

- [ ] No se confunden filas originales e integradas.
- [ ] Los campos sintéticos se etiquetan explícitamente como simulados.
- [ ] No se afirma que Kaggle sea la API consultada por el script.
- [ ] Se distingue la utilidad de `Session_ID` de las variables del modelo.
- [ ] Las cifras están vinculadas al archivo concreto.
- [ ] El cierre conduce al módulo de escalamiento, codificación y PCA.

---

**Fuentes del módulo:** informe EDA actualizado, `../../README.md`, dataset incluido,
descargador UCI y evidencias del paquete. Para el recorrido completo, vuelve al
[prompt maestro](./promp_maestro_Shoppredict.md).
