import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, Bell, BellOff } from 'lucide-react';

interface CalendarItemProps {
  event: {
    id: number;
    title: string;
    date: string;
    time: string;
    location: string;
    type: string;
    reminder: boolean;
  };
  compact?: boolean;
  onToggleReminder?: (id: number) => void;
}

export default function CalendarItem({ event, compact = false, onToggleReminder }: CalendarItemProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-lg border hover:border-purple-300 transition-colors">
        <div className="text-center min-w-12">
          <div className="text-sm text-gray-500">{event.date.split(' ')[0]}</div>
          <div className="text-lg text-purple-600">{event.date.split(' ')[1]}</div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-gray-900 truncate">{event.title}</p>
          <p className="text-xs text-gray-500">{event.time}</p>
        </div>
        <Badge variant="outline" className="text-xs">
          {event.type}
        </Badge>
      </div>
    );
  }

  return (
    <Card className="p-4 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-gray-900 mb-1">{event.title}</h4>
          <Badge variant="secondary" className="text-xs">
            {event.type}
          </Badge>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={() => onToggleReminder?.(event.id)}
        >
          {event.reminder ? (
            <Bell className="w-4 h-4 text-purple-600 fill-purple-600" />
          ) : (
            <BellOff className="w-4 h-4 text-gray-400" />
          )}
        </Button>
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>{event.date}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="w-4 h-4" />
          <span>{event.time}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MapPin className="w-4 h-4" />
          <span>{event.location}</span>
        </div>
      </div>
    </Card>
  );
}
