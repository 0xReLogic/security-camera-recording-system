import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Video, Circle } from 'lucide-react';
import { formatDuration, formatFileSize, generateNextFilename } from '@/lib/video-utils';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface VideoFeedProps {
  onRecordingStart?: () => void;
  onRecordingStop?: () => void;
}

export function VideoFeed({ onRecordingStart, onRecordingStop }: VideoFeedProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [fileSize, setFileSize] = useState(0);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      if (isRecording) {
        setRecordingDuration(prev => prev + 1);
        // Estimate file size (rough calculation: ~1MB per 30 seconds)
        setFileSize(prev => prev + (1024 * 1024 / 30));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording]);

  const handleStartRecording = async () => {
    try {
      const response = await apiRequest('POST', '/api/recording/start', {
        cameraId: 'camera01'
      });
      const data = await response.json();
      
      setSessionId(data.sessionId);
      setIsRecording(true);
      setRecordingDuration(0);
      setFileSize(0);
      onRecordingStart?.();
      
      toast({
        title: "Recording Started",
        description: "Video recording has begun with 10-second buffer",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start recording",
        variant: "destructive",
      });
    }
  };

  const handleStopRecording = async () => {
    if (!sessionId) return;

    try {
      const response = await apiRequest('POST', '/api/recording/stop', {
        sessionId
      });
      const data = await response.json();
      
      setIsRecording(false);
      setSessionId(null);
      onRecordingStop?.();
      
      toast({
        title: "Recording Stopped",
        description: `Video saved as ${data.recording.filename} and queued for email`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to stop recording",
        variant: "destructive",
      });
    }
  };

  const timeString = currentTime.toLocaleString('en-GB', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Live Video Feed</h2>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm text-gray-600">
              {isRecording ? 'Recording' : 'Ready'}
            </span>
          </div>
        </div>
        
        {/* Video Display Area */}
        <div className="relative bg-gray-900 rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <Video className="text-white text-6xl opacity-50" />
          </div>
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            Camera 01 - Main Entrance
          </div>
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
            {timeString}
          </div>
          {isRecording && (
            <div className="absolute bottom-4 left-4 bg-red-500 bg-opacity-90 text-white px-3 py-1 rounded-full text-sm flex items-center">
              <Circle className="w-3 h-3 fill-current animate-pulse mr-2" />
              REC
            </div>
          )}
        </div>

        {/* Recording Controls */}
        <div className="mt-6 flex items-center justify-center space-x-4">
          <Button
            onClick={handleStartRecording}
            disabled={isRecording}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 font-medium"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Recording
          </Button>
          <Button
            onClick={handleStopRecording}
            disabled={!isRecording}
            variant="destructive"
            className="px-6 py-3 font-medium"
          >
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </Button>
        </div>

        {/* Recording Info */}
        <div className="mt-4 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Recording Duration:</span>
              <span className="ml-2 font-medium">{formatDuration(recordingDuration)}</span>
            </div>
            <div>
              <span className="text-gray-600">File Size:</span>
              <span className="ml-2 font-medium">{formatFileSize(fileSize)}</span>
            </div>
            <div>
              <span className="text-gray-600">Buffer Status:</span>
              <Badge variant="outline" className="ml-2 text-green-600 border-green-600">
                Ready (10s)
              </Badge>
            </div>
            <div>
              <span className="text-gray-600">Next Filename:</span>
              <span className="ml-2 font-medium">{generateNextFilename()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
