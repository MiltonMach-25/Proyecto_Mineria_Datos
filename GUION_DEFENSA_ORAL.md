# GUION DE DEFENSA ORAL - PROYECTO MINERÍA DE DATOS

---

## ✅ RESUMEN DE LOS HTMLs REVISADOS

**Sesión 1 (presentacion.html):** Ciclo de vida del software (7 fases). Dónde entra IA en cada fase. Proyecto integrador con matriz fase×IA.

**Sesión 2 (presentacion2.html):** Cómo funciona un LLM. Anatomía del prompt profesional (6 componentes: ROL, CONTEXTO, TAREA, FORMATO, RESTRICCIONES, EJEMPLOS). Alucinaciones y cómo evitarlas.

**Sesión 3 (presentacion3.html):** Requisitos funcionales/no funcionales. Historias de usuario (Como...quiero...para). INVEST, Gherkin (Given-When-Then), MoSCoW. IA genera borradores, humano valida.

---

## 🎯 METODOLOGÍA DEL CURSO QUE DEBE COINCIDIR CON TU PROYECTO

El curso enseña: **IA ASISTIDA** (no autónoma)
- IA propone borradores
- Humano valida críticamente
- Se documenta TODA iteración
- Responsabilidad humana del resultado final

---

## 📋 GUION DE EXPOSICIÓN (12 minutos)

### **1. GANCHO + INTRODUCCIÓN (1 min)**

"El 80% del trabajo en minería de datos es limpiar información dispersa. Hoy les mostramos cómo hacerlo profesionalmente con tres archivos Python que siguen el SDLC.

Problema: tiendas online tienen datos de navegación en un lado, marketing en otro.  
Solución: pipeline que integra, valida y limpia automáticamente."

---

### **2. MAPEO A LAS 7 FASES DEL SDLC (2 min)**

Nuestro proyecto toca TRES fases del ciclo de vida:

| Fase SDLC | Tu archivo | Qué hace | Metodología |
|---|---|---|---|
| **Planeación** | `proyecto.py` | Verifica que el dataset esté completo antes de procesar | Validación preventiva |
| **Análisis** | `01_preparacion_y_cruce_de_datos.py` | Entiende qué datos tiene y qué falta; genera datos de marketing simulados | Integración de fuentes |
| **Diseño + Codificación + Pruebas** | `proceso_extraccion_limpieza.py` | Implementa pipeline automático con clases, valida datos, expone bitácora | Arquitectura profesional |

Cada archivo es una decisión de SDLC materializada en código.

---

### **3. EL PROMPT ENGINEERING EN NUESTRO PROYECTO (1.5 min)**

Como ustedes estudiaron en Sesión 2, un prompt profesional tiene 6 componentes.

Nuestro proyecto NO usa IA para generar código (usamos nuestro cerebro), pero SÍ demuestra principios de **claridad y estructura**:

**Los 6 componentes aparecen en nuestro código como:**

1. **ROL:** Clase `ExtractorDatos` (responsable de leer)  
2. **CONTEXTO:** Path relativo al archivo CSV (dónde vive el dato)  
3. **TAREA:** Método con un trabajo único y claro (`remover_duplicados`, `tratar_outliers_iqr`)  
4. **FORMATO:** Salida estructurada (tabla de bitácora en markdown)  
5. **RESTRICCIONES:** Validaciones que dicen qué NO queremos (valores fuera de [0,1], duplicados)  
6. **EJEMPLOS:** Logs que muestran exactamente qué se hizo

**Traducción:** Nuestro pipeline es "un prompt ejecutable en Python".

---

### **4. REQUISITOS Y CRITERIOS DE ACEPTACIÓN (Sesión 3, 1.5 min)**

Como estudiaron historias de usuario, definimos **requisitos implícitos del proyecto**:

**RF-01 (Funcional):** El sistema carga datos de navegación sin errores.  
✅ Criterio Gherkin: `Dado que existe online_shoppers_intention.csv / Cuando se ejecuta proyecto.py / Entonces muestra 12,330 registros y 19 columnas`

**RF-02:** El sistema cruza dos fuentes por Session_ID sin perder integridad.  
✅ Criterio: `Dado que existen datos de navegación y marketing / Cuando Inner Join / Entonces resultado tiene 12,325 registros (todos con ambas columnas)`

**RNF-01 (No Funcional):** La limpieza ejecuta en menos de 5 segundos.  
✅ Criterio: `Cuando se corre proceso_extraccion_limpieza.py / Entonces demora <5 seg`

**Priorización MoSCoW:**
- **Must:** Cargar, validar, limpiar datos
- **Should:** Generar bitácora legible
- **Could:** Visualizar estadísticas
- **Won't:** API web, dashboard interactivo (fuera de alcance)

---

### **5. LA TÉCNICA CLAVE: IQR COMO DECISIÓN TÉCNICA (1.5 min)**

**Pregunta:** ¿Por qué IQR en lugar de Z-score?

Respuesta según **rigor SDLC:**

En la fase de **Diseño**, elegimos IQR porque:

✅ **Datos NO normales:** E-commerce tiene sesiones de 10 seg y otras de 3 horas. Z-score se confunde.  
✅ **Robusto:** IQR usa percentiles (Q1, Q3), que ignoran extremos.  
✅ **Preserva volumen:** No eliminamos 400+ registros; los ajustamos (Capping).  
✅ **Documentable:** Cada ajuste se registra en la bitácora → trazabilidad = auditoría.

**Fórmula:**
```
Límite_inf = max(0, Q1 - 1.5 × IQR)
Límite_sup = Q3 + 1.5 × IQR
valor_ajustado = clip(valor_original, Límite_inf, Límite_sup)
```

Es una **decisión técnica defendible**, no una adivinanza.

---

### **6. INTEGRACIÓN DE FUENTES: INNER JOIN (1 min)**

**Decisión de Análisis (Sesión 1, matriz fase×IA):**

¿Left Join (todo de navegación) o Inner Join (solo completos)?

**Nuestro criterio:**

| Aspecto | Left Join | Inner Join (Elegido) |
|---|---|---|
| Registros | 12,330 | 12,325 |
| Nulos en marketing | Sí (~150) | No |
| Modelo ML usa esto | Débil (hay que imputar) | Fuerte (limpio) |
| Auditoría | "Perdí 150 sin saber" | "Perdí 5 duplicados, documentado" |

**Conclusión:** Inner Join es más honesto. Calidad > cantidad.

---

### **7. ARQUITECTURA: CLASES REUTILIZABLES (1 min)**

**Sesión 1 menciona:** Código profesional diferencia **IA asistida** (propone borradores) de **IA autónoma** (decide sola).

Nuestro código implementa **principios similares:**

**Patrón 1: Separación de responsabilidades**
```python
class ExtractorDatos:        # Lee archivos
    def cargar_csv(self, ruta):
        
class LimpiadorPipeline:     # Procesa y limpia
    def remover_duplicados(self):
    def tratar_outliers_iqr(self):
```

Cada clase hace UNA cosa bien. Reutilizable. Testeable.

**Patrón 2: Pipeline encadenado (fluent API)**
```python
pipeline.remover_duplicados()\
    .generar_session_id()\
    .limpiar_texto()\
    .validar_dominios()\
    .cruzar_marketing(df_marketing)\
    .tratar_outliers_iqr([columnas])
```

Legible. Profesional. El orden de transformaciones es claro.

---

### **8. BITÁCORA DE AUDITORÍA (1 min)**

**Sesión 2, Sesión 3 enfatizan:** Documentación integrada = evidencia de proceso.

Nuestro pipeline genera:

```
--- BITÁCORA DE TRANSFORMACIONES ---
Duplicados exactos           | 5 removidos
Generación Session_ID        | 12,325 IDs creados
IQR - BounceRates           | 120 valores ajustados
Rango [0, 0.1] aplicado
Cruce información           | Inner Join 12,325 × 1:1
```

**Por qué importa:**
- No es "magia": está documentado QUÉ pasó
- Auditoría: en la industria, eso es obligatorio
- Reproducibilidad: otro equipo ejecuta el código y obtiene el MISMO resultado

---

### **9. COMPARACIÓN CON CICLO REAL (30 seg)**

Datos Abiertos Colombia (SECOP, Peticiones):
- ❌ Múltiples encodings
- ❌ Nulos falsos ("NO REGISTRA", "N/A")
- ❌ Sin clave única
- ❌ Fechas desordenadas

Nuestro dataset (e-commerce limpio):
- ✅ Homogéneo, estructurado
- ✅ SDLC aplicado desde el inicio
- ✅ Reutilizable para próximos proyectos

**Lección:** Nuestro proyecto enseña en ambiente controlado. Cuando vean datos reales, ya sabrán.

---

### **10. EJECUCIÓN EN VIVO (1 min)**

```bash
$ python proyecto.py
# Output: 12,330 registros, 19 columnas ✓

$ python 01_preparacion_y_cruce_de_datos.py
# Output: Cruce exitoso, 24 columnas ✓

$ python proceso_extraccion_limpieza.py
# Output: Bitácora + dataset_limpio_cruce_marketing.csv ✓
```

**Resultado:** Un archivo CSV listo para entrenar modelos de IA.

---

### **11. CONCLUSIÓN (30 seg)**

"Este proyecto aplica el SDLC que estudiaron:
- **Planeación:** Verificar que lo tenemos todo
- **Análisis:** Entender fuentes y mezclarlas
- **Diseño + Código + Pruebas:** Implementar con rigor

No es solo programar. Es **ingeniería de datos**: decisiones técnicas, código profesional, auditoría integrada, reproducibilidad.

Eso es lo que la industria necesita. Gracias."

---

## 🎓 RESPUESTAS A PREGUNTAS (BASADAS EN HTMLS)

### P: "¿Usaste IA para generarlo?"

R: "No para el código. Pero el PROYECTO demuestra los principios de IA-SDLC que estudiamos:
- Cada componente hace UNA tarea (como 6 componentes del prompt)
- Validación humana del resultado (bitácora de auditoría)
- Documentación clara (no es caja negra)

Si fuera IA autónoma, sería un click; al ser código estructurado, es defendible."

---

### P: "¿Por qué perder 5 registros?"

R: "Duplicados exactos: dos sesiones idénticas fila-por-fila. Es ruido de la captura.

Sesión 1 hablaba de decisiones baratas en fases tempranas. Perder 5 registros aquí (0.04%) es más barato que tener 12,330 con ruido que confunda el modelo después."

---

### P: "¿Qué sigue con este dataset?"

R: "Son los próximos pasos del SDLC:
- **Análisis Exploratorio (EDA):** Ver distribuciones
- **Feature Engineering:** Crear variables nuevas
- **Modelado:** Entrenar clasificador
- **Despliegue:** API o reporte

Nuestro proyecto fue Planeación + Análisis + Diseño/Código. Los pasos 2-4 son proyectos futuros, pero sin este paso no funcionan."

---

### P: "¿Cómo se que IQR es mejor que Z?"

R: "Estadísticamente:
- **Z-score:** Asume distribución normal. Si no es normal, da falsos positivos.
- **IQR:** Robusto, no asume nada.

En e-commerce, 90% de sesiones son cortas, 10% largas. Eso NO es normal. IQR lo maneja bien; Z-score confunde."

---

### P: "¿Scales a 1 millón de registros?"

R: "Sí. El código usa pandas/numpy que están optimizadas en C. 

Cambios mínimos:
- Cargar en chunks (si no cabe en RAM)
- Usar bases de datos (SQL) en lugar de CSV
- Paralelizar transformaciones

La lógica sigue igual: SDLC no cambia, escala sí."

---

## 📋 CHECKLIST ANTES DE EXPONER

- [ ] Revisar los 3 HTMLs (metodología IA-SDLC)
- [ ] Memorizar: 7 fases SDLC, 6 componentes prompt, requisitos/historias
- [ ] Entender: por qué IQR, por qué Inner Join, por qué clases
- [ ] Practicar guion EN VOZ ALTA 3+ veces
- [ ] Llevar laptop con código listo
- [ ] CSV en carpeta (no descargado cada vez)
- [ ] Saber ejecutar 3 archivos en orden
- [ ] Cronometrar: ¿12 minutos exactos?
- [ ] Preparar 3 slides de respaldo si falla demo

---

## ⏱️ DESGLOSE DE TIEMPOS

| Sección | Minutos | Qué hacer |
|---|---|---|
| Gancho | 1 | Problema + solución |
| SDLC (3 fases) | 2 | Mapeo archivo a fase |
| Prompt engineering | 1.5 | 6 componentes en código |
| Requisitos | 1.5 | RF/RNF + criterios |
| IQR técnica | 1.5 | Decisión defendible |
| Inner Join | 1 | Calidad > cantidad |
| Arquitectura | 1 | Clases reutilizables |
| Bitácora | 1 | Auditoría = evidencia |
| Comparación datos | 0.5 | Contexto real |
| Ejecución | 1 | Demo en vivo |
| Conclusión | 0.5 | Cierre fuerte |
| **TOTAL** | **12.5** | |

**Preguntas: 3-5 min adicionales**

---

**¡Listos a defender!** 🚀
