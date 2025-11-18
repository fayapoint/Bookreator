import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// Agent Configuration Types
export interface AgentConfig {
  editor: { model: string };
  researcher: { model: string };
  writer: { model: string };
  reviewer: { model: string };
  artist: { model: string; imageModel?: string };
}

// Outline Types
export interface ChapterOutline {
  chapterId: string;
  title: string;
  description: string;
  order: number;
  estimatedWords?: number;
}

// Image Types
export interface ChapterImage {
  prompt: string;
  url: string;
  position: number;
  agentModel: string;
  createdAt: string;
}

// Content Factory AI Tables

export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["book", "course", "article"]).notNull(),
  targetPages: int("targetPages").default(50).notNull(),
  status: mysqlEnum("status", ["planning", "in_progress", "completed", "paused"]).default("planning").notNull(),
  globalSummary: text("globalSummary"),
  outline: text("outline"), // JSON string of chapter structure
  agentConfig: text("agentConfig"), // JSON string of agent configurations
  currentChapter: int("currentChapter").default(0),
  totalChapters: int("totalChapters").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

export const chapters = mysqlTable("chapters", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  chapterId: varchar("chapterId", { length: 100 }).notNull(),
  order: int("order").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  status: mysqlEnum("status", ["pending", "researching", "writing", "reviewing", "generating_images", "completed"]).default("pending").notNull(),
  researchContent: text("researchContent"),
  researchSources: text("researchSources"), // JSON array of sources
  draftContent: text("draftContent"),
  reviewedContent: text("reviewedContent"),
  finalContent: text("finalContent"),
  wordCount: int("wordCount").default(0),
  images: text("images"), // JSON array of image objects
  contextSummary: text("contextSummary"),
  keyPoints: text("keyPoints"), // JSON array
  connections: text("connections"), // JSON array
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Chapter = typeof chapters.$inferSelect;
export type InsertChapter = typeof chapters.$inferInsert;

export const agentLogs = mysqlTable("agent_logs", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  chapterId: int("chapterId").references(() => chapters.id, { onDelete: "cascade" }),
  agentType: mysqlEnum("agentType", ["editor", "researcher", "writer", "reviewer", "artist"]).notNull(),
  model: varchar("model", { length: 100 }).notNull(),
  inputTokens: int("inputTokens").default(0),
  outputTokens: int("outputTokens").default(0),
  duration: int("duration").default(0), // milliseconds
  status: mysqlEnum("status", ["success", "error"]).default("success").notNull(),
  errorMessage: text("errorMessage"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AgentLog = typeof agentLogs.$inferSelect;
export type InsertAgentLog = typeof agentLogs.$inferInsert;