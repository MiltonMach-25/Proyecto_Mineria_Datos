# Instrucciones del repositorio para GitHub Copilot en Visual Studio Code

Eres el asistente técnico encargado de preparar, ejecutar, verificar y empaquetar **ShopPredict · Intención de Compra** (UNIMINUTO Ingeniería de Sistemas · Ibagué · 2026) cuando el usuario descomprima el proyecto en Visual Studio Code.

## 1. Flujo automático cuando el usuario pida iniciar, mostrar o sustentar

Si el usuario te dice algo como *"encárgate de dejar esto listo para mostrar en Edge"*, *"ábrelo para sustentar"* o *"ejecuta el proyecto"*, ejecuta en orden sin inventar pasos extra:

1. Verifica si existe `node_modules/`; si no existe, ejecuta `npm install`.
2. Ejecuta `npm test` y verifica que pasen las **6 pruebas unitarias**.
3. Ejecuta `npm run lint` y `npm run build` para generar `Entregable_Final_ShopPredict/dist/` y `dist/server.js`.
4. Inicia el servidor en puerto `3000` en segundo plano con `npm run dev` (o comprueba si `http://localhost:3000/health` ya responde `ready`).
5. Abre **Microsoft Edge** en Windows con:
   ```powershell
   Start-Process msedge "http://localhost:3000/index.html"
   Start-Process msedge "http://localhost:3000/"
   ```
6. Indica al usuario las 3 rutas listas:
   - Presentación (12 láminas): `http://localhost:3000/index.html`
   - Dashboard en vivo: `http://localhost:3000/`
   - Control API: `http://localhost:3000/docs`

## 2. Flujo automático cuando el usuario pida "volver a entregarlo" o "comprimirlo"

1. Antes de comprimir, ejecuta `npm test && npm run lint && npm run build`.
2. Limpia temporales (`.playwright-cli/` si existiera).
3. Nunca incluyas `node_modules/` ni `.git/` en el ZIP para que no pese demasiado ni falle al subir; deja compilado `Entregable_Final_ShopPredict/dist/` y `dist/` incluidos.
4. Genera el ZIP limpio en Windows (PowerShell):
   ```powershell
   $items = Get-ChildItem -Force | Where-Object { $_.Name -notin @('node_modules','.git','.playwright-cli','ShopPredict_Entrega_Final.zip') }
   Compress-Archive -Path $items.FullName -DestinationPath 'ShopPredict_Entrega_Final.zip' -Force
   ```

## 3. Reglas estrictas de integridad académica (NO MODIFICAR NI INVENTAR)

- **Marca:** `ShopPredict · Intención de Compra` (no añadir términos de IA al nombre comercial del sistema).
- **Datos oficiales:** `data/online_shoppers_intention.csv` (`12.330` filas, `18` cols, `0` nulos, `125` duplicados eliminados → `12.205` limpias, `1.908` compras = `15,63 %` deduplicado / `15,47 %` original).
- **Modelos medidos (holdout 80/20, semilla 42):**
  - Árbol de decisión: Acc `0,8574`, F1 `0,5561`, AUC `0,7407`
  - Random Forest (líder): Acc `0,9029`, Prec `0,7715`, Recall `0,5393`, Bal. Acc `0,7548`, F1 `0,6348`, AUC `0,9248`
  - Regresión logística (`StandardScaler`): Acc `0,8873`, F1 `0,5347`, AUC `0,8997`
- **Prohibido inventar métricas:** Naive Bayes, KNN y Clustering (K-means / jerárquico) deben permanecer estrictamente conceptuales sin porcentajes ni índices simulados.
- **Métodos Numéricos (`ProductRelated` vs `ProductRelated_Duration`):**
  - Regresión lineal: `ŷ = -0,857242 + 37,566054x` (auditada, `R² = 0,77093`, `RMSE = 844,436 s`) y CSV completo (`ŷ = 20,20 + 37,0342x`, `R² = 0,7402`, `RMSE = 978,4 s`).
  - Lagrange (`P₃`): 4 nodos exactos `(3,7718; 145,2464)`, `(12,2917; 489,1138)`, `(26,5391; 1044,8487)`, `(84,6620; 3098,1926)`.
- **Validación CSV (`/dataset/validate`):** siempre `persisted: false` (nunca sobrescribe ni guarda el CSV subido).
- **Presentación:** `Entregable_Final_ShopPredict/index.html` contiene **12 diapositivas** (portada, 8 de minería y arquitectura + 3 de métodos numéricos con fondo azul oscuro, fórmulas esenciales y gráficas interactivas).
