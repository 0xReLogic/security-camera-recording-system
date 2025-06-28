import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Download, 
  Send, 
  Trash2, 
  CheckCircle, 
  Clock, 
  XCircle 
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { formatDuration, formatFileSize, formatDateTime } from '@/lib/video-utils';
import type { Recording } from '@shared/schema';

export function RecordingHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: recordings, isLoading, refetch } = useQuery({
    queryKey: ['/api/recordings'],
  });

  const resendEmailMutation = useMutation({
    mutationFn: (id: number) => apiRequest('POST', `/api/recordings/${id}/resend-email`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      toast({
        title: "Email Queued",
        description: "Recording has been queued for resending",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to queue email for resending",
        variant: "destructive",
      });
    },
  });

  const deleteRecordingMutation = useMutation({
    mutationFn: (id: number) => apiRequest('DELETE', `/api/recordings/${id}`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/recordings'] });
      toast({
        title: "Recording Deleted",
        description: "Recording has been permanently deleted",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete recording",
        variant: "destructive",
      });
    },
  });

  const handleDownload = (recording: Recording) => {
    window.open(`/api/recordings/${recording.id}/download`, '_blank');
  };

  const getEmailStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case 'pending':
        return (
          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="outline" className="text-red-600 border-red-600">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600 border-gray-600">
            Unknown
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Recent Recordings</h3>
          <Button
            onClick={() => refetch()}
            variant="outline"
            className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Filename</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Date & Time</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Size</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Email Status</th>
                <th className="px-4 py-3 text-left font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!recordings || recordings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No recordings found
                  </td>
                </tr>
              ) : (
                recordings.map((recording: Recording) => (
                  <tr key={recording.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      {recording.filename}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDateTime(recording.startTime)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatDuration(recording.duration || 0)}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {formatFileSize(recording.fileSize || 0)}
                    </td>
                    <td className="px-4 py-3">
                      {getEmailStatusBadge(recording.emailStatus)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownload(recording)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => resendEmailMutation.mutate(recording.id)}
                          disabled={resendEmailMutation.isPending}
                          className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteRecordingMutation.mutate(recording.id)}
                          disabled={deleteRecordingMutation.isPending}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
