insert into public.model_metrics
  (name, accuracy, balanced_accuracy, precision, recall, f1, roc_auc)
values
  ('Árbol de decisión', 0.8574354772634166, 0.740658429726218,
   0.5422885572139303, 0.5706806282722513, 0.5561224489795918,
   0.740658429726218),
  ('Random Forest', 0.9029086439983613, 0.7548204918262055,
   0.7715355805243446, 0.5392670157068062, 0.6348228043143297,
   0.9247900292166431),
  ('Regresión logística', 0.8873412535845965, 0.6944216299784626,
   0.7559808612440191, 0.41361256544502617, 0.5346869712351946,
   0.899735295688193)
on conflict (name) do update set
  accuracy = excluded.accuracy,
  balanced_accuracy = excluded.balanced_accuracy,
  precision = excluded.precision,
  recall = excluded.recall,
  f1 = excluded.f1,
  roc_auc = excluded.roc_auc;

insert into public.confusion_matrices
  (model_name, true_negative, false_positive, false_negative, true_positive)
values
  ('Random Forest', 1998, 61, 176, 206)
on conflict (model_name) do update set
  true_negative = excluded.true_negative,
  false_positive = excluded.false_positive,
  false_negative = excluded.false_negative,
  true_positive = excluded.true_positive;
