import { query } from '../db.js';
import { classify, METRIC_LABELS, METRIC_UNITS, trend } from './health.js';

export const KINDS = ['blood_pressure', 'heart_rate', 'blood_sugar', 'weight'] as const;

/** Latest reading per kind with status + trend vs. the previous reading. */
export async function latestMetrics(seniorId: string) {
  const rows = await query<any>(`
    SELECT kind, value1, value2, recorded_at, row_number() OVER (PARTITION BY kind ORDER BY recorded_at DESC) AS rn
      FROM health_metrics WHERE senior_id=$1`, [seniorId]);
  return KINDS.flatMap((kind) => {
    const [cur, prev] = rows.filter((r) => r.kind === kind).sort((a, b) => a.rn - b.rn);
    if (!cur) return [];
    return [{ kind, label: METRIC_LABELS[kind], value1: cur.value1, value2: cur.value2, unit: METRIC_UNITS[kind], recordedAt: cur.recordedAt,
      status: classify(kind, cur.value1, cur.value2), trend: trend(cur.value1, prev?.value1) }];
  });
}

