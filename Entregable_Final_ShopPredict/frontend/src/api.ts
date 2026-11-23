import type {
  DatasetValidationResponse,
  HealthResponse,
  MetadataResponse,
  ModelMetric,
  ModelName,
  PredictionResponse,
  SchemaResponse,
  StatsResponse,
} from './types';

async function extractErrorDetail(response: Response): Promise<string> {
  let detail = `Error del servidor (${response.status}).`;
  try {
    const body = (await response.json()) as { detail?: string };
    if (body && typeof body.detail === 'string' && body.detail.trim()) {
      detail = body.detail;
    }
  } catch {
    // Keep fallback status error message
  }
  return detail;
}

export async function fetchHealth(): Promise<HealthResponse> {
  const response = await fetch('/health');
  if (!response.ok) throw new Error(await extractErrorDetail(response));
  return response.json() as Promise<HealthResponse>;
}

export async function fetchMetadata(): Promise<MetadataResponse> {
  const response = await fetch('/metadata');
  if (!response.ok) throw new Error(await extractErrorDetail(response));
  return response.json() as Promise<MetadataResponse>;
}

export async function fetchSchema(): Promise<SchemaResponse> {
  const response = await fetch('/schema');
  if (!response.ok) throw new Error(await extractErrorDetail(response));
  return response.json() as Promise<SchemaResponse>;
}

export async function fetchMetrics(): Promise<ModelMetric[]> {
  const response = await fetch('/metrics');
  if (!response.ok) throw new Error(await extractErrorDetail(response));
  return response.json() as Promise<ModelMetric[]>;
}

export async function fetchStats(params: {
  month?: string;
  visitorType?: string;
}): Promise<StatsResponse> {
  const query = new URLSearchParams();
  if (params.month) query.set('month', params.month);
  if (params.visitorType) query.set('visitor_type', params.visitorType);
  const qs = query.toString();
  const response = await fetch(`/stats${qs ? `?${qs}` : ''}`);
  if (!response.ok) throw new Error(await extractErrorDetail(response));
  return response.json() as Promise<StatsResponse>;
}

export async function submitPrediction(payload: {
  model: ModelName;
  features: Record<string, string | number | boolean>;
}): Promise<PredictionResponse> {
  const response = await fetch('/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) throw new Error(await extractErrorDetail(response));
  return response.json() as Promise<PredictionResponse>;
}

export async function validateCsvFile(
  file: File
): Promise<DatasetValidationResponse> {
  const form = new FormData();
  form.append('file', file);
  const response = await fetch('/dataset/validate', {
    method: 'POST',
    body: form,
  });
  if (!response.ok) throw new Error(await extractErrorDetail(response));
  return response.json() as Promise<DatasetValidationResponse>;
}
