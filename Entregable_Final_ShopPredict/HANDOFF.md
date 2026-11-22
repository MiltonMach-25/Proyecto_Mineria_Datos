# Handoff técnico · ShopPredict

## Estado entregado

Este paquete conserva:

- Presentación HTML de 12 diapositivas.
- 9 láminas de minería de datos y 3 de métodos numéricos.
- Dashboard HTML preparado para Supabase.
- SQL de tablas y RLS.
- Importador reproducible del CSV.
- Métricas verificadas en SQL.
- Evidencias originales y logotipo del proyecto.
- Lámina de sesión 8 ampliada con representaciones visuales de Árbol, Naive Bayes y KNN.
- Nombre visible simplificado a ShopPredict, sin “AI” en la presentación y el dashboard.

## Estado no entregado

No se puede afirmar una conexión real hasta recibir:

- URL del proyecto Supabase.
- Clave anónima para Vercel.
- Clave de servicio para carga local.
- Proyecto Vercel o autorización de despliegue.

No se han creado credenciales ni secretos en GitHub.

## Siguiente configuración

1. Crear proyecto Supabase.
2. Ejecutar `supabase/schema.sql`.
3. Ejecutar `supabase/seed_verified_results.sql`.
4. Ejecutar el importador local.
5. Importar la carpeta en Vercel.
6. Configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY`.
7. Verificar `/api/stats`.
8. Abrir `/dashboard.html`.
9. Probar presentación y dashboard públicamente.

## Acciones de GitHub

Crear rama:

```powershell
git checkout -b production
git add Entregable_Final_ShopPredict
git commit -m "feat: publicar entregable final de ShopPredict"
git push -u origin production
```

No subir claves ni archivos `.env`.

## Criterio de continuidad

Para continuar en otro chat:

```text
Continúa desde Entregable_Final_ShopPredict.
Conserva exactamente 12 diapositivas:
9 de ShopPredict/minería y 3 de métodos numéricos.
La arquitectura debe ser GitHub → Vercel → Supabase.
No reinstalación ni mención de BigQuery o Looker.
No inventar datos, resultados, conexiones ni despliegues.
Usa AUDITORIA.md y los archivos verificados.
```
