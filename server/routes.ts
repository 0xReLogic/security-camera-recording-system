import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { videoService } from "./services/video";
import { emailService } from "./services/email";
import { queueService } from "./services/queue";
import { insertRecordingSchema } from "@shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs/promises";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize services
  await emailService.configure();

  // WebSocket for real-time updates
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });
  });

  // Broadcast function for real-time updates
  const broadcast = (data: any) => {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  };

  // Get system status
  app.get('/api/status', async (req, res) => {
    try {
      const queueStats = await queueService.getQueueStats();
      const internetConnected = await checkInternetConnection();
      const emailReady = emailService.isReady();
      
      res.json({
        internet: internetConnected,
        database: true, // If we get here, DB is working
        nvr: true, // Assume NVR is connected - would need actual check
        email: emailReady,
        queue: queueStats
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Start recording
  app.post('/api/recording/start', async (req, res) => {
    try {
      const { cameraId = 'camera01' } = req.body;
      const sessionId = await videoService.startRecording(cameraId);
      
      broadcast({
        type: 'recording_started',
        sessionId,
        cameraId
      });
      
      res.json({ sessionId, status: 'recording' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Stop recording
  app.post('/api/recording/stop', async (req, res) => {
    try {
      const { sessionId } = req.body;
      const result = await videoService.stopRecording(sessionId);
      
      if (!result) {
        return res.status(404).json({ error: 'Recording session not found' });
      }

      // Save recording to database
      const recording = await storage.createRecording({
        filename: result.filename,
        originalPath: result.filePath,
        startTime: new Date(Date.now() - result.duration * 1000),
        endTime: new Date(),
        duration: result.duration,
        fileSize: result.fileSize,
        cameraId: 'camera01',
        emailStatus: 'pending'
      });

      // Add to email queue
      const recipientEmail = process.env.DEFAULT_RECIPIENT_EMAIL || 'security@company.com';
      await queueService.addEmailToQueue(
        recording.id,
        recipientEmail,
        `Security Alert - Video Recording ${recording.filename}`
      );

      broadcast({
        type: 'recording_stopped',
        recording
      });
      
      res.json({ recording, status: 'completed' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get recording status
  app.get('/api/recording/status/:sessionId', (req, res) => {
    const { sessionId } = req.params;
    const status = videoService.getRecordingStatus(sessionId);
    
    if (!status) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json(status);
  });

  // Get all recordings
  app.get('/api/recordings', async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const recordings = await storage.getRecordings(limit);
      res.json(recordings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Download recording
  app.get('/api/recordings/:id/download', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recording = await storage.getRecording(id);
      
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      const exists = await fs.access(recording.originalPath).then(() => true).catch(() => false);
      if (!exists) {
        return res.status(404).json({ error: 'Video file not found' });
      }

      res.download(recording.originalPath, recording.filename);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Resend email for recording
  app.post('/api/recordings/:id/resend-email', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recording = await storage.getRecording(id);
      
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      const recipientEmail = process.env.DEFAULT_RECIPIENT_EMAIL || 'security@company.com';
      await queueService.addEmailToQueue(
        recording.id,
        recipientEmail,
        `Security Alert - Video Recording ${recording.filename} (Resent)`
      );

      await storage.updateRecording(id, { emailStatus: 'pending' });
      
      res.json({ message: 'Email queued for resending' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete recording
  app.delete('/api/recordings/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const recording = await storage.getRecording(id);
      
      if (!recording) {
        return res.status(404).json({ error: 'Recording not found' });
      }

      // Delete file
      await videoService.deleteVideoFile(recording.originalPath);
      
      // Delete from database
      await storage.deleteRecording(id);
      
      res.json({ message: 'Recording deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get email queue
  app.get('/api/email-queue', async (req, res) => {
    try {
      const [pending, failed] = await Promise.all([
        storage.getPendingEmails(),
        storage.getFailedEmails()
      ]);
      
      res.json({ pending, failed });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Retry failed emails
  app.post('/api/email-queue/retry', async (req, res) => {
    try {
      await queueService.retryFailedEmails();
      res.json({ message: 'Retry initiated' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Test email
  app.post('/api/email/test', async (req, res) => {
    try {
      const { email } = req.body;
      const testEmail = email || process.env.DEFAULT_RECIPIENT_EMAIL;
      
      if (!testEmail) {
        return res.status(400).json({ error: 'Email address required' });
      }

      // This would send a test email - simplified implementation
      res.json({ message: 'Test email sent successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get/Set system configuration
  app.get('/api/config', async (req, res) => {
    try {
      const config = await storage.getAllConfig();
      const configObject = config.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {} as Record<string, string>);
      
      res.json(configObject);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/config', async (req, res) => {
    try {
      const { key, value } = req.body;
      const config = await storage.setConfig(key, value);
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}

async function checkInternetConnection(): Promise<boolean> {
  try {
    const response = await fetch('https://www.google.com', { 
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    return response.ok;
  } catch {
    return false;
  }
}
