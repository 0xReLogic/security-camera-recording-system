import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const recordings = pgTable("recordings", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull().unique(),
  originalPath: text("original_path").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  duration: integer("duration"), // in seconds
  fileSize: integer("file_size"), // in bytes
  cameraId: text("camera_id").notNull(),
  emailStatus: text("email_status").notNull().default("pending"), // pending, sent, failed
  emailSentAt: timestamp("email_sent_at"),
  emailError: text("email_error"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const emailQueue = pgTable("email_queue", {
  id: serial("id").primaryKey(),
  recordingId: integer("recording_id").references(() => recordings.id),
  recipientEmail: text("recipient_email").notNull(),
  subject: text("subject").notNull(),
  body: text("body"),
  status: text("status").notNull().default("pending"), // pending, sent, failed
  retryCount: integer("retry_count").default(0),
  lastAttempt: timestamp("last_attempt"),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertRecordingSchema = createInsertSchema(recordings).omit({
  id: true,
  createdAt: true,
});

export const insertEmailQueueSchema = createInsertSchema(emailQueue).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Recording = typeof recordings.$inferSelect;
export type InsertRecording = z.infer<typeof insertRecordingSchema>;
export type EmailQueue = typeof emailQueue.$inferSelect;
export type InsertEmailQueue = z.infer<typeof insertEmailQueueSchema>;
export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
