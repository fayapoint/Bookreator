import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Content Factory AI Database Helpers

import { projects, chapters, agentLogs, InsertProject, InsertChapter, InsertAgentLog, Project, Chapter, AgentLog } from "../drizzle/schema";
import { desc, and } from "drizzle-orm";

// Project Helpers
export async function createProject(project: InsertProject): Promise<Project | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(projects).values(project);
  const projectId = Number(result[0].insertId);
  
  const created = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return created[0] || null;
}

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(projectId: number): Promise<Project | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  return result[0] || null;
}

export async function updateProject(projectId: number, updates: Partial<InsertProject>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(projects).set(updates).where(eq(projects.id, projectId));
  return true;
}

export async function deleteProject(projectId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(projects).where(eq(projects.id, projectId));
  return true;
}

// Chapter Helpers
export async function createChapter(chapter: InsertChapter): Promise<Chapter | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(chapters).values(chapter);
  const chapterId = Number(result[0].insertId);
  
  const created = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1);
  return created[0] || null;
}

export async function getChaptersByProjectId(projectId: number): Promise<Chapter[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(chapters).where(eq(chapters.projectId, projectId)).orderBy(chapters.order);
}

export async function getChapterById(chapterId: number): Promise<Chapter | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(chapters).where(eq(chapters.id, chapterId)).limit(1);
  return result[0] || null;
}

export async function updateChapter(chapterId: number, updates: Partial<InsertChapter>): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(chapters).set(updates).where(eq(chapters.id, chapterId));
  return true;
}

export async function deleteChapter(chapterId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(chapters).where(eq(chapters.id, chapterId));
  return true;
}

// Agent Log Helpers
export async function createAgentLog(log: InsertAgentLog): Promise<AgentLog | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(agentLogs).values(log);
  const logId = Number(result[0].insertId);
  
  const created = await db.select().from(agentLogs).where(eq(agentLogs.id, logId)).limit(1);
  return created[0] || null;
}

export async function getAgentLogsByProjectId(projectId: number): Promise<AgentLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agentLogs).where(eq(agentLogs.projectId, projectId)).orderBy(desc(agentLogs.createdAt));
}

export async function getAgentLogsByChapterId(chapterId: number): Promise<AgentLog[]> {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(agentLogs).where(eq(agentLogs.chapterId, chapterId)).orderBy(desc(agentLogs.createdAt));
}
