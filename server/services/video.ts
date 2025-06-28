import fs from 'fs/promises';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';

export interface RecordingSession {
  id: string;
  filename: string;
  startTime: Date;
  isRecording: boolean;
  filePath: string;
  buffer: Buffer[];
  bufferStartTime: Date;
  ffmpegProcess?: ChildProcess;
}

export class VideoService {
  private sessions: Map<string, RecordingSession> = new Map();
  private rtspUrl: string;
  private outputDir: string;
  private bufferDuration = 10; // seconds

  constructor() {
    this.rtspUrl = process.env.RTSP_URL || 'rtsp://admin:admin@192.168.1.100:554/cam/realmonitor?channel=1&subtype=0';
    this.outputDir = process.env.VIDEO_OUTPUT_DIR || './recordings';
    this.ensureOutputDir();
  }

  private async ensureOutputDir() {
    try {
      await fs.mkdir(this.outputDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create output directory:', error);
    }
  }

  generateFilename(): string {
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');
    
    return `${day}${month}${year}_${hours}${minutes}${seconds}.mp4`;
  }

  async startRecording(cameraId: string = 'camera01'): Promise<string> {
    const sessionId = `${cameraId}_${Date.now()}`;
    const filename = this.generateFilename();
    const filePath = path.join(this.outputDir, filename);

    const session: RecordingSession = {
      id: sessionId,
      filename,
      startTime: new Date(),
      isRecording: true,
      filePath,
      buffer: [],
      bufferStartTime: new Date(Date.now() - this.bufferDuration * 1000)
    };

    this.sessions.set(sessionId, session);

    // Start FFmpeg recording with buffer
    this.startFFmpegRecording(session);

    return sessionId;
  }

  private startFFmpegRecording(session: RecordingSession) {
    // FFmpeg command to record from RTSP with pre-recording buffer
    const ffmpegArgs = [
      '-i', this.rtspUrl,
      '-c:v', 'libx264',
      '-c:a', 'aac',
      '-preset', 'ultrafast',
      '-movflags', '+faststart',
      '-segment_time', '3600', // 1 hour segments
      '-f', 'mp4',
      session.filePath
    ];

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    ffmpeg.stdout.on('data', (data) => {
      console.log(`FFmpeg stdout: ${data}`);
    });

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      console.log(`FFmpeg process exited with code ${code}`);
    });

    session.ffmpegProcess = ffmpeg;
  }

  async stopRecording(sessionId: string): Promise<{ filename: string; filePath: string; duration: number; fileSize: number } | null> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.isRecording) {
      return null;
    }

    session.isRecording = false;
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - session.startTime.getTime()) / 1000);

    // Stop FFmpeg process gracefully
    if (session.ffmpegProcess) {
      session.ffmpegProcess.kill('SIGTERM');
      
      // Wait for process to exit
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          if (session.ffmpegProcess && !session.ffmpegProcess.killed) {
            session.ffmpegProcess.kill('SIGKILL');
          }
          resolve();
        }, 5000); // 5 second timeout
        
        session.ffmpegProcess!.on('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
      });
    }

    // Wait a moment for file to be written
    await new Promise(resolve => setTimeout(resolve, 3000));

    try {
      // Check if file exists before getting stats
      const fileExists = await fs.access(session.filePath).then(() => true).catch(() => false);
      
      if (!fileExists) {
        console.warn(`Recording file not found: ${session.filePath}`);
        this.sessions.delete(sessionId);
        return {
          filename: session.filename,
          filePath: session.filePath,
          duration,
          fileSize: 0
        };
      }

      const stats = await fs.stat(session.filePath);
      const fileSize = stats.size;

      this.sessions.delete(sessionId);

      return {
        filename: session.filename,
        filePath: session.filePath,
        duration,
        fileSize
      };
    } catch (error) {
      console.error('Error getting file stats:', error);
      this.sessions.delete(sessionId);
      return {
        filename: session.filename,
        filePath: session.filePath,
        duration,
        fileSize: 0
      };
    }
  }

  getRecordingStatus(sessionId: string): RecordingSession | null {
    return this.sessions.get(sessionId) || null;
  }

  getAllActiveSessions(): RecordingSession[] {
    return Array.from(this.sessions.values()).filter(session => session.isRecording);
  }

  async deleteVideoFile(filePath: string): Promise<boolean> {
    try {
      await fs.unlink(filePath);
      return true;
    } catch (error) {
      console.error('Failed to delete video file:', error);
      return false;
    }
  }
}

export const videoService = new VideoService();
