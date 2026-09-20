import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Star, Banknote } from 'lucide-react';
import { taka } from '../../lib/format';

export interface Doctor {
  id: string; name: string; specialty: string; designation: string | null; hospital: string | null;
  rating: number; reviewsCount: number; experienceYears: number; feeBdt: number; about: string | null;
}

export default function DoctorCard({ doctor, onBook }: { doctor: Doctor; onBook?: (d: Doctor) => void }) {
  const initials = doctor.name.replace(/^(Dr\.|Professor)\s*/i, '').split(' ').map((p) => p[0]).slice(0, 2).join('');
  return (
    <Card className="p-5 hover:shadow-lg transition-shadow">
      <div className="flex gap-4">
        <Avatar className="w-14 h-14"><AvatarFallback className="bg-purple-100 text-purple-700">{initials}</AvatarFallback></Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-gray-900">{doctor.name}</p>
          <p className="text-sm text-gray-600">{doctor.specialty}{doctor.designation ? ` · ${doctor.designation}` : ''}</p>
          {doctor.hospital && <p className="text-xs text-gray-500">{doctor.hospital}</p>}
          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm">
            <span className="flex items-center gap-1"><Star className="w-4 h-4 text-yellow-500 fill-yellow-500" aria-hidden />{doctor.rating.toFixed(1)} <span className="text-gray-500">({doctor.reviewsCount})</span></span>
            <span className="text-gray-600">{doctor.experienceYears} yrs</span>
            <Badge variant="secondary" className="gap-1"><Banknote className="w-3 h-3" aria-hidden />{taka(doctor.feeBdt)}</Badge>
          </div>
        </div>
      </div>
      {onBook && <Button className="w-full mt-4" onClick={() => onBook(doctor)}>Book consultation</Button>}
    </Card>
  );
}
