import { useEffect } from 'react';
import { VideoFeed } from '@/components/video-feed';
import { StatusPanel } from '@/components/status-panel';
import { RecordingHistory } from '@/components/recording-history';
import { Badge } from '@/components/ui/badge';
import { Video, Wifi, Database, Mail } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { lastMessage } = useWebSocket();

  const { data: status } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 5000,
  });

  // Handle WebSocket messages for real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'recording_started':
        case 'recording_stopped':
          queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
          queryClient.invalidateQueries({ queryKey: ['/api/status'] });
          break;
        case 'email_sent':
        case 'email_failed':
          queryClient.invalidateQueries({ queryKey: ['/api/email-queue'] });
          queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
          break;
      }
    }
  }, [lastMessage, queryClient]);

  const getStatusIndicator = (isOnline: boolean) => (
    <div className={`w-3 h-3 rounded-full ${
      isOnline ? 'bg-green-500 animate-pulse' : 'bg-red-500'
    }`} />
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Video className="text-blue-600 text-2xl" />
              <h1 className="text-xl font-bold text-gray-900">NVR Recording System</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                {getStatusIndicator(status?.internet)}
                <span className="text-sm text-gray-600">
                  {status?.internet ? 'Internet Connected' : 'No Internet'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIndicator(status?.database)}
                <span className="text-sm text-gray-600">
                  {status?.database ? 'Database OK' : 'Database Error'}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {getStatusIndicator(status?.nvr)}
                <span className="text-sm text-gray-600">
                  {status?.nvr ? 'NVR Connected' : 'NVR Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed - Takes 2 columns */}
          <div className="lg:col-span-2">
            <VideoFeed 
              onRecordingStart={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/status'] });
              }}
              onRecordingStop={() => {
                queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
                queryClient.invalidateQueries({ queryKey: ['/api/email-queue'] });
              }}
            />
          </div>

          {/* Status Panel - Takes 1 column */}
          <div>
            <StatusPanel />
          </div>
        </div>

        {/* Recording History - Full width */}
        <div className="mt-8">
          <RecordingHistory />
        </div>
      </div>
    </div>
  );
}
