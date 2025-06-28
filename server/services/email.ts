import nodemailer from 'nodemailer';
import { storage } from '../storage';
import fs from 'fs/promises';
import path from 'path';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  async configure() {
    try {
      const host = process.env.SMTP_HOST || 'smtp.gmail.com';
      const port = parseInt(process.env.SMTP_PORT || '587');
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        console.warn('SMTP credentials not provided, email service disabled');
        return;
      }

      this.transporter = nodemailer.createTransporter({
        host,
        port,
        secure: port === 465,
        auth: { user, pass }
      });

      await this.transporter.verify();
      this.isConfigured = true;
      console.log('Email service configured successfully');
    } catch (error) {
      console.error('Failed to configure email service:', error);
      this.isConfigured = false;
    }
  }

  async sendVideoEmail(recordingId: number, recipientEmail: string): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      throw new Error('Email service not configured');
    }

    try {
      const recording = await storage.getRecording(recordingId);
      if (!recording) {
        throw new Error('Recording not found');
      }

      const videoPath = recording.originalPath;
      const exists = await fs.access(videoPath).then(() => true).catch(() => false);
      
      if (!exists) {
        throw new Error('Video file not found');
      }

      const subject = `Security Alert - Video Recording ${recording.filename}`;
      const body = `
        <h2>Security Recording Alert</h2>
        <p>A new security recording has been captured:</p>
        <ul>
          <li><strong>Filename:</strong> ${recording.filename}</li>
          <li><strong>Start Time:</strong> ${recording.startTime}</li>
          <li><strong>Duration:</strong> ${recording.duration} seconds</li>
          <li><strong>Camera:</strong> ${recording.cameraId}</li>
          <li><strong>File Size:</strong> ${(recording.fileSize / 1024 / 1024).toFixed(2)} MB</li>
        </ul>
        <p>The video file is attached to this email.</p>
      `;

      await this.transporter.sendMail({
        from: process.env.SMTP_USER,
        to: recipientEmail,
        subject,
        html: body,
        attachments: [{
          filename: recording.filename,
          path: videoPath
        }]
      });

      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.transporter) {
      return false;
    }

    try {
      await this.transporter.verify();
      return true;
    } catch {
      return false;
    }
  }

  isReady(): boolean {
    return this.isConfigured;
  }
}

export const emailService = new EmailService();
