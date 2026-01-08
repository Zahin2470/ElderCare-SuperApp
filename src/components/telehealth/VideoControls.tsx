import { Button } from '../ui/button';
import { Mic, MicOff, Video, VideoOff, Monitor, MonitorOff, Phone, MessageSquare, FileText } from 'lucide-react';
import { Badge } from '../ui/badge';

interface VideoControlsProps {
  muted: boolean;
  cameraOn: boolean;
  screenSharing: boolean;
  onToggleMute: () => void;
  onToggleCamera: () => void;
  onToggleScreenShare: () => void;
  onEndCall: () => void;
  onOpenChat: () => void;
  onOpenNotes: () => void;
  callDuration?: string;
}

export default function VideoControls({
  muted,
  cameraOn,
  screenSharing,
  onToggleMute,
  onToggleCamera,
  onToggleScreenShare,
  onEndCall,
  onOpenChat,
  onOpenNotes,
  callDuration = "00:00"
}: VideoControlsProps) {
  return (
    <div className="bg-gray-900/95 backdrop-blur-md p-4 rounded-xl border border-gray-700">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Time */}
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="bg-red-500/20 text-red-300 border-red-400">
            <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse mr-2" />
            {callDuration}
          </Badge>
        </div>

        {/* Center: Main Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={muted ? "destructive" : "secondary"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={onToggleMute}
          >
            {muted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>

          <Button
            variant={cameraOn ? "secondary" : "destructive"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={onToggleCamera}
          >
            {cameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </Button>

          <Button
            variant={screenSharing ? "default" : "secondary"}
            size="icon"
            className="rounded-full w-12 h-12"
            onClick={onToggleScreenShare}
          >
            {screenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
          </Button>

          <Button
            variant="destructive"
            size="icon"
            className="rounded-full w-14 h-14 ml-2"
            onClick={onEndCall}
          >
            <Phone className="w-6 h-6 rotate-[135deg]" />
          </Button>
        </div>

        {/* Right: Additional Features */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={onOpenChat}
          >
            <MessageSquare className="w-5 h-5" />
          </Button>

          <Button
            variant="secondary"
            size="icon"
            className="rounded-full"
            onClick={onOpenNotes}
          >
            <FileText className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
