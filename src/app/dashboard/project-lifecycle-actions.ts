"use server";

import { revalidatePath } from "next/cache";

import { getCurrentUserId } from "@/server/current-user";
import { cancelProject, deleteProject, pauseProject, resumeProject, runPendingChapters } from "@/server/services/projects";

export type LifecycleActionResult =
  | { status: "success"; message: string }
  | { status: "error"; message: string };

async function performLifecycleAction(
  projectId: string,
  handler: (userId: string, projectId: string) => Promise<unknown>,
  successMessage: string
): Promise<LifecycleActionResult> {
  if (!projectId) {
    return { status: "error", message: "Projeto inválido" };
  }

  const userId = getCurrentUserId();

  try {
    await handler(userId, projectId);
    revalidatePath("/dashboard");
    revalidatePath(`/project/${projectId}`);
    return { status: "success", message: successMessage };
  } catch (error) {
    console.error(`Lifecycle action failed for project ${projectId}`, error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Falha ao atualizar projeto",
    };
  }
}

export async function pauseProjectAction(projectId: string) {
  return performLifecycleAction(projectId, pauseProject, "Projeto pausado");
}

export async function resumeProjectAction(projectId: string) {
  return performLifecycleAction(projectId, resumeProject, "Produção retomada");
}

export async function runPendingChaptersAction(projectId: string) {
  return performLifecycleAction(projectId, runPendingChapters, "Capítulos pendentes em geração");
}

export async function cancelProjectAction(projectId: string) {
  return performLifecycleAction(projectId, cancelProject, "Projeto cancelado");
}

export async function deleteProjectAction(projectId: string) {
  return performLifecycleAction(projectId, deleteProject, "Projeto excluído");
}
