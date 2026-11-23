<div align="center">

# Módulo 02
## Transformación, escalamiento y PCA
### ShopPredict · Material de apoyo para la presentación

</div>

> **Objetivo del módulo:** contar cómo se preparan las variables para el análisis
> y qué aporta PCA, separando las prácticas documentadas de la evaluación actual
> de la GUI.

**Se integra en:** diapositiva 5 del
[prompt maestro](./promp_maestro_Shoppredict.md).<br>
**Formato de salida:** 2 diapositivas · 3–4 viñetas · idea visual · guion oral.

---

## Brief de contenido

Actúa como asesor de exposición académica. Prepara un módulo conciso de
**transformación de datos** y evita repetir la explicación general del dataset.
Consulta `../Escalamiento_Proyecto/GUIA_ESCALAMIENTO.md` y
`../sesion4_transformacion_reduccion/GUIA_SESION4.md`.

### Evidencia técnica

- Las prácticas parten del CSV limpio e integrado, que incluye campos de
  marketing sintéticos. No lo confundas con el CSV original usado por defecto
  en la GUI.
- Se comparan `MinMaxScaler`, `StandardScaler` y `RobustScaler`; las categorías
  nominales se convierten con `OneHotEncoder`. `Weekend` y `Cupon_Aplicado` se
  conservan como indicadores binarios.
- `Session_ID` se excluye de las características y `Revenue` se mantiene como
  objetivo. El transformador se ajusta solo con train y luego se aplica a test
  para evitar fuga de información.
- Sesión 4 discretiza `Gasto_Historico_USD` en cuatro cuantiles y aplica PCA a
  variables numéricas estandarizadas.
- **Resultados de prácticas distintas:** `Escalamiento_Proyecto` usa 11 variables
  numéricas y 6 componentes para alcanzar al menos 90 % de varianza; Sesión 4 usa
  15 variables numéricas y 10 componentes para ese umbral. No combines estas
  cifras como si provinieran de una sola corrida.
- PCA combina variables y reduce dimensionalidad; disminuye la interpretación
  directa de cada característica. **No es un clasificador ni una métrica
  predictiva.**
- La descarga UCI aporta la fuente de datos; no añade campos reales de marketing
  ni modifica por sí sola las transformaciones.

## Diapositiva A · Escalamiento y codificación

Entrega:

- **Título y mensaje:** explicar cómo se vuelven comparables las escalas y cómo
  se preparan las categorías para los algoritmos.
- **3–4 viñetas:** propósito del escalamiento, métodos comparados, OneHotEncoder,
  y división correcta entre train y test.
- **Idea visual:** carril de preprocesamiento `numéricas → scaler`,
  `categóricas → OneHotEncoder`, `Revenue → objetivo`.
- **Guion oral:** 2–3 frases en lenguaje sencillo. Aclara que escalar no
  garantiza por sí solo una mejor predicción.

## Diapositiva B · Discretización y PCA

Entrega:

- **Título y mensaje:** mostrar que PCA resume información numérica en menos
  componentes para facilitar el análisis.
- **3–4 viñetas:** discretización en cuatro cuantiles, entradas numéricas,
  umbral de varianza y pérdida de interpretabilidad.
- **Idea visual:** diagrama de muchas variables que convergen en menos
  componentes; usa una llamada lateral para advertir que hay dos prácticas.
- **Guion oral:** 2–3 frases; diferencia reducción dimensional de clasificación
  y menciona que las entradas son distintas.

## Condiciones para la presentación

- Presenta los resultados de PCA en dos tarjetas separadas y nómbralas por
  práctica.
- Señala que las matrices de transformación parten del CSV integrado; la GUI
  evalúa por defecto con el CSV original.
- Identifica los campos de marketing como sintéticos, no como datos reales.
- Si incluyes código, usa como máximo **8 líneas**. Un esquema visual es preferible.
- Cierra conectando la matriz transformada con la etapa de modelado, sin asegurar
  que el escalamiento mejora el resultado.

## Verificación antes de entregar

- [ ] Los resultados de las dos prácticas no se mezclan.
- [ ] Train/test se describe sin fuga de información.
- [ ] PCA se define como reducción dimensional, no como clasificador.
- [ ] La evaluación de la GUI se diferencia del flujo de transformación.
- [ ] Los campos sintéticos no se atribuyen a usuarios o campañas reales.

---

**Fuentes del módulo:** documentación de `Escalamiento_Proyecto` y Sesión 4.
Para el recorrido completo, vuelve al
[prompt maestro](./promp_maestro_Shoppredict.md).
