import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, Users, Globe } from 'lucide-react';

interface EventCardProps {
  event: {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    distance?: string;
    attendees: number;
    capacity: number;
    type: 'online' | 'in-person';
    category: string;
  };
  onJoin?: (id: number) => void;
}

export default function EventCard({ event, onJoin }: EventCardProps) {
  const spotsLeft = event.capacity - event.attendees;
  const isAlmostFull = spotsLeft <= 5;

  return (
    <Card className="p-5 hover:shadow-lg transition-all hover:border-purple-300 bg-gradient-to-br from-white to-purple-50/30">
      <div className="flex items-start justify-between mb-3">
        <Badge variant="secondary" className="bg-purple-100 text-purple-700">
          {event.category}
        </Badge>
        <Badge variant={event.type === 'online' ? 'default' : 'outline'} className="gap-1">
          {event.type === 'online' ? <Globe className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
          {event.type === 'online' ? 'Online' : 'In-Person'}
        </Badge>
      </div>

      <h3 className="text-gray-900 mb-3">{event.title}</h3>

      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {event.type === 'online' ? <Globe className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>
            {event.attendees} / {event.capacity} attendees
            {isAlmostFull && <span className="text-orange-600 ml-2">• Only {spotsLeft} spots left!</span>}
          </span>
        </div>
      </div>

      <Button 
        className="w-full" 
        variant={isAlmostFull ? "default" : "outline"}
        onClick={() => onJoin?.(event.id)}
      >
        Join Event
      </Button>
    </Card>
  );
}
