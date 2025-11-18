"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUserId } from "@/server/current-user";
import { createProject, type CreateProjectInput } from "@/server/services/projects";

const newProjectSchema = z.object({
  title: z.string().min(3, "Informe um título com pelo menos 3 caracteres"),
  description: z.string().max(500).optional(),
  type: z.enum(["book", "course", "article"]),
  targetPages: z.coerce.number().min(1).max(250),
  outline: z
    .string()
    .min(1, "Insira pelo menos um capítulo")
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
});

export type CreateProjectActionState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "success"; projectId: string; message: string };

export async function createProjectAction(prevState: CreateProjectActionState, formData: FormData) {
  const parsed = newProjectSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    targetPages: formData.get("targetPages"),
    outline: formData.get("outline"),
  });

  if (!parsed.success) {
    return {
      status: "error" as const,
      message: parsed.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const { title, description, type, targetPages, outline } = parsed.data;

  const payload: CreateProjectInput = {
    title,
    description,
    type,
    targetPages,
    outline: outline.map((line, index) => ({
      title: line,
      order: index + 1,
      estimatedWords: Math.floor((targetPages * 500) / outline.length),
    })),
  };

  try {
    const userId = getCurrentUserId();
    const project = await createProject(userId, payload);
    revalidatePath("/dashboard");
    return {
      status: "success" as const,
      projectId: project.id,
      message: "Projeto criado com sucesso!",
    };
  } catch (error) {
    console.error("Failed to create project", error);
    return {
      status: "error" as const,
      message: "Não foi possível criar o projeto. Tente novamente.",
    };
  }
}
