import { Sparkles, AlertCircle, Lightbulb } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { useAuth } from '../auth/AuthContext';
import { useDigest } from '../../lib/queries';

/**
 * Personalised note generated from the person's own data (medications, readings, schedule).
 * The numbers shown as chips come from code; only the wording is written by the model, and the server
 * rejects any wording that contains a number it wasn't given.
 */
export function DailyDigestCard() {
  const { user } = useAuth();
  const locale = user?.locale ?? 'en';
  const kind = user?.role === 'family' ? 'family_weekly' : 'daily';
  const { data, isLoading, isError } = useDigest(kind, locale);

  if (isLoading) return <Card className="p-6 animate-pulse h-40" aria-busy="true" aria-label="Loading your summary" />;
  if (isError || !data) return null; // a summary is a nicety — never block the dashboard on it
  const { content, facts } = data;

  return (
    <Card className="p-6 border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-white to-blue-50">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" aria-hidden />
          <h2 className="text-gray-900">{content.headline}</h2>
        </div>
        <Badge variant="outline" className="text-xs whitespace-nowrap">{data.source === 'claude' ? 'AI-written' : 'Auto summary'}</Badge>
      </div>
      <p className="text-gray-700 mb-4">{content.summary}</p>

      <div className="flex flex-wrap gap-2 mb-4" aria-label="Key numbers">
        {kind === 'daily' ? (
          <Badge variant="secondary">💊 {facts.dosesTaken}/{facts.dosesToday} doses taken</Badge>
        ) : facts.adherenceThisWeek != null && <Badge variant="secondary">📈 {facts.adherenceThisWeek}% adherence this week</Badge>}
        {facts.dosesMissed > 0 && kind === 'daily' && <Badge variant="destructive">{facts.dosesMissed} not yet marked</Badge>}
      </div>

      {content.highlights.length > 0 && (
        <ul className="space-y-1 mb-4 text-gray-700">
          {content.highlights.map((h) => <li key={h} className="flex gap-2"><span aria-hidden>•</span>{h}</li>)}
        </ul>
      )}

      {content.attention.length > 0 && (
        <div className="p-3 rounded-lg bg-orange-50 border border-orange-200 mb-3" role="note">
          <div className="flex items-center gap-2 text-orange-900 mb-1"><AlertCircle className="w-4 h-4" aria-hidden /><span className="text-sm">Worth mentioning to a doctor or caregiver</span></div>
          <ul className="text-sm text-orange-800 space-y-1">{content.attention.map((a) => <li key={a}>{a}</li>)}</ul>
        </div>
      )}

      {content.tip && <p className="text-sm text-gray-600 flex gap-2"><Lightbulb className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" aria-hidden />{content.tip}</p>}
      <p className="text-xs text-gray-400 mt-3">General wellbeing information, not medical advice.</p>
    </Card>
  );
}
