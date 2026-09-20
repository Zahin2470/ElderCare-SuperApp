import { Star, MapPin, ShieldCheck, Banknote } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { relativeDay, taka } from '../../lib/format';

export interface Caregiver {
  id: string; name: string; rating: number; reviewsCount: number; experienceYears: number;
  specialties: string[]; hourlyRateBdt: number; area: string | null; verified: boolean; availableFrom: string;
}

export function CaregiverCard({ c, onView, onBook }: { c: Caregiver; onView?: (c: Caregiver) => void; onBook?: (c: Caregiver) => void }) {
  const initials = c.name.split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        <Avatar className="w-14 h-14"><AvatarFallback className="bg-purple-100 text-purple-700">{initials}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap"><p className="text-gray-900">{c.name}</p>{c.verified && <Badge variant="secondary" className="gap-1"><ShieldCheck className="w-3 h-3" aria-hidden />Verified</Badge>}</div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 mt-1">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden />{c.rating.toFixed(1)} ({c.reviewsCount})</span>
            <span>{c.experienceYears} yrs experience</span>
            {c.area && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" aria-hidden />{c.area}</span>}
          </div>
          <div className="flex flex-wrap gap-1 mt-2">{c.specialties.map((s) => <Badge key={s} variant="outline" className="text-xs">{s}</Badge>)}</div>
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="flex items-center gap-1 text-gray-900"><Banknote className="w-4 h-4" aria-hidden />{taka(c.hourlyRateBdt)}/hr</span>
            <span className="text-green-700">Available {relativeDay(c.availableFrom).toLowerCase()}</span>
          </div>
        </div>
      </div>
      {(onView || onBook) && (
        <div className="flex gap-2 mt-4">
          {onView && <Button variant="outline" className="flex-1" onClick={() => onView(c)}>View profile</Button>}
          {onBook && <Button className="flex-1" onClick={() => onBook(c)}>Book a visit</Button>}
        </div>
      )}
    </Card>
  );
}
