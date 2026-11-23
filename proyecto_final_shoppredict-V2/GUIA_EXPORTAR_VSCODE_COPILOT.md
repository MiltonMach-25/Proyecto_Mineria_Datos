# Guía rápida: Exportar a ZIP, abrir en VS Code con Copilot, sustentar en Edge y volver a entregar

---

## 1. Ver ahora mismo en Microsoft Edge (sin instalar nada)

Copia y pega cualquiera de estos enlaces directamente en la barra de direcciones de **Microsoft Edge**:

- **Presentación (12 láminas · ágil para 10 min):**  
  `https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/index.html`
- **Dashboard interactivo completo:**  
  `https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/`
- **Control interactivo de API (`/docs`):**  
  `https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/docs`

*(Enlace compartido de vista previa: `https://ais-pre-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app`)*

---

## 2. Exportar, comprimir en ZIP, descomprimir y usar en Visual Studio Code

1. **Exportar / Comprimir a ZIP:** descarga/exporta el proyecto completo (si ya tienes la carpeta, comprímela a `.zip` sin `node_modules`).
2. **Descomprimir en Windows:** haz clic derecho sobre el `.zip` → **Extraer todo...** en una ruta corta (por ejemplo `C:\ShopPredict`).
3. **Opción ultra rápida (doble clic sin escribir nada):** haz doble clic en **`ABRIR_EN_EDGE.bat`** dentro de la carpeta. Automáticamente instala si falta algo, enciende `http://localhost:3000` y abre **Microsoft Edge** con la presentación y el dashboard.
4. **Opción Visual Studio Code + GitHub Copilot:**
   - Abre Visual Studio Code → **Archivo → Abrir carpeta...** y selecciona la carpeta descomprimida.
   - El repositorio ya trae **`.github/copilot-instructions.md`** y **`.vscode/launch.json`**, así que Copilot ya conoce todas las reglas y comandos del proyecto.
   - Abre el chat de Copilot (`Ctrl + Alt + I`) y pégale cualquiera de estos dos prompts:

### Prompt 1 · Para que Copilot deje todo corriendo y lo abra en Edge antes de sustentar

> *"Lee `.github/copilot-instructions.md` y encárgate de dejar ShopPredict listo para sustentar: instala dependencias si faltan, corre las pruebas y el build, levanta el servidor en el puerto 3000 y abre la presentación (`/index.html`) y el dashboard (`/`) en Microsoft Edge. Confírmame cuando esté listo y no inventes métricas."*

### Prompt 2 · Al terminar, para que Copilot verifique y genere el ZIP limpio de entrega final

> *"Lee `.github/copilot-instructions.md`, verifica `npm test`, `npm run lint` y `npm run build`, limpia archivos temporales y ejecuta la tarea/comando para generar `ShopPredict_Entrega_Final.zip` listo para entregar (sin `node_modules` ni `.git`)."*

*(También puedes presionar **`F5`** en VS Code para ejecutar `Iniciar ShopPredict + Abrir en Edge` sin usar el chat).*

---

## 3. Orden sugerido en Microsoft Edge durante la sustentación

1. **`http://localhost:3000/index.html`** → Recorrer las **12 láminas**:
   - **Láminas 1–9:** Portada + Minería de datos (deduplicación, pipeline, EDA, Árbol, Sesión 8, Random Forest `F1 = 0,6348`, Clustering, Arquitectura).
   - **Láminas 10–12:** Métodos Numéricos con fondo azul oscuro (Regresión lineal con fórmulas `m`, `b` y gráfica; Interpolación de Lagrange con 4 nodos y `Lᵢ(x)`; Comparación final).
2. Botón **`← Volver al Dashboard`** (esquina inferior izquierda) → Mostrar en vivo en Edge:
   - **Resumen:** filtrar por `Nov` + `Returning_Visitor` (el `F1 = 0,6348` global no cambia).
   - **Predicción:** `Perfil mediana` → Sin compra; `Perfil compra probable` → Compra.
   - **Validar CSV:** demostrar validación sin persistencia (`persisted: false`).
   - **Metodología:** abrir **«Salvavidas ante el jurado»** si hacen una pregunta rápida.
   - **Contrato API (`/docs`):** mostrar endpoints y OpenAPI en vivo.
