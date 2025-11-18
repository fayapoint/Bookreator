/**
 * Generation Worker
 * Handles background processing of chapter generation
 */

import {
  getProjectById,
  getChaptersByProjectId,
  updateProject,
  getChapterById,
} from "./db";
import type { AgentConfig } from "../drizzle/schema";

/**
 * Process a single chapter generation
 * This should be called from the generation router
 */
export async function processChapterGeneration(
  projectId: number,
  chapterId: number
): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  const chapter = await getChapterById(chapterId);
  if (!chapter || chapter.projectId !== projectId) {
    throw new Error("Chapter not found");
  }

  // The actual generation logic is in the generationRouter
  // This is a placeholder for future background processing
  console.log(`Processing chapter ${chapterId} for project ${projectId}`);
}

/**
 * Process all pending chapters for a project
 */
export async function processProjectGeneration(projectId: number): Promise<void> {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new Error("Project not found");
  }

  if (project.status !== "in_progress") {
    throw new Error("Project is not in progress");
  }

  const chapters = await getChaptersByProjectId(projectId);
  const pendingChapters = chapters
    .filter((ch) => ch.status === "pending")
    .sort((a, b) => a.order - b.order);

  console.log(`Found ${pendingChapters.length} pending chapters for project ${projectId}`);

  // Process chapters sequentially
  for (const chapter of pendingChapters) {
    // Check if project is still in progress
    const currentProject = await getProjectById(projectId);
    if (currentProject?.status !== "in_progress") {
      console.log(`Project ${projectId} is no longer in progress, stopping generation`);
      break;
    }

    await processChapterGeneration(projectId, chapter.id);
  }

  // Update project status to completed if all chapters are done
  const allChapters = await getChaptersByProjectId(projectId);
  const allCompleted = allChapters.every((ch) => ch.status === "completed");

  if (allCompleted) {
    await updateProject(projectId, { status: "completed" });
    console.log(`Project ${projectId} generation completed`);
  }
}

/**
 * Estimate time and cost for project generation
 */
export function estimateProjectCost(
  targetPages: number,
  totalChapters: number
): {
  estimatedTime: number; // in minutes
  estimatedTokens: number;
  estimatedCost: number; // in USD
} {
  const wordsPerPage = 500;
  const totalWords = targetPages * wordsPerPage;
  const wordsPerChapter = totalWords / totalChapters;

  // Rough estimates based on typical usage
  const tokensPerWord = 1.3; // Average tokens per word
  const totalTokens = totalWords * tokensPerWord * 3; // 3x for input/output/context

  // Estimate time: ~2-3 seconds per 100 tokens
  const estimatedTime = Math.ceil((totalTokens / 100) * 2.5 / 60); // in minutes

  // Estimate cost: ~$0.01 per 1000 tokens (average across models)
  const estimatedCost = (totalTokens / 1000) * 0.01;

  return {
    estimatedTime,
    estimatedTokens: Math.ceil(totalTokens),
    estimatedCost: parseFloat(estimatedCost.toFixed(2)),
  };
}
