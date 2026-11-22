export default async function handler(request) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY;
  if (!url || !key) {
    return new Response(JSON.stringify({ error: "Supabase no configurado" }), {
      status: 503,
      headers: { "content-type": "application/json" }
    });
  }

  const headers = {
    apikey: key,
    authorization: `Bearer ${key}`,
    accept: "application/json"
  };

  try {
    const base = url.replace(/\/$/, "");
    const [sessions, models] = await Promise.all([
      fetch(`${base}/rest/v1/shoppredict_sessions?select=revenue,product_related_duration`, { headers }),
      fetch(`${base}/rest/v1/model_metrics?select=name,accuracy,f1,precision,recall,balanced_accuracy,roc_auc&order=f1.desc`, { headers })
    ]);

    if (!sessions.ok || !models.ok) {
      throw new Error("No fue posible consultar las tablas de Supabase");
    }

    const rows = await sessions.json();
    const modelRows = await models.json();
    const total = rows.length;
    const purchases = rows.filter(row => row.revenue === true || row.revenue === 1).length;
    const durations = rows.map(row => Number(row.product_related_duration)).filter(Number.isFinite);
    const avgDuration = durations.length ? durations.reduce((sum, value) => sum + value, 0) / durations.length : 0;

    return new Response(JSON.stringify({
      total,
      purchases,
      conversion: total ? purchases / total : 0,
      avg_duration: avgDuration,
      models: modelRows.map(row => ({
        name: row.name,
        accuracy: row.accuracy,
        f1: row.f1,
        precision: row.precision,
        recall: row.recall,
        balanced_accuracy: row.balanced_accuracy,
        roc_auc: row.roc_auc
      }))
    }), { status: 200, headers: { "content-type": "application/json", "cache-control": "no-store" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 502,
      headers: { "content-type": "application/json" }
    });
  }
}
