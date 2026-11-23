import type { CleanRow } from './models.js';

const MONTH_ORDER = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'June',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

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

export interface ComputedStats {
  total: number;
  purchases: number;
  conversion: number | null;
  avg_duration: number | null;
  breakdown: StatsBreakdown;
}

export function computeFilteredStats(
  rows: CleanRow[],
  month: string | null,
  visitorType: string | null
): ComputedStats {
  let total = 0;
  let purchases = 0;
  let durationSum = 0;
  let pageValuesSum = 0;
  let bounceSum = 0;
  let exitSum = 0;
  let productRelatedSum = 0;

  let zeroTotal = 0;
  let zeroPurchases = 0;
  let posTotal = 0;
  let posPurchases = 0;

  let wkndTotal = 0;
  let wkndPurchases = 0;
  let wkdayTotal = 0;
  let wkdayPurchases = 0;

  const monthMap = new Map<string, { total: number; purchases: number; durationSum: number }>();
  const visitorMap = new Map<string, { total: number; purchases: number; durationSum: number }>();

  for (const row of rows) {
    if (month && row.categorical['Month'] !== month) continue;
    if (visitorType && row.categorical['VisitorType'] !== visitorType) continue;

    total++;
    if (row.revenue) purchases++;

    const duration = row.numeric['ProductRelated_Duration'] ?? 0;
    const pv = row.numeric['PageValues'] ?? 0;
    durationSum += duration;
    pageValuesSum += pv;
    bounceSum += row.numeric['BounceRates'] ?? 0;
    exitSum += row.numeric['ExitRates'] ?? 0;
    productRelatedSum += row.numeric['ProductRelated'] ?? 0;

    if (pv > 0) {
      posTotal++;
      if (row.revenue) posPurchases++;
    } else {
      zeroTotal++;
      if (row.revenue) zeroPurchases++;
    }

    if ((row.numeric['Weekend'] ?? 0) === 1) {
      wkndTotal++;
      if (row.revenue) wkndPurchases++;
    } else {
      wkdayTotal++;
      if (row.revenue) wkdayPurchases++;
    }

    const rowMonth = row.categorical['Month'] || 'N/D';
    const mBucket = monthMap.get(rowMonth) ?? { total: 0, purchases: 0, durationSum: 0 };
    mBucket.total++;
    if (row.revenue) mBucket.purchases++;
    mBucket.durationSum += duration;
    monthMap.set(rowMonth, mBucket);

    const rowVisitor = row.categorical['VisitorType'] || 'N/D';
    const vBucket = visitorMap.get(rowVisitor) ?? { total: 0, purchases: 0, durationSum: 0 };
    vBucket.total++;
    if (row.revenue) vBucket.purchases++;
    vBucket.durationSum += duration;
    visitorMap.set(rowVisitor, vBucket);
  }

  const by_month: MonthStatBucket[] = [...monthMap.entries()]
    .sort((a, b) => {
      const ia = MONTH_ORDER.indexOf(a[0]);
      const ib = MONTH_ORDER.indexOf(b[0]);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a[0].localeCompare(b[0]);
    })
    .map(([m, b]) => ({
      month: m,
      total: b.total,
      purchases: b.purchases,
      conversion: b.total > 0 ? b.purchases / b.total : null,
      avg_duration: b.total > 0 ? b.durationSum / b.total : null,
    }));

  const by_visitor: VisitorStatBucket[] = [...visitorMap.entries()]
    .sort((a, b) => b[1].total - a[1].total)
    .map(([v, b]) => ({
      visitor_type: v,
      total: b.total,
      purchases: b.purchases,
      conversion: b.total > 0 ? b.purchases / b.total : null,
      avg_duration: b.total > 0 ? b.durationSum / b.total : null,
    }));

  const by_weekend: WeekendStatBucket[] = [
    {
      weekend: false,
      label: 'Entre semana',
      total: wkdayTotal,
      purchases: wkdayPurchases,
      conversion: wkdayTotal > 0 ? wkdayPurchases / wkdayTotal : null,
    },
    {
      weekend: true,
      label: 'Fin de semana',
      total: wkndTotal,
      purchases: wkndPurchases,
      conversion: wkndTotal > 0 ? wkndPurchases / wkndTotal : null,
    },
  ];

  return {
    total,
    purchases,
    conversion: total > 0 ? purchases / total : null,
    avg_duration: total > 0 ? durationSum / total : null,
    breakdown: {
      by_month,
      by_visitor,
      by_weekend,
      page_values_signal: {
        zero_total: zeroTotal,
        zero_purchases: zeroPurchases,
        zero_conversion: zeroTotal > 0 ? zeroPurchases / zeroTotal : null,
        positive_total: posTotal,
        positive_purchases: posPurchases,
        positive_conversion: posTotal > 0 ? posPurchases / posTotal : null,
      },
      averages: {
        page_values: total > 0 ? pageValuesSum / total : null,
        bounce_rate: total > 0 ? bounceSum / total : null,
        exit_rate: total > 0 ? exitSum / total : null,
        product_related: total > 0 ? productRelatedSum / total : null,
      },
    },
  };
}
