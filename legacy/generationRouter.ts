/**
 * Generation Router
 * Handles the orchestration of content generation using AI agents
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { 
  getProjectById, 
  getChaptersByProjectId, 
  createChapter, 
  updateChapter, 
  updateProject,
  getChapterById
} from "./db";
import { 
  editorAgent, 
  researcherAgent, 
  writerAgent, 
  reviewerAgent 
} from "./agents";
import type { AgentConfig, ChapterOutline } from "../drizzle/schema";

export const generationRouter = router({
  /**
   * Start generating content for a project
   * This will process all chapters sequentially
   */
  startGeneration: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      if (project.status !== "planning") {
        throw new Error("Project must be in planning status to start generation");
      }
      
      // Update project status to in_progress
      await updateProject(project.id, { status: "in_progress" });
      
      // Parse outline and agent config
      const outline: ChapterOutline[] = JSON.parse(project.outline || "[]");
      const agentConfig: AgentConfig = JSON.parse(project.agentConfig || "{}");
      
      // Create chapter records
      for (const chapterOutline of outline) {
        await createChapter({
          projectId: project.id,
          chapterId: chapterOutline.chapterId,
          order: chapterOutline.order,
          title: chapterOutline.title,
          status: "pending",
        });
      }
      
      return { success: true, message: "Generation started" };
    }),
  
  /**
   * Generate a single chapter
   * This is the core orchestration logic
   */
  generateChapter: protectedProcedure
    .input(z.object({ 
      projectId: z.number(),
      chapterId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      const chapter = await getChapterById(input.chapterId);
      if (!chapter || chapter.projectId !== project.id) {
        throw new Error("Chapter not found or access denied");
      }
      
      const agentConfig: AgentConfig = JSON.parse(project.agentConfig || "{}");
      
      // Get previous chapters for context
      const allChapters = await getChaptersByProjectId(project.id);
      const previousChapters = allChapters
        .filter(ch => ch.order < chapter.order && ch.status === "completed")
        .map(ch => ({
          title: ch.title,
          summary: ch.contextSummary || "",
        }));
      
      const context = {
        projectId: project.id,
        chapterId: chapter.id,
        globalSummary: project.globalSummary || undefined,
        previousChapters,
      };
      
      try {
        // Step 1: Research
        await updateChapter(chapter.id, { status: "researching" });
        
        const researchResult = await researcherAgent(
          agentConfig.researcher.model,
          chapter.title,
          context
        );
        
        await updateChapter(chapter.id, { 
          researchContent: researchResult.content,
        });
        
        // Step 2: Write
        await updateChapter(chapter.id, { status: "writing" });
        
        const targetWords = Math.floor((project.targetPages * 500) / (project.totalChapters || 1));
        
        const writerResult = await writerAgent(
          agentConfig.writer.model,
          chapter.title,
          researchResult.content,
          targetWords,
          context
        );
        
        await updateChapter(chapter.id, { 
          draftContent: writerResult.content,
          wordCount: writerResult.content.split(/\s+/).length,
        });
        
        // Step 3: Review
        await updateChapter(chapter.id, { status: "reviewing" });
        
        const reviewResult = await reviewerAgent(
          agentConfig.reviewer.model,
          writerResult.content,
          chapter.title,
          context
        );
        
        await updateChapter(chapter.id, { 
          reviewedContent: reviewResult.content,
          finalContent: reviewResult.content,
        });
        
        // Step 4: Editor validates and creates context summary
        const editorTask = `Analise o capítulo "${chapter.title}" que foi criado e:
1. Crie um resumo conciso (2-3 frases) do capítulo
2. Liste os 3-5 pontos-chave abordados
3. Identifique conexões com capítulos anteriores
4. Atualize o resumo geral do material considerando este novo capítulo

Capítulo:\n${reviewResult.content}`;
        
        const editorResult = await editorAgent(
          agentConfig.editor.model,
          editorTask,
          context
        );
        
        // Parse editor response to extract summary and key points
        const contextSummary = editorResult.content.substring(0, 500);
        
        await updateChapter(chapter.id, { 
          status: "completed",
          contextSummary,
        });
        
        // Update project progress
        await updateProject(project.id, {
          currentChapter: chapter.order,
          globalSummary: editorResult.content,
        });
        
        return { 
          success: true, 
          chapter: {
            id: chapter.id,
            title: chapter.title,
            status: "completed",
            wordCount: writerResult.content.split(/\s+/).length,
          }
        };
        
      } catch (error) {
        await updateChapter(chapter.id, { status: "pending" });
        throw error;
      }
    }),
  
  /**
   * Get generation progress for a project
   */
  getProgress: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      const chapters = await getChaptersByProjectId(project.id);
      
      const progress = {
        total: chapters.length,
        completed: chapters.filter(ch => ch.status === "completed").length,
        inProgress: chapters.filter(ch => ch.status !== "pending" && ch.status !== "completed").length,
        pending: chapters.filter(ch => ch.status === "pending").length,
        currentChapter: project.currentChapter,
        status: project.status,
      };
      
      return progress;
    }),
  
  /**
   * Pause generation
   */
  pauseGeneration: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      await updateProject(project.id, { status: "paused" });
      
      return { success: true };
    }),
  
  /**
   * Resume generation
   */
  resumeGeneration: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      await updateProject(project.id, { status: "in_progress" });
      
      return { success: true };
    }),
});
