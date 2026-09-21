export type MetricKind = 'blood_pressure' | 'heart_rate' | 'blood_sugar' | 'weight';
export type MetricStatus = 'normal' | 'elevated' | 'high' | 'low' | 'recorded';

/**
 * Coarse, informational bands (AHA blood-pressure categories; resting HR 50–100; glucose read as a
 * general/random reading). This labels a number for the UI — it is NOT a diagnosis, and the copy
 * shown to users always says to confirm with a clinician.
 */
export function classify(kind: MetricKind, v1: number, v2?: number | null): MetricStatus {
  switch (kind) {
    case 'blood_pressure': {
      const d = v2 ?? 0;
      if (v1 >= 140 || d >= 90) return 'high';
      if (v1 >= 130 || d >= 80) return 'elevated';
      if (v1 < 90 || (v2 != null && d < 60)) return 'low';
      return 'normal';
    }
    case 'heart_rate': return v1 > 100 ? 'high' : v1 < 50 ? 'low' : 'normal';
    case 'blood_sugar': return v1 > 180 ? 'high' : v1 > 140 ? 'elevated' : v1 < 70 ? 'low' : 'normal';
    default: return 'recorded';
  }
}

export function trend(latest: number, previous?: number | null): 'up' | 'down' | 'stable' {
  if (previous == null || previous === 0) return 'stable';
  const change = (latest - previous) / previous;
  return change > 0.03 ? 'up' : change < -0.03 ? 'down' : 'stable';
}

export const METRIC_UNITS: Record<MetricKind, string> = { blood_pressure: 'mmHg', heart_rate: 'bpm', blood_sugar: 'mg/dL', weight: 'kg' };
export const METRIC_LABELS: Record<MetricKind, string> = { blood_pressure: 'Blood Pressure', heart_rate: 'Heart Rate', blood_sugar: 'Blood Sugar', weight: 'Weight' };
