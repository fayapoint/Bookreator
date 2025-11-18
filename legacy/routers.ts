import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { generationRouter } from "./generationRouter";
import { exportRouter } from "./exportRouter";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // Content Factory AI Routers
  projects: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      const { getProjectsByUserId } = await import("./db");
      return getProjectsByUserId(ctx.user.id);
    }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getProjectById } = await import("./db");
        const project = await getProjectById(input.id);
        
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Project not found or access denied");
        }
        
        return project;
      }),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        type: z.enum(["book", "course", "article"]),
        targetPages: z.number().min(1).max(250).default(50),
        outline: z.array(z.object({
          chapterId: z.string(),
          title: z.string(),
          description: z.string(),
          order: z.number(),
          estimatedWords: z.number().optional(),
        })),
        agentConfig: z.object({
          editor: z.object({ model: z.string() }),
          researcher: z.object({ model: z.string() }),
          writer: z.object({ model: z.string() }),
          reviewer: z.object({ model: z.string() }),
          artist: z.object({ model: z.string(), imageModel: z.string().optional() }),
        }),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createProject } = await import("./db");
        
        const project = await createProject({
          userId: ctx.user.id,
          title: input.title,
          description: input.description || null,
          type: input.type,
          targetPages: input.targetPages,
          status: "planning",
          outline: JSON.stringify(input.outline),
          agentConfig: JSON.stringify(input.agentConfig),
          totalChapters: input.outline.length,
          currentChapter: 0,
        });
        
        return project;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.enum(["planning", "in_progress", "completed", "paused"]).optional(),
        globalSummary: z.string().optional(),
        currentChapter: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getProjectById, updateProject } = await import("./db");
        
        const project = await getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Project not found or access denied");
        }
        
        const { id, ...updates } = input;
        await updateProject(id, updates);
        
        return { success: true };
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getProjectById, deleteProject } = await import("./db");
        
        const project = await getProjectById(input.id);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Project not found or access denied");
        }
        
        await deleteProject(input.id);
        return { success: true };
      }),
  }),
  
  chapters: router({
    list: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getProjectById, getChaptersByProjectId } = await import("./db");
        
        const project = await getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Project not found or access denied");
        }
        
        return getChaptersByProjectId(input.projectId);
      }),
    
    get: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getChapterById, getProjectById } = await import("./db");
        
        const chapter = await getChapterById(input.id);
        if (!chapter) {
          throw new Error("Chapter not found");
        }
        
        const project = await getProjectById(chapter.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        
        return chapter;
      }),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        status: z.enum(["pending", "researching", "writing", "reviewing", "generating_images", "completed"]).optional(),
        finalContent: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getChapterById, getProjectById, updateChapter } = await import("./db");
        
        const chapter = await getChapterById(input.id);
        if (!chapter) {
          throw new Error("Chapter not found");
        }
        
        const project = await getProjectById(chapter.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Access denied");
        }
        
        const { id, ...updates } = input;
        await updateChapter(id, updates);
        
        return { success: true };
      }),
  }),
  
  models: router({
    list: publicProcedure.query(async () => {
      const { RECOMMENDED_MODELS } = await import("./openrouter");
      return RECOMMENDED_MODELS;
    }),
    
    available: publicProcedure.query(async () => {
      const { getAvailableModels } = await import("./openrouter");
      try {
        return await getAvailableModels();
      } catch (error) {
        console.error("Failed to fetch available models:", error);
        return [];
      }
    }),
  }),
  
  analytics: router({
    projectStats: protectedProcedure
      .input(z.object({ projectId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getProjectById, getAgentLogsByProjectId } = await import("./db");
        
        const project = await getProjectById(input.projectId);
        if (!project || project.userId !== ctx.user.id) {
          throw new Error("Project not found or access denied");
        }
        
        const logs = await getAgentLogsByProjectId(input.projectId);
        
        const stats = {
          totalTokens: logs.reduce((sum, log) => sum + (log.inputTokens || 0) + (log.outputTokens || 0), 0),
          totalDuration: logs.reduce((sum, log) => sum + (log.duration || 0), 0),
          agentCalls: {
            editor: logs.filter(l => l.agentType === "editor").length,
            researcher: logs.filter(l => l.agentType === "researcher").length,
            writer: logs.filter(l => l.agentType === "writer").length,
            reviewer: logs.filter(l => l.agentType === "reviewer").length,
            artist: logs.filter(l => l.agentType === "artist").length,
          },
          errors: logs.filter(l => l.status === "error").length,
        };
        
        return stats;
      }),
  }),
  
  generation: generationRouter,
  export: exportRouter,
});

export type AppRouter = typeof appRouter;
