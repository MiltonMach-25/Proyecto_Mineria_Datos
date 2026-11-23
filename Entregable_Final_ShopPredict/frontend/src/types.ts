export type ModelName =
  | 'Árbol de decisión'
  | 'Random Forest'
  | 'Regresión logística';

export interface HealthResponse {
  status: string;
  models_loaded: number;
}

export interface MetadataResponse {
  file: string;
  rows_loaded: number;
  rows_used: number;
  features: number;
  duplicates_removed: number;
  target: string;
  training: string;
  kaggle_source: string;
  uci_reference: string;
}

export interface ModelMetric {
  name: string;
  accuracy: number;
  balanced_accuracy?: number;
  precision?: number;
  recall?: number;
  f1: number;
  roc_auc?: number;
}

export interface MonthStatBucket {
  month: string;
  total: number;
  purchases: number;
  conversion: number | null;
  avg_duration: number | null;
}

export interface VisitorStatBucket {
  visitor_type: string;
  total: number;
  purchases: number;
  conversion: number | null;
  avg_duration: number | null;
}

export interface WeekendStatBucket {
  weekend: boolean;
  label: string;
  total: number;
  purchases: number;
  conversion: number | null;
}

export interface StatsBreakdown {
  by_month: MonthStatBucket[];
  by_visitor: VisitorStatBucket[];
  by_weekend: WeekendStatBucket[];
  page_values_signal: {
    zero_total: number;
    zero_purchases: number;
    zero_conversion: number | null;
    positive_total: number;
    positive_purchases: number;
    positive_conversion: number | null;
  };
  averages: {
    page_values: number | null;
    bounce_rate: number | null;
    exit_rate: number | null;
    product_related: number | null;
  };
}

export interface StatsResponse {
  total: number;
  purchases: number;
  conversion: number | null;
  avg_duration: number | null;
  filters: {
    month: string | null;
    visitor_type: string | null;
  };
  metrics_scope: string;
  models: ModelMetric[];
  breakdown?: StatsBreakdown;
}

export interface NumericRange {
  minimum: number;
  maximum: number;
  median: number;
}

export interface SchemaResponse {
  target: string;
  features: string[];
  numeric_features: string[];
  categorical_features: string[];
  categorical_options: Record<string, string[]>;
  numeric_ranges: Record<string, NumericRange>;
  models: ModelName[];
}

export interface PredictionResponse {
  model: string;
  revenue: boolean;
  label: string;
  probability_purchase: number;
  note: string;
}

export interface DatasetValidationResponse {
  valid: boolean;
  rows: number;
  columns: number;
  duplicates: number;
  missing_columns: string[];
  extra_columns: string[];
  issues: string[];
  persisted: boolean;
}
