create table if not exists public.shoppredict_sessions (
  row_hash text primary key,
  administrative integer,
  administrative_duration double precision,
  informational integer,
  informational_duration double precision,
  product_related integer,
  product_related_duration double precision,
  bounce_rates double precision,
  exit_rates double precision,
  page_values double precision,
  special_day double precision,
  month text,
  operating_systems integer,
  browser integer,
  region integer,
  traffic_type integer,
  visitor_type text,
  weekend boolean,
  revenue boolean
);

create table if not exists public.model_metrics (
  name text primary key,
  accuracy double precision,
  balanced_accuracy double precision,
  precision double precision,
  recall double precision,
  f1 double precision,
  roc_auc double precision
);

create table if not exists public.confusion_matrices (
  model_name text primary key,
  true_negative integer,
  false_positive integer,
  false_negative integer,
  true_positive integer
);

create table if not exists public.cluster_profiles (
  cluster_id integer primary key,
  cluster_name text,
  sessions integer,
  avg_product_related double precision,
  avg_product_duration double precision,
  avg_bounce_rates double precision,
  avg_exit_rates double precision,
  avg_page_values double precision,
  purchase_rate double precision
);

create table if not exists public.session_predictions (
  row_hash text primary key references public.shoppredict_sessions(row_hash) on delete cascade,
  model_name text,
  predicted_revenue boolean,
  probability_purchase double precision
);

alter table public.shoppredict_sessions enable row level security;
alter table public.model_metrics enable row level security;
alter table public.confusion_matrices enable row level security;
alter table public.cluster_profiles enable row level security;
alter table public.session_predictions enable row level security;

create policy "public read sessions"
on public.shoppredict_sessions for select
to anon, authenticated
using (true);

create policy "public read model metrics"
on public.model_metrics for select
to anon, authenticated
using (true);

create policy "public read confusion matrices"
on public.confusion_matrices for select
to anon, authenticated
using (true);

create policy "public read cluster profiles"
on public.cluster_profiles for select
to anon, authenticated
using (true);

create policy "public read predictions"
on public.session_predictions for select
to anon, authenticated
using (true);
