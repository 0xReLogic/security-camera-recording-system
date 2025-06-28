import { storage } from '../storage';
import { emailService } from './email';
import { videoService } from './video';
import cron from 'node-cron';

export class QueueService {
  private isProcessing = false;
  private retryInterval = 5; // minutes
  private maxRetries = 5;

  constructor() {
    this.startCronJobs();
  }

  private startCronJobs() {
    // Process email queue every minute
    cron.schedule('* * * * *', () => {
      this.processEmailQueue();
    });

    // Retry failed emails every 5 minutes
    cron.schedule('*/5 * * * *', () => {
      this.retryFailedEmails();
    });
  }

  async processEmailQueue() {
    if (this.isProcessing || !emailService.isReady()) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingEmails = await storage.getPendingEmails();
      
      for (const email of pendingEmails) {
        try {
          if (email.recordingId) {
            await emailService.sendVideoEmail(email.recordingId, email.recipientEmail);
            await storage.updateEmailStatus(email.id, 'sent');
            
            // Update recording status
            if (email.recordingId) {
              await storage.updateRecording(email.recordingId, {
                emailStatus: 'sent',
                emailSentAt: new Date()
              });
            }
          }
        } catch (error) {
          console.error(`Failed to send email ${email.id}:`, error);
          await storage.updateEmailStatus(email.id, 'failed', error.message);
          await storage.incrementRetryCount(email.id);
          
          // Update recording status
          if (email.recordingId) {
            await storage.updateRecording(email.recordingId, {
              emailStatus: 'failed',
              emailError: error.message
            });
          }
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  async retryFailedEmails() {
    if (!emailService.isReady()) {
      return;
    }

    try {
      const failedEmails = await storage.getFailedEmails();
      
      for (const email of failedEmails) {
        if (email.retryCount < this.maxRetries) {
          // Reset status to pending for retry
          await storage.updateEmailStatus(email.id, 'pending');
          
          if (email.recordingId) {
            await storage.updateRecording(email.recordingId, {
              emailStatus: 'pending',
              emailError: null
            });
          }
        }
      }
    } catch (error) {
      console.error('Error retrying failed emails:', error);
    }
  }

  async addEmailToQueue(recordingId: number, recipientEmail: string, subject: string, body?: string) {
    return await storage.addToEmailQueue({
      recordingId,
      recipientEmail,
      subject,
      body,
      status: 'pending',
      retryCount: 0
    });
  }

  async getQueueStats() {
    const [pending, failed] = await Promise.all([
      storage.getPendingEmails(),
      storage.getFailedEmails()
    ]);

    const sent = await storage.getRecordings(100);
    const sentCount = sent.filter(r => r.emailStatus === 'sent').length;

    return {
      pending: pending.length,
      failed: failed.length,
      sent: sentCount
    };
  }
}

export const queueService = new QueueService();
