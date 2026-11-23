import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileWarning,
  ShieldAlert,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { validateCsvFile } from '../api';
import type { DatasetValidationResponse } from '../types';
import { formatCount } from '../utils/formatters';

type SimulationKind =
  | 'missing-columns'
  | 'bad-types-short'
  | 'extra-and-dups'
  | 'valid-sample';

const FULL_HEADER =
  'Administrative,Administrative_Duration,Informational,Informational_Duration,ProductRelated,ProductRelated_Duration,BounceRates,ExitRates,PageValues,SpecialDay,Month,OperatingSystems,Browser,Region,TrafficType,VisitorType,Weekend,Revenue';

function buildSyntheticCsvFile(kind: SimulationKind): File {
  if (kind === 'missing-columns') {
    const header = 'Administrative,ProductRelated,Month,VisitorType,Weekend';
    const rows = Array.from(
      { length: 12 },
      (_, i) => `${i % 4},${10 + i},Nov,Returning_Visitor,${i % 2 === 0 ? 'TRUE' : 'FALSE'}`
    );
    return new File([[header, ...rows].join('\n')], 'csv_invalido_columnas_faltantes.csv', {
      type: 'text/csv',
    });
  }

  if (kind === 'bad-types-short') {
    const rows = [
      '1,15,0,0,12,no_es_numero,0.01,0.02,0,0,Nov,2,2,1,2,Returning_Visitor,TalVez,TRUE',
      '0,0,0,0,4,120,0.05,0.08,0,0,May,1,1,1,1,New_Visitor,FALSE,FALSE',
      '2,35,1,10,18,640,0.01,0.02,12,0,Nov,2,2,3,2,Returning_Visitor,TRUE,TRUE',
      '0,0,0,0,3,85,0.02,0.04,0,0,Mar,1,1,1,1,New_Visitor,FALSE,FALSE',
      '1,10,0,0,8,240,0.01,0.03,0,0,Dec,2,2,1,2,Returning_Visitor,FALSE,TRUE',
    ];
    return new File([[FULL_HEADER, ...rows].join('\n')], 'csv_invalido_tipos_y_pocas_filas.csv', {
      type: 'text/csv',
    });
  }

  if (kind === 'extra-and-dups') {
    const header = `${FULL_HEADER},Session_ID`;
    const rowA = '2,45,0,0,18,620,0.005,0.015,24,0,Nov,2,2,1,2,Returning_Visitor,FALSE,TRUE,SES_001';
    const rowB = '0,0,0,0,5,110,0.02,0.04,0,0,May,1,1,1,1,New_Visitor,TRUE,FALSE,SES_002';
    const rows = [
      rowA,
      rowA,
      rowA,
      rowA,
      ...Array.from(
        { length: 8 },
        (_, i) =>
          `${i % 3},${20 + i},0,0,${8 + i},${180 + i * 25},0.01,0.02,${i % 2 === 0 ? 15 : 0},0,Nov,2,2,1,2,Returning_Visitor,${i % 2 === 0 ? 'TRUE' : 'FALSE'},${i % 2 === 0 ? 'TRUE' : 'FALSE'},SES_${10 + i}`
      ),
      rowB,
    ];
    return new File([[header, ...rows].join('\n')], 'csv_invalido_columna_extra_duplicados.csv', {
      type: 'text/csv',
    });
  }

  // valid-sample: 25 valid rows with both TRUE and FALSE classes
  const rows = Array.from({ length: 25 }, (_, i) => {
    const isBuy = i < 10;
    return [
      isBuy ? 3 : i % 2,
      isBuy ? 95 + i * 5 : i * 12,
      0,
      0,
      isBuy ? 24 + i : 6 + i,
      isBuy ? 1150 + i * 40 : 210 + i * 18,
      isBuy ? 0.004 : 0.025,
      isBuy ? 0.012 : 0.055,
      isBuy ? 38.5 : 0,
      0,
      isBuy ? 'Nov' : 'May',
      2,
      2,
      1,
      2,
      isBuy ? 'Returning_Visitor' : 'New_Visitor',
      i % 3 === 0 ? 'TRUE' : 'FALSE',
      isBuy ? 'TRUE' : 'FALSE',
    ].join(',');
  });
  return new File([[FULL_HEADER, ...rows].join('\n')], 'muestra_valida_25_filas.csv', {
    type: 'text/csv',
  });
}

export function CsvValidationView() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeCaseLabel, setActiveCaseLabel] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DatasetValidationResponse | null>(null);

  const runValidation = async (file: File, label?: string) => {
    setSelectedFile(file);
    setActiveCaseLabel(label ?? file.name);
    setIsValidating(true);
    setError(null);
    try {
      const response = await validateCsvFile(file);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo validar el CSV.');
      setResult(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleValidate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFile) {
      setError('Selecciona un archivo CSV o usa uno de los casos de prueba.');
      return;
    }
    await runValidation(selectedFile, selectedFile.name);
  };

  const uniqueRows = result ? Math.max(0, result.rows - result.duplicates) : 0;
  const dupPct = result && result.rows > 0 ? (result.duplicates / result.rows) * 100 : 0;
  const presentExpectedCols = result
    ? Math.max(0, 18 - result.missing_columns.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
            Validación e invalidación temporal de CSV
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Audita estructura, columnas requeridas, tipos numéricos y duplicados vía{' '}
            <code className="font-mono-tabular">POST /dataset/validate</code> (máximo 10 MB,{' '}
            <code className="font-mono-tabular">persisted: false</code>).
          </p>
        </div>

        <a
          href="/dataset/sample-csv"
          download="shoppredict_muestra_valida.csv"
          className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 transition-all hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/50"
        >
          <Download className="h-3.5 w-3.5 text-indigo-600" aria-hidden="true" />
          <span>Descargar muestra real (.csv)</span>
        </a>
      </div>

      {/* One-click CSV Invalidation & Validation Stress-Test Bench */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900">
              Banco interactivo de pruebas de rechazo y aceptación
            </h2>
            <p className="mt-0.5 text-xs text-slate-600">
              Pulsa cualquier escenario para generar un archivo CSV real en memoria y probar cómo el backend lo rechaza o aprueba.
            </p>
          </div>
          {activeCaseLabel && (
            <span className="font-mono-tabular rounded-lg border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-800">
              Evaluado: {activeCaseLabel}
            </span>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            disabled={isValidating}
            onClick={() =>
              void runValidation(
                buildSyntheticCsvFile('missing-columns'),
                'CSV inválido: columnas faltantes'
              )
            }
            className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm disabled:opacity-60"
          >
            <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-rose-950">Invalidar: faltan columnas</p>
              <p className="mt-0.5 text-[11px] text-rose-800">
                Omite PageValues, Revenue y 11 columnas requeridas.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={isValidating}
            onClick={() =>
              void runValidation(
                buildSyntheticCsvFile('bad-types-short'),
                'CSV inválido: texto en numérico y <10 filas'
              )
            }
            className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-rose-400 hover:bg-rose-50 hover:shadow-sm disabled:opacity-60"
          >
            <FileWarning className="mt-0.5 h-4 w-4 shrink-0 text-rose-700" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-rose-950">Invalidar: tipos y &lt;10 filas</p>
              <p className="mt-0.5 text-[11px] text-rose-800">
                Inserta texto en duración, Weekend erróneo y solo 5 filas.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={isValidating}
            onClick={() =>
              void runValidation(
                buildSyntheticCsvFile('extra-and-dups'),
                'CSV inválido: columna extra + duplicados'
              )
            }
            className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-amber-400 hover:bg-amber-50 hover:shadow-sm disabled:opacity-60"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-amber-950">Invalidar: col. extra y dups</p>
              <p className="mt-0.5 text-[11px] text-amber-800">
                Añade Session_ID no permitida y 3 filas repetidas.
              </p>
            </div>
          </button>

          <button
            type="button"
            disabled={isValidating}
            onClick={() =>
              void runValidation(
                buildSyntheticCsvFile('valid-sample'),
                'Muestra válida (25 filas reales)'
              )
            }
            className="flex cursor-pointer items-start gap-2.5 rounded-xl border border-teal-200 bg-teal-50/70 p-3 text-left transition-all hover:-translate-y-0.5 hover:border-teal-400 hover:bg-teal-50 hover:shadow-sm disabled:opacity-60"
          >
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-teal-950">Probar CSV válido (25 filas)</p>
              <p className="mt-0.5 text-[11px] text-teal-800">
                18 columnas exactas y clases Revenue True/False.
              </p>
            </div>
          </button>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <form
          onSubmit={handleValidate}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-5"
        >
          <div>
            <label
              htmlFor="csv-upload"
              className="block text-sm font-semibold text-slate-900"
            >
              Cargar archivo CSV propio
            </label>
            <p className="mt-1 text-xs text-slate-600">
              Arrastra un archivo o selecciónalo desde tu equipo para inspeccionar esquema y calidad.
            </p>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const dropped = e.dataTransfer.files?.[0] ?? null;
                if (dropped) {
                  setSelectedFile(dropped);
                  setActiveCaseLabel(dropped.name);
                  setError(null);
                }
              }}
              className={`mt-3 rounded-xl border-2 border-dashed p-5 transition-all ${
                isDragging
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50/30'
              }`}
            >
              <input
                id="csv-upload"
                type="file"
                accept=".csv,text/csv"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                  setActiveCaseLabel(file ? file.name : null);
                  setError(null);
                }}
                className="block w-full cursor-pointer text-sm text-slate-700 file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-indigo-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-indigo-700"
              />
              {selectedFile && (
                <p className="font-mono-tabular mt-3 flex items-center gap-1.5 text-xs text-slate-700">
                  <FileSpreadsheet className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                  <span>
                    {selectedFile.name} (
                    {Math.max(1, Math.round(selectedFile.size / 1024)).toLocaleString('es-CO')} KB)
                  </span>
                </p>
              )}
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-900"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-sm disabled:cursor-wait disabled:opacity-60"
          >
            <Upload className="h-4 w-4" aria-hidden="true" />
            <span>{isValidating ? 'Validando estructura...' : 'Validar CSV'}</span>
          </button>
        </form>

        <section
          aria-live="polite"
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-7"
        >
          <h2 className="font-display text-lg font-semibold text-slate-900">
            Informe visual de validación
          </h2>

          {result ? (
            <div data-testid="csv-validation-result" className="mt-4 space-y-4">
              <div
                className={`flex items-start gap-2.5 rounded-xl border p-3.5 text-sm ${
                  result.valid
                    ? 'border-teal-200 bg-teal-50 text-teal-950'
                    : 'border-red-200 bg-red-50 text-red-950'
                }`}
              >
                {result.valid ? (
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-teal-700" aria-hidden="true" />
                ) : (
                  <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-700" aria-hidden="true" />
                )}
                <div>
                  <p className="font-semibold">
                    {result.valid
                      ? 'CSV válido según el esquema del proyecto'
                      : 'CSV rechazado por observaciones de estructura o tipos'}
                  </p>
                  <p className="mt-0.5 text-xs">
                    Persistencia en servidor:{' '}
                    <span className="font-mono-tabular font-semibold">
                      persisted = {String(result.persisted)}
                    </span>{' '}
                    (archivo temporal; nunca reemplaza el dataset oficial).
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-600">Filas</p>
                  <p className="font-mono-tabular mt-1 text-xl font-bold text-slate-900">
                    {formatCount(result.rows)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-600">Columnas</p>
                  <p className="font-mono-tabular mt-1 text-xl font-bold text-slate-900">
                    {formatCount(result.columns)}
                  </p>
                </div>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-medium text-slate-600">Duplicados exactos</p>
                  <p className="font-mono-tabular mt-1 text-xl font-bold text-slate-900">
                    {formatCount(result.duplicates)}
                  </p>
                </div>
              </div>

              {/* Visual Breakdown Bars */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Cobertura del esquema</span>
                    <span className="font-mono-tabular text-indigo-700">
                      {presentExpectedCols} / 18 columnas
                    </span>
                  </div>
                  <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full rounded-full transition-all ${
                        presentExpectedCols === 18 ? 'bg-teal-600' : 'bg-rose-600'
                      }`}
                      style={{ width: `${(presentExpectedCols / 18) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-700">Integridad de filas</span>
                    <span className="font-mono-tabular text-slate-800">
                      {formatCount(uniqueRows)} únicas · {formatCount(result.duplicates)} dups
                    </span>
                  </div>
                  <div className="mt-2 flex h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full bg-indigo-600"
                      style={{ width: `${100 - dupPct}%` }}
                    />
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${dupPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {result.missing_columns.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50/60 p-3">
                  <h3 className="text-xs font-semibold text-red-900">
                    Columnas faltantes ({result.missing_columns.length})
                  </h3>
                  <p className="font-mono-tabular mt-1 text-xs text-red-800">
                    {result.missing_columns.join(', ')}
                  </p>
                </div>
              )}

              {result.extra_columns.length > 0 && (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
                  <h3 className="text-xs font-semibold text-amber-900">
                    Columnas no esperadas ({result.extra_columns.length})
                  </h3>
                  <p className="font-mono-tabular mt-1 text-xs text-amber-800">
                    {result.extra_columns.join(', ')}
                  </p>
                </div>
              )}

              {result.issues.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-white p-3">
                  <h3 className="text-xs font-semibold text-slate-800">
                    Detalle de observaciones detectadas por el backend
                  </h3>
                  <ul className="mt-1.5 list-disc space-y-1 pl-5 text-xs text-red-800">
                    {result.issues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Selecciona un archivo CSV o utiliza los botones superiores de prueba para observar la respuesta real de{' '}
              <span className="font-semibold">POST /dataset/validate</span>.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
