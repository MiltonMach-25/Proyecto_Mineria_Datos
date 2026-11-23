import { RefreshCw } from 'lucide-react';

export type ActiveTab = 'resumen' | 'prediccion' | 'validar-csv' | 'metodologia';

interface HeaderBarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const NAV_ITEMS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'prediccion', label: 'Predicción' },
  { id: 'validar-csv', label: 'Validar CSV' },
  { id: 'metodologia', label: 'Metodología' },
];

export function HeaderBar({
  activeTab,
  onSelectTab,
  onRefresh,
  isRefreshing,
}: HeaderBarProps) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:gap-8 lg:px-8">
        {/* Zone 1: Single-line brand mark */}
        <a
          href="/"
          className="flex shrink-0 items-center gap-2.5 text-base font-bold tracking-tight text-slate-900 whitespace-nowrap focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <img
            src="/assets/shopredict-logo.png"
            alt="Logotipo de ShopPredict"
            className="h-8 w-8 object-contain"
            referrerPolicy="no-referrer"
          />
          <span className="font-display">ShopPredict · Intención de Compra</span>
        </a>

        {/* Zone 2: Concise single-line navigation */}
        <nav
          aria-label="Navegación principal"
          className="order-3 flex w-full items-center gap-5 overflow-x-auto text-sm font-medium md:order-2 md:w-auto"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`shrink-0 whitespace-nowrap border-b-2 py-1.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600 ${
                  isActive
                    ? 'border-indigo-600 font-semibold text-indigo-700'
                    : 'border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
          <a
            href="/index.html"
            className="shrink-0 whitespace-nowrap border-b-2 border-transparent py-1.5 text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-indigo-600"
          >
            Presentación
          </a>
        </nav>

        {/* Zone 3: Single primary action */}
        <div className="order-2 shrink-0 md:order-3">
          <button
            type="button"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-wait disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            <RefreshCw
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar datos'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
