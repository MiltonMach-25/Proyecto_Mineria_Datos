# Instrucción para Google AI Studio Build

El frontend generado en Google AI Studio ya se integró en
`Entregable_Final_ShopPredict/frontend/`. Conecta el repositorio
`MiltonMach-25/Proyecto_Mineria_Datos` y usa la instrucción siguiente solo para
revisar, probar y completar el despliegue. Trabaja únicamente sobre
`Entregable_Final_ShopPredict/` y conserva los avances actuales.

---

## PROMPT PARA AI STUDIO

Actúa como ingeniero/a senior full-stack, especialista en aplicaciones de datos
y despliegues en Google Cloud. Debes **inspeccionar, completar, probar y, si el
proyecto y los permisos lo permiten, desplegar en producción** ShopPredict:
Intención de Compra. No te limites a crear una maqueta ni a dar recomendaciones.

El objetivo de la sustentación es demostrar una aplicación funcional con
**frontend y backend**, que lea y muestre los datos reales del repositorio. La
presentación HTML no cuenta como despliegue: el despliegue que se debe demostrar
es la aplicación web y su API funcionando.

### 1. Revisión antes de editar

1. Confirma el repositorio y la rama conectados, y revisa el estado actual antes
   de cambiar archivos.
2. Lee `Entregable_Final_ShopPredict/README.md`,
   `AUDITORIA.md` y este archivo.
3. Inspecciona `backend/api_shoppredict.py`,
   `backend/shoppredict_model.py`, `backend/requirements.txt`, `Dockerfile`,
   `frontend/`, `dashboard.html`, `index.html`,
   `data/online_shoppers_intention.csv` y
   `assets/evidencias/metricas_modelos.csv`.
4. Ejecuta las pruebas existentes antes de editar. Mantén los archivos
   académicos; no reconstruyas el proyecto desde cero.
5. Usa `frontend/` como el frontend React ya integrado. No copies el export
   anidado `proyecto_final_shoppredict/` ni agregues su servidor Express/Node:
   FastAPI es el backend único del proyecto.

### 2. Arquitectura requerida

- **Frontend:** conserva y completa el dashboard React + Vite ya integrado en
  `frontend/`; debe ser moderno, responsive, accesible y en español.
- **Backend:** conserva FastAPI y scikit-learn como autoridad para los datos,
  validaciones y predicciones. No reimplementes los modelos en el navegador.
- **Datos:** usa el CSV versionado en `data/` como fuente inicial. La API y el
  frontend deben mostrar estados reales de carga, error y ausencia de datos.
- **Producción:** compila el frontend con el `Dockerfile` y sirve frontend y
  FastAPI desde el mismo servicio Cloud Run y origen. Mantén `/` para el
  dashboard, `/index.html` para la presentación y `/dashboard.html` como
  alternativa HTML.
- No añadas una base de datos, persistencia de cargas ni servicios externos que
  no estén configurados y probados. La validación de CSV actual es temporal y no
  guarda ni importa archivos.
- No solicites ni escribas contraseñas, claves, tokens o credenciales en el chat,
  el código ni Git. Si hace falta autorización, indica al usuario dónde
  configurarla de forma segura en Google Cloud.

### 3. Funcionalidades que debe tener el frontend

1. **Dashboard real:** consulta `GET /stats`; muestra sesiones deduplicadas,
   compras, conversión, duración promedio y distribución de compras. Implementa
   filtros funcionales por mes y tipo de visitante (`month` y `visitor_type`).
   Indica que las métricas de modelos siguen siendo las del holdout global,
   aunque se filtren los KPI.
2. **Comparación de modelos:** consume `GET /metrics` y presenta únicamente los
   resultados verificados de Árbol de decisión, Random Forest y Regresión
   logística. Explica que son de una partición estratificada 80/20 con semilla
   42, no una garantía de producción.
3. **Predicción individual:** consume `GET /schema` para crear el formulario,
   utiliza `categorical_options` y `numeric_ranges`, y envía el modelo y las
   variables a `POST /predict`. Presenta la respuesta real, probabilidad y nota
   de uso académico; muestra errores del backend claramente.
4. **Validación CSV:** permite enviar un CSV a `POST /dataset/validate` y
   presenta filas, columnas, duplicados, columnas faltantes, observaciones y
   `persisted`. Aclara que el archivo no se guarda ni reemplaza el dataset.
5. **Estados operativos:** incluye carga, reintento, error de conexión, filtros
   sin resultados y confirmación de conexión al backend mediante `/health`.
6. **Métodos pendientes:** Naive Bayes, KNN y clustering no tienen métricas
   finales verificadas. No inventes porcentajes, clústeres, matrices ni gráficos
   para ellos. Solo preséntalos como pendientes/conceptuales hasta ejecutar una
   evaluación reproducible en el backend y actualizar la auditoría.

### 4. Requisitos de la sustentación

- Conserva `index.html`, el logotipo local y todos los recursos necesarios para
  compartir la presentación sin depender de imágenes externas.
- Mantén **exactamente 12 diapositivas: 9 de minería de datos contando la
  portada, y 3 de métodos numéricos**.
- Deben quedar claros el objetivo general, contexto, metodología predictiva,
  resultados, conclusiones y despliegue.
- Después de verificar el despliegue, actualiza la diapositiva de conclusiones y
  despliegue con la arquitectura **real**, la URL pública que comprobaste y una
  evidencia visual apropiada. No uses la presentación como sustituto del
  dashboard desplegado.
- Conserva las tres diapositivas numéricas sobre regresión lineal, interpolación
  de Lagrange y diferencia entre métodos.
- No presentes esquemas conceptuales como resultados medidos. No incluyas “AI”
  en el nombre de marca; el nombre es **ShopPredict · Intención de Compra**.

### 5. Despliegue de producción: obligación y comprobación

1. Ejecuta `npm ci`, las pruebas y la compilación dentro de `frontend/`;
   después construye el contenedor desde el repositorio.
2. Despliega la API y el frontend funcional en un servicio de Google Cloud Run, usando el
   proyecto y la región que autorice el usuario.
3. Si la aplicación debe ser pública para que el jurado la vea, configura el
   acceso únicamente cuando el propietario del proyecto lo autorice y no existan
   datos privados.
4. Comprueba desde una URL de producción, no solo en local:
   - `/health` responde correctamente y reporta los modelos cargados;
   - `/stats` muestra los datos reales y los filtros modifican los KPI;
   - `/docs` está disponible para verificar el contrato de la API;
   - una predicción real llega al backend;
   - la validación CSV responde sin persistir el archivo;
   - el frontend carga, muestra datos y maneja errores de API.
5. Si faltan permisos, proyecto de Google Cloud, facturación o autorización,
   detalla exactamente cuál paso manual impide desplegar. No informes que está
   desplegado ni inventes una URL hasta completar y comprobar las pruebas
   anteriores.

### 6. Calidad, seguridad y ramas

- Conserva los contratos actuales de API; cualquier cambio debe actualizar
  frontend, backend, pruebas, README y auditoría.
- Mantén `/`, `/index.html`, `/dashboard.html`, `/docs` y las rutas de API
  funcionando. La entrega conserva una sola implementación backend: FastAPI.
- Ejecuta las pruebas, compilación y verificaciones disponibles antes de
  publicar.
- No sobrescribas ni reescribas el historial de Git. Resume los cambios y
  publica mediante el flujo de rama o revisión disponible. Mantén `main` y
  `production` sincronizadas solo después de comprobar que contienen el mismo
  paquete validado.
- Deja un solo `README.md` dentro de `Entregable_Final_ShopPredict/`.
- Actualiza `README.md` y `AUDITORIA.md` con los pasos, limitaciones, resultados
  de pruebas y URL real del despliegue. No afirmes capacidades no verificadas.

### 7. Informe final obligatorio

Al terminar, informa:

1. URL pública del frontend y URL de la API en producción.
2. Qué rutas y funcionalidades probaste en producción.
3. Qué cambios hiciste y en qué rama quedaron.
4. Qué pruebas locales y de producción pasaron o fallaron.
5. Qué pasos siguen pendientes, si no pudiste desplegar.

Distingue siempre entre **preparado**, **probado localmente** y
**desplegado y comprobado en producción**.
