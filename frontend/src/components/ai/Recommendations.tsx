import { Sparkles } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { useAuth } from '../auth/AuthContext';
import { Recommendation, useRecommendations } from '../../lib/queries';

interface Props {
  type: 'meals' | 'events' | 'caregivers';
  title: string;
  /** Called with the chosen item so the host module can open the matching screen. */
  onSelect?: (item: Recommendation) => void;
  actionLabel?: string;
}

/** "Suggested for you" list. Ranking is computed by a transparent scoring function on the server; each item explains why. */
export function Recommendations({ type, title, onSelect, actionLabel = 'View' }: Props) {
  const { user } = useAuth();
  const { data, isLoading } = useRecommendations(type, user?.locale ?? 'en');
  if (isLoading) return <Card className="p-5 animate-pulse h-28" aria-busy="true" />;
  if (!data?.items.length) return null;

  return (
    <section aria-label={title}>
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-purple-600" aria-hidden />
        <h2 className="text-gray-900">{title}</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {data.items.map((it) => (
          <Card key={`${it.type}-${it.id}`} className="p-4 flex flex-col gap-2 border-purple-100">
            <div>
              <p className="text-gray-900">{it.title}</p>
              <p className="text-xs text-gray-500">{it.subtitle}</p>
            </div>
            <p className="text-sm text-purple-800 bg-purple-50 rounded-md px-2 py-1">{it.reason}</p>
            {onSelect && <Button size="sm" variant="outline" className="mt-auto self-start" onClick={() => onSelect(it)}>{actionLabel}</Button>}
          </Card>
        ))}
      </div>
      <p className="text-xs text-gray-400 mt-2">Suggestions are based on your medications, readings and past choices — they are not medical advice.</p>
    </section>
  );
}
