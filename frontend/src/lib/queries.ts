import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, post } from './api';

// ───────── DTOs (mirror the backend responses) ─────────
export interface Metric { kind: 'blood_pressure' | 'heart_rate' | 'blood_sugar' | 'weight'; label: string; value1: number; value2: number | null; unit: string; recordedAt: string; status: 'normal' | 'elevated' | 'high' | 'low' | 'recorded'; trend: 'up' | 'down' | 'stable' }
export interface Dose { medicationId: string; name: string; dosage: string; purpose: string | null; reminder: boolean; time: string; status: 'taken' | 'skipped' | 'missed' | 'upcoming' | 'scheduled'; takenAt: string | null }
export interface Medication { id: string; name: string; dosage: string; purpose: string | null; scheduleTimes: string[]; reminder: boolean; stockRemaining: number; stockTotal: number; refillDate: string | null; stockStatus: 'good' | 'low' | 'critical' }
export interface Adherence { thisWeek: number | null; thisMonth: number | null; onTime: number | null; missedThisWeek: number; dosesThisWeek: number }
export interface DashboardData { metrics: Metric[]; medications: { total: number; taken: number; missed: number; next: Dose | null }; upcoming: { startsAt: string; title: string; type: string; location: string }[]; points: number }
export interface DigestContent { headline: string; summary: string; highlights: string[]; tip: string; attention: string[] }
export interface Digest { kind: 'daily' | 'family_weekly'; locale: 'en' | 'bn'; source: string; cached: boolean; content: DigestContent; facts: { dosesToday: number; dosesTaken: number; dosesMissed: number; adherenceThisWeek: number | null; missedThisWeek: number } }
export interface Recommendation { id: string; type: 'meal' | 'plan' | 'event' | 'caregiver'; title: string; subtitle: string; score: number; reason: string }

export const keys = {
  dashboard: ['dashboard'] as const, dosesToday: ['meds', 'today'] as const, meds: ['meds', 'list'] as const, adherence: ['meds', 'adherence'] as const,
  digest: (kind: string, locale: string) => ['ai', 'digest', kind, locale] as const,
  recs: (type: string, locale: string) => ['ai', 'recs', type, locale] as const,
};

export const useDashboard = () => useQuery({ queryKey: keys.dashboard, queryFn: () => get<DashboardData>('/dashboard') });
export const useDosesToday = () => useQuery({ queryKey: keys.dosesToday, queryFn: () => get<{ doses: Dose[] }>('/medications/today').then((r) => r.doses), refetchInterval: 60_000 });
export const useMedications = () => useQuery({ queryKey: keys.meds, queryFn: () => get<{ medications: Medication[] }>('/medications').then((r) => r.medications) });
export const useAdherence = () => useQuery({ queryKey: keys.adherence, queryFn: () => get<Adherence>('/medications/adherence') });
export const useDigest = (kind: 'daily' | 'family_weekly', locale: 'en' | 'bn') =>
  useQuery({ queryKey: keys.digest(kind, locale), queryFn: () => get<Digest>('/ai/digest', { kind, locale }), staleTime: 10 * 60_000 });
export const useRecommendations = (type: 'meals' | 'events' | 'caregivers', locale: 'en' | 'bn') =>
  useQuery({ queryKey: keys.recs(type, locale), queryFn: () => get<{ items: Recommendation[]; phrasedBy: 'ai' | 'template' }>('/ai/recommendations', { type, locale }), staleTime: 5 * 60_000 });

/** Mark a dose taken/skipped and refresh everything that shows medication state. */
export function useDoseAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, time, action }: { id: string; time: string; action: 'take' | 'skip' }) =>
      post<{ alreadyLogged: boolean; pointsAwarded: number }>(`/medications/${id}/${action}`, { time }),
    onSuccess: () => {
      for (const k of [keys.dosesToday, keys.meds, keys.adherence, keys.dashboard, ['meds', 'history'], ['rewards']]) qc.invalidateQueries({ queryKey: k as unknown as string[] });
    },
  });
}
