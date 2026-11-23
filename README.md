# Proyecto de Minería de Datos · ShopPredict

Repositorio del proyecto **ShopPredict · Intención de Compra** y su entrega técnica final.

## 1. Acceso principal · Abrir desde Visual Studio Code o la carpeta del trabajo

El flujo principal de entrega está pensado para abrirse directamente desde la carpeta del proyecto o en **Visual Studio Code**:

1. **Presentación directa desde la carpeta:** abre [`Entregable_Final_ShopPredict/index.html`](./Entregable_Final_ShopPredict/index.html) con doble clic en cualquier navegador (17 láminas autónomas con justificación, gráficas y evidencias locales).
2. **Arranque automático en Windows + Microsoft Edge:** haz doble clic en [`ABRIR_EN_EDGE.bat`](./ABRIR_EN_EDGE.bat) o revisa [`GUIA_EXPORTAR_VSCODE_COPILOT.md`](./GUIA_EXPORTAR_VSCODE_COPILOT.md) (incluye los prompts exactos para **GitHub Copilot** en VS Code y el empaquetado final en `.zip`).
3. **Sistema completo en Visual Studio Code (Dashboard + API + Presentación):** abre la carpeta del proyecto en VS Code, presiona `F5` (configuración incluida en `.vscode/launch.json`) o ejecuta en la terminal integrada:
   ```bash
   npm install && npm run build && npm run dev
   ```
   Luego abre en tu navegador local:
   - **Dashboard interactivo:** `http://localhost:3000/` (o `http://localhost:3000/dashboard.html`)
   - **Presentación técnica (17 láminas):** `http://localhost:3000/index.html`
   - **Control de API (`/docs`):** `http://localhost:3000/docs`

Toda la documentación técnica, dataset, auditoría, guion de sustentación y código del frontend está dentro de [`Entregable_Final_ShopPredict/`](./Entregable_Final_ShopPredict/). Empieza por el único README de la entrega: [`Entregable_Final_ShopPredict/README.md`](./Entregable_Final_ShopPredict/README.md).

---

## 2. Opción alternativa · Acceso web (entorno de desarrollo y despliegue en la nube)

Si deseas revisar la aplicación en línea sin abrir Visual Studio Code ni ejecutar el servidor localmente, puedes usar el **acceso web del entorno de desarrollo** o publicar tu propio servicio en Cloud Run:

> **Acceso web · Entorno de desarrollo (Google AI Studio):**
> - **Entorno de desarrollo (`dev`):** https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app
> - **Vista previa compartida (`preview`):** https://ais-pre-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app
> - *Nota:* estos enlaces pertenecen al **entorno de desarrollo / vista previa de Google AI Studio** donde se compiló y probó el proyecto (requieren acceso del entorno AI Studio; se ofrecen como **opción alternativa** al arranque local desde Visual Studio Code).
>
> **Enlace público permanente (Google Cloud Run propio):** `PENDIENTE_DE_PUBLICACION` — tras subir a GitHub, ejecuta `gcloud run deploy shoppredict --source .` desde tu cuenta de Google Cloud y reemplaza `URL_PUBLICA_CLOUD_RUN` con la URL `.run.app` generada.

| Recurso web | Entorno de desarrollo (opción alternativa) | Ruta al publicar en Cloud Run | Descripción |
|---|---|---|---|
| **Dashboard interactivo** | [Abrir Dashboard (`dev`)](https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/) · [Preview](https://ais-pre-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/) | `URL_PUBLICA_CLOUD_RUN/` | KPIs reales, filtros, simulador de 3 modelos y validación/invalidación CSV |
| **Presentación técnica** | [Abrir Presentación (`dev`)](https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/index.html) · [Preview](https://ais-pre-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/index.html) | `URL_PUBLICA_CLOUD_RUN/index.html` | Sustentación completa de 17 láminas con defensa ante jurado, gráficas y retorno al dashboard |
| **Control de API** | [Abrir Control API (`dev`)](https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/docs) · [Preview](https://ais-pre-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/docs) | `URL_PUBLICA_CLOUD_RUN/docs` | Consola interactiva OpenAPI y endpoints en vivo |
| **Salud del servicio** | [Ver `/health` (`dev`)](https://ais-dev-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/health) · [Preview](https://ais-pre-qoly54eogadnudoldqzznt-513240885441.us-west1.run.app/health) | `URL_PUBLICA_CLOUD_RUN/health` | Verificación `ready` y modelos cargados |
