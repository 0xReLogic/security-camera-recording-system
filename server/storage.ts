import { 
  users, recordings, emailQueue, systemConfig,
  type User, type InsertUser, 
  type Recording, type InsertRecording,
  type EmailQueue, type InsertEmailQueue,
  type SystemConfig, type InsertSystemConfig
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Recording methods
  createRecording(recording: InsertRecording): Promise<Recording>;
  getRecording(id: number): Promise<Recording | undefined>;
  getRecordings(limit?: number): Promise<Recording[]>;
  updateRecording(id: number, updates: Partial<InsertRecording>): Promise<Recording | undefined>;
  deleteRecording(id: number): Promise<boolean>;
  
  // Email queue methods
  addToEmailQueue(emailData: InsertEmailQueue): Promise<EmailQueue>;
  getPendingEmails(): Promise<EmailQueue[]>;
  getFailedEmails(): Promise<EmailQueue[]>;
  updateEmailStatus(id: number, status: string, errorMessage?: string): Promise<void>;
  incrementRetryCount(id: number): Promise<void>;
  
  // System config methods
  getConfig(key: string): Promise<SystemConfig | undefined>;
  setConfig(key: string, value: string): Promise<SystemConfig>;
  getAllConfig(): Promise<SystemConfig[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async createRecording(recording: InsertRecording): Promise<Recording> {
    const [newRecording] = await db
      .insert(recordings)
      .values(recording)
      .returning();
    return newRecording;
  }

  async getRecording(id: number): Promise<Recording | undefined> {
    const [recording] = await db.select().from(recordings).where(eq(recordings.id, id));
    return recording || undefined;
  }

  async getRecordings(limit: number = 50): Promise<Recording[]> {
    return await db.select().from(recordings)
      .orderBy(desc(recordings.createdAt))
      .limit(limit);
  }

  async updateRecording(id: number, updates: Partial<InsertRecording>): Promise<Recording | undefined> {
    const [updated] = await db
      .update(recordings)
      .set(updates)
      .where(eq(recordings.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteRecording(id: number): Promise<boolean> {
    const result = await db.delete(recordings).where(eq(recordings.id, id));
    return result.rowCount > 0;
  }

  async addToEmailQueue(emailData: InsertEmailQueue): Promise<EmailQueue> {
    const [queueItem] = await db
      .insert(emailQueue)
      .values(emailData)
      .returning();
    return queueItem;
  }

  async getPendingEmails(): Promise<EmailQueue[]> {
    return await db.select().from(emailQueue)
      .where(eq(emailQueue.status, 'pending'))
      .orderBy(emailQueue.createdAt);
  }

  async getFailedEmails(): Promise<EmailQueue[]> {
    return await db.select().from(emailQueue)
      .where(eq(emailQueue.status, 'failed'))
      .orderBy(emailQueue.createdAt);
  }

  async updateEmailStatus(id: number, status: string, errorMessage?: string): Promise<void> {
    await db
      .update(emailQueue)
      .set({ 
        status, 
        errorMessage,
        lastAttempt: new Date()
      })
      .where(eq(emailQueue.id, id));
  }

  async incrementRetryCount(id: number): Promise<void> {
    await db
      .update(emailQueue)
      .set({ 
        retryCount: sql`retry_count + 1`,
        lastAttempt: new Date()
      })
      .where(eq(emailQueue.id, id));
  }

  async getConfig(key: string): Promise<SystemConfig | undefined> {
    const [config] = await db.select().from(systemConfig).where(eq(systemConfig.key, key));
    return config || undefined;
  }

  async setConfig(key: string, value: string): Promise<SystemConfig> {
    const [config] = await db
      .insert(systemConfig)
      .values({ key, value })
      .onConflictDoUpdate({
        target: systemConfig.key,
        set: { value, updatedAt: new Date() }
      })
      .returning();
    return config;
  }

  async getAllConfig(): Promise<SystemConfig[]> {
    return await db.select().from(systemConfig);
  }
}

export const storage = new DatabaseStorage();
