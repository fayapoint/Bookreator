"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/server/current-user";
import { regenerateChapter } from "@/server/services/projects";

export type ChapterActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function regenerateChapterAction(projectId: string, chapterId: string): Promise<ChapterActionResult> {
  if (!projectId || !chapterId) {
    return { status: "error", message: "Capítulo inválido" };
  }

  const userId = getCurrentUserId();

  try {
    await regenerateChapter(userId, projectId, chapterId);
    revalidatePath(`/project/${projectId}`);
    return { status: "success", message: "Capítulo regenerado" };
  } catch (error) {
    console.error("Failed to regenerate chapter", error);
    return {
      status: "error",
      message:
        error instanceof Error ? error.message : "Não foi possível regenerar o capítulo. Tente novamente.",
    };
  }
}
