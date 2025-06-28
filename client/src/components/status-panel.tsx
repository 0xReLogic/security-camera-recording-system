import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Send, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatFileSize } from '@/lib/video-utils';

interface QueueItem {
  id: number;
  recordingId: number;
  recipientEmail: string;
  subject: string;
  status: string;
  retryCount: number;
  lastAttempt: string;
  errorMessage?: string;
  createdAt: string;
}

interface QueueStats {
  pending: number;
  sent: number;
  failed: number;
}

export function StatusPanel() {
  const [recipientEmail, setRecipientEmail] = useState('security@company.com');
  const [emailSubject, setEmailSubject] = useState('Security Alert - {datetime}');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: status, isLoading: statusLoading } = useQuery({
    queryKey: ['/api/status'],
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const { data: queueData, isLoading: queueLoading } = useQuery({
    queryKey: ['/api/email-queue'],
    refetchInterval: 3000, // Refresh every 3 seconds
  });

  const retryMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/email-queue/retry', {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/email-queue'] });
      toast({
        title: "Retry Initiated",
        description: "Failed emails are being retried",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to retry emails",
        variant: "destructive",
      });
    },
  });

  const testEmailMutation = useMutation({
    mutationFn: () => apiRequest('POST', '/api/email/test', { email: recipientEmail }),
    onSuccess: () => {
      toast({
        title: "Test Email Sent",
        description: "Check your email inbox",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to send test email",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'sent': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-3 h-3" />;
      case 'sent': return <CheckCircle className="w-3 h-3" />;
      case 'failed': return <XCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  const queueItems = [...(queueData?.pending || []), ...(queueData?.failed || [])];
  const queueStats: QueueStats = status?.queue || { pending: 0, sent: 0, failed: 0 };

  return (
    <div className="space-y-6">
      {/* Email Queue Status */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Queue Status</h3>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{queueStats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{queueStats.sent}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{queueStats.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {queueItems.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No items in queue
              </div>
            ) : (
              queueItems.slice(0, 5).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)}`} />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {item.subject.replace('{datetime}', new Date(item.createdAt).toLocaleString())}
                      </div>
                      <div className="text-xs text-gray-500">
                        To: {item.recipientEmail}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={`
                    ${item.status === 'pending' ? 'text-yellow-600 border-yellow-600' : ''}
                    ${item.status === 'sent' ? 'text-green-600 border-green-600' : ''}
                    ${item.status === 'failed' ? 'text-red-600 border-red-600' : ''}
                  `}>
                    {getStatusIcon(item.status)}
                    <span className="ml-1 capitalize">{item.status}</span>
                  </Badge>
                </div>
              ))
            )}
          </div>

          <Button 
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending || queueStats.failed === 0}
            className="w-full mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${retryMutation.isPending ? 'animate-spin' : ''}`} />
            Retry Failed Emails
          </Button>
        </CardContent>
      </Card>

      {/* System Information */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Information</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">RTSP Stream:</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Active
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Storage Space:</span>
              <span className="text-sm font-medium text-gray-900">850 GB Available</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Database Connection:</span>
              <Badge variant="outline" className={
                status?.database 
                  ? "text-green-600 border-green-600" 
                  : "text-red-600 border-red-600"
              }>
                {status?.database ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Email Service:</span>
              <Badge variant="outline" className={
                status?.email 
                  ? "text-green-600 border-green-600" 
                  : "text-red-600 border-red-600"
              }>
                {status?.email ? 'SMTP Ready' : 'Not Ready'}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Internet Connection:</span>
              <Badge variant="outline" className={
                status?.internet 
                  ? "text-green-600 border-green-600" 
                  : "text-red-600 border-red-600"
              }>
                {status?.internet ? 'Connected' : 'Disconnected'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Configuration */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="recipient-email" className="block text-sm font-medium text-gray-700 mb-1">
                Recipient Email
              </Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="security@company.com"
              />
            </div>
            <div>
              <Label htmlFor="email-subject" className="block text-sm font-medium text-gray-700 mb-1">
                Subject Template
              </Label>
              <Input
                id="email-subject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Security Alert - {datetime}"
              />
            </div>
            <Button 
              onClick={() => testEmailMutation.mutate()}
              disabled={testEmailMutation.isPending || !status?.email}
              className="w-full bg-gray-600 hover:bg-gray-700 text-white"
            >
              <Send className={`w-4 h-4 mr-2 ${testEmailMutation.isPending ? 'animate-pulse' : ''}`} />
              Test Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
