import { Users } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

/**
 * Lets a family member switch which linked senior every per-senior screen (Dashboard, SilverBox,
 * Care360, TeleHealth, ElderLink, NutriSenior, AI assistant/digest/recommendations) shows.
 * Renders nothing for a senior's own account, and a plain label (no picker) when there's only
 * one linked senior — a dropdown of one option would just be noise.
 */
export function SeniorSwitcher({ className = '' }: { className?: string }) {
  const { user, linkedSeniors, selectedSeniorId, selectSenior, isLoadingLinkedSeniors } = useAuth();
  if (user?.role !== 'family' || isLoadingLinkedSeniors || linkedSeniors.length === 0) return null;

  if (linkedSeniors.length === 1) {
    return <p className={`text-xs text-gray-600 flex items-center gap-1 ${className}`}><Users className="w-3.5 h-3.5" aria-hidden />Caring for: {linkedSeniors[0].fullName}</p>;
  }

  return (
    <label className={`block text-xs text-gray-600 ${className}`}>
      <span className="flex items-center gap-1 mb-1"><Users className="w-3.5 h-3.5" aria-hidden />Caring for</span>
      <select
        aria-label="Choose which person you're viewing"
        value={selectedSeniorId ?? ''}
        onChange={(e) => selectSenior(e.target.value)}
        className="w-full h-9 rounded-md border px-2 bg-white text-sm text-gray-900"
      >
        {linkedSeniors.map((s) => <option key={s.id} value={s.id}>{s.fullName}{s.relation ? ` (${s.relation})` : ''}</option>)}
      </select>
    </label>
  );
}
