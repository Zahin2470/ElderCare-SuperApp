import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Star, Clock, DollarSign, Calendar } from 'lucide-react';

interface DoctorCardProps {
  doctor: {
    id: number;
    name: string;
    speciality: string;
    rating: number;
    nextAvailable: string;
    fee: string;
    avatar?: string;
  };
  onBook?: (id: number) => void;
}

export default function DoctorCard({ doctor, onBook }: DoctorCardProps) {
  return (
    <Card className="p-5 hover:shadow-lg transition-all hover:border-purple-300">
      <div className="flex gap-4">
        <Avatar className="w-16 h-16 border-2 border-purple-200">
          <AvatarFallback className="bg-gradient-to-br from-purple-400 to-blue-400 text-white">
            {doctor.name.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h3 className="text-gray-900">{doctor.name}</h3>
              <p className="text-sm text-gray-600">{doctor.speciality}</p>
            </div>
            <div className="flex items-center gap-1 bg-yellow-50 px-2 py-1 rounded">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span className="text-sm">{doctor.rating}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4" />
              <span>{doctor.nextAvailable}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <DollarSign className="w-4 h-4" />
              <span>{doctor.fee}</span>
            </div>
          </div>

          <Button 
            size="sm" 
            className="w-full"
            onClick={() => onBook?.(doctor.id)}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Book Appointment
          </Button>
        </div>
      </div>
    </Card>
  );
}
