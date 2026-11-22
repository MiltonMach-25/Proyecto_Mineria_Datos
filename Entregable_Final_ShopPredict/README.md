# Entregable final · ShopPredict

## Arquitectura

- GitHub: código y documentación.
- Vercel: sitio estático y función `/api/stats`.
- Supabase: PostgreSQL y políticas RLS.
- Sin Google BigQuery ni Looker Studio.

## Contenido

- `index.html`: presentación final de 12 diapositivas.
- `dashboard.html`: dashboard preparado para Supabase.
- `api/stats.js`: consulta segura desde la función de Vercel.
- `supabase/schema.sql`: tablas y políticas.
- `supabase/seed_verified_results.sql`: métricas verificadas del proyecto.
- `supabase/import_csv.py`: carga reproducible sin duplicados.
- `data/online_shoppers_intention.csv`: copia entregable del dataset.
- `assets/`: evidencias, gráficos y logotipo.
- `AUDITORIA.md`: alcance, cifras y limitaciones.
- `HANDOFF.md`: instrucciones de continuidad.

## Presentación

La presentación conserva 12 láminas:

- 9 láminas de contexto, datos, metodología, modelos, clustering y despliegue.
- 3 láminas de regresión lineal y interpolación de Lagrange.

No depende de Internet para las imágenes y puede abrirse localmente:

```powershell
cd Entregable_Final_ShopPredict
python -m http.server 8080
```

Abrir `http://127.0.0.1:8080/index.html`.

## Configurar Supabase

1. Crear un proyecto en Supabase.
2. Ejecutar `supabase/schema.sql`.
3. Ejecutar `supabase/seed_verified_results.sql`.
4. Instalar el cliente:

```powershell
python -m pip install pandas supabase
```

5. Definir variables del cargador:

```powershell
$env:SUPABASE_URL="https://TU-PROYECTO.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="TU-CLAVE-SERVER"
python supabase/import_csv.py data/online_shoppers_intention.csv
```

No publiques `SUPABASE_SERVICE_ROLE_KEY` en GitHub, Vercel ni HTML.

## Configurar Vercel

Importar esta carpeta como proyecto de Vercel y configurar:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

La función `/api/stats` usa ambas variables. El navegador no recibe la clave de servicio.

Después:

```text
https://TU-URL.vercel.app/
https://TU-URL.vercel.app/dashboard.html
```

## Seguridad

- RLS habilitado en las tablas públicas.
- Políticas de lectura para `anon` y `authenticated`.
- Inserción controlada mediante clave de servicio desde el cargador local.
- Sin claves privadas dentro del repositorio.
- El CSV no contiene identificadores personales reales.
