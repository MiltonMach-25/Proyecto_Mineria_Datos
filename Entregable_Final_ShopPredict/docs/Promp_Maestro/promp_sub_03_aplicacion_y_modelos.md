<div align="center">

# Módulo 03
## Aplicación, modelos y evaluación
### ShopPredict AI · Material de apoyo para la presentación

</div>

> **Objetivo del módulo:** demostrar qué puede hacer ShopPredict hoy, explicar
> los resultados guardados y presentar la API como servicio independiente de la
> interfaz gráfica.

**Se integra en:** diapositivas 7 y 8 del
[prompt maestro](./promp_maestro_Shoppredict.md).<br>
**Formato de salida:** 2 diapositivas · 3–4 viñetas · idea visual · guion oral.

---

## Brief de contenido

Actúa como asesor de exposición académica. Revisa `README.md`, el
[informe EDA actualizado](./Minería%20De%20Datos%20EDA%20%E2%80%93%20Proyecto%20Shoppredict%20-%20Actualizado.md),
el código de `prototipo_Shoppredict/` y las métricas de `evidencias/`. Si está
disponible el repositorio completo, consulta
`modelado.py` como referencia histórica, no como evaluación vigente de la GUI.

### Aplicación y flujo de uso

- La GUI está construida con Python y Tkinter, con pandas, NumPy, scikit-learn y
  Matplotlib. El código ejecutable, sus dependencias y el CSV local están juntos
  en `prototipo_Shoppredict/`.
- Permite cargar un CSV, revisar resumen y calidad de datos, explorar gráficas,
  entrenar/evaluar modelos, guardar un informe y exportar evidencias.
- Flujo para mostrar: **cargar archivo → explorar → entrenar/evaluar → consultar
  métricas y gráfica → exportar resultados**.
- La GUI conserva su apariencia y utiliza por defecto el CSV original; no consume
  la API REST. Los campos sintéticos de marketing no participan en esta evaluación.
- La API FastAPI es un servicio opcional, separado de la ventana. Expone
  `/health`, `/metadata`, `/schema`, `POST /predict` y la documentación `/docs`.
- La API entrena con todos los registros etiquetados disponibles al iniciar,
  para demostrar inferencia; sus respuestas no constituyen evaluación
  independiente ni métricas nuevas.
- El descargador UCI es otro componente: obtiene una copia opcional vía
  `ucimlrepo`, requiere Internet y no reemplaza el CSV local.

### Modelos y evaluación guardada

- Se comparan Árbol de Decisión, Random Forest y Regresión Logística.
- `Revenue` es el objetivo; `Session_ID` se excluye. Se eliminan duplicados
  exactos antes de una partición estratificada 80/20 con semilla 42.
- Los pipelines imputan faltantes y codifican categorías; los árboles no escalan
  variables numéricas y Regresión Logística usa `StandardScaler`.
- Se reportan accuracy, balanced accuracy, precision, recall, F1, ROC-AUC y
  matriz de confusión.
- El informe guardado registra **9.764 train / 2.441 test**, tras excluir 125
  duplicados. Random Forest obtuvo **F1 0,6348**, **accuracy 0,9029**,
  **balanced accuracy 0,7548**, **precision 0,7715**, **recall 0,5393** y
  **ROC-AUC 0,9248** en esa corrida.
- Los resultados pertenecen a una partición holdout académica. No prueban
  causalidad, aumento de ventas ni rendimiento en producción. Si se vuelve a
  ejecutar la GUI, vuelve a comprobar el informe y actualiza las cifras.

## Diapositiva A · Recorrido por la aplicación y servicios

Entrega:

- **Título y mensaje:** explicar que la GUI permite recorrer el análisis y
  evaluar modelos desde una aplicación local.
- **3–4 viñetas:** flujo de la GUI, exportación de evidencias, API REST separada y
  demostración de inicio.
- **Idea visual:** captura real de la GUI o mapa con dos carriles:
  `Aplicación Tkinter` y `API FastAPI`; añade la descarga UCI como recurso opcional.
- **Guion oral:** 2–3 frases que distingan la experiencia visual del prototipo y
  los servicios independientes.

### Comandos para la demo

| Acción | Inicio | Dirección |
|---|---|---|
| Abrir GUI | `prototipo_Shoppredict\iniciar_app.bat` | Aplicación local |
| Iniciar API (opcional) | `prototipo_Shoppredict\iniciar_api.bat` | `http://127.0.0.1:8000/docs` |
| Descargar copia UCI (opcional) | `prototipo_Shoppredict\descargar_dataset_uci.bat` | Requiere Internet |

## Diapositiva B · Modelos y evaluación

Entrega:

- **Título y mensaje:** comparar clasificadores y reportar el resultado observado,
  indicando que corresponde a una corrida.
- **3–4 viñetas:** modelos, partición reproducible, resultado del mayor F1 y
  lectura breve de F1/ROC-AUC/matriz de confusión.
- **Idea visual:** prioriza `evidencias/02_comparacion_modelos.png` y
  `evidencias/03_matriz_confusion_mejor_f1.png`; resalta el F1 guardado.
- **Guion oral:** 2–3 frases sobre el resultado y sus límites; no atribuyas valor
  predictivo independiente a la API.

## Cierre del módulo

Termina con una limitación y una mejora futura razonable: evaluar varias
particiones o validación cruzada y verificar qué variables estarían realmente
disponibles al momento de predecir una compra. Presenta esto como trabajo futuro,
no como funcionalidad ya implementada.

## Verificación antes de entregar

- [ ] No se afirma que Tkinter llame a FastAPI.
- [ ] La API se describe como demostración de inferencia, no como holdout.
- [ ] Las métricas coinciden con el informe guardado y se identifican como una corrida.
- [ ] Las visualizaciones incluyen contexto y lectura.
- [ ] Se explica al menos una limitación y una mejora futura.
- [ ] No se promete desempeño comercial ni en producción.

---

**Fuentes del módulo:** código de la GUI y API en `prototipo_Shoppredict/`,
`README.md`, informe EDA e informes de `evidencias/`. Para el recorrido completo,
vuelve al
[prompt maestro](./promp_maestro_Shoppredict.md).
