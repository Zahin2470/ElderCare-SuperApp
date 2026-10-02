import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSeniorScope } from '../components/auth/AuthContext';
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

// Every key below ends with `seniorId` (undefined for a senior's own account) so that switching
// which linked senior a family member is viewing automatically refetches — and so invalidating a
// prefix like ['meds'] still matches every senior's variant of that query.
export const keys = {
  dashboard: (seniorId?: string) => ['dashboard', seniorId] as const,
  dosesToday: (seniorId?: string) => ['meds', 'today', seniorId] as const,
  meds: (seniorId?: string) => ['meds', 'list', seniorId] as const,
  adherence: (seniorId?: string) => ['meds', 'adherence', seniorId] as const,
  digest: (kind: string, locale: string, seniorId?: string) => ['ai', 'digest', kind, locale, seniorId] as const,
  recs: (type: string, locale: string, seniorId?: string) => ['ai', 'recs', type, locale, seniorId] as const,
};

export const useDashboard = () => {
  const scope = useSeniorScope();
  return useQuery({ queryKey: keys.dashboard(scope.seniorId), queryFn: () => get<DashboardData>('/dashboard', scope) });
};
export const useDosesToday = () => {
  const scope = useSeniorScope();
  return useQuery({ queryKey: keys.dosesToday(scope.seniorId), queryFn: () => get<{ doses: Dose[] }>('/medications/today', scope).then((r) => r.doses), refetchInterval: 60_000 });
};
export const useMedications = () => {
  const scope = useSeniorScope();
  return useQuery({ queryKey: keys.meds(scope.seniorId), queryFn: () => get<{ medications: Medication[] }>('/medications', scope).then((r) => r.medications) });
};
export const useAdherence = () => {
  const scope = useSeniorScope();
  return useQuery({ queryKey: keys.adherence(scope.seniorId), queryFn: () => get<Adherence>('/medications/adherence', scope) });
};
export const useDigest = (kind: 'daily' | 'family_weekly', locale: 'en' | 'bn') => {
  const scope = useSeniorScope();
  return useQuery({ queryKey: keys.digest(kind, locale, scope.seniorId), queryFn: () => get<Digest>('/ai/digest', { kind, locale, ...scope }), staleTime: 10 * 60_000 });
};
export const useRecommendations = (type: 'meals' | 'events' | 'caregivers', locale: 'en' | 'bn') => {
  const scope = useSeniorScope();
  return useQuery({ queryKey: keys.recs(type, locale, scope.seniorId), queryFn: () => get<{ items: Recommendation[]; phrasedBy: 'ai' | 'template' }>('/ai/recommendations', { type, locale, ...scope }), staleTime: 5 * 60_000 });
};

/** Mark a dose taken/skipped and refresh everything that shows medication state. */
export function useDoseAction() {
  const qc = useQueryClient();
  const scope = useSeniorScope();
  return useMutation({
    mutationFn: ({ id, time, action }: { id: string; time: string; action: 'take' | 'skip' }) =>
      post<{ alreadyLogged: boolean; pointsAwarded: number }>(`/medications/${id}/${action}`, { time }, scope),
    onSuccess: () => {
      // Prefix-invalidate: matches every senior's cached variant of each key, not just the current one.
      for (const k of [['meds', 'today'], ['meds', 'list'], ['meds', 'adherence'], ['meds', 'history'], ['dashboard'], ['rewards']]) qc.invalidateQueries({ queryKey: k });
    },
  });
}
