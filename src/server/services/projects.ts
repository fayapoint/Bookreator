"use server";

import "server-only";
import { randomUUID } from "crypto";
import { connectToDatabase } from "../db";
import { ProjectModel, type Project } from "../models/project";
import { ChapterModel, type Chapter } from "../models/chapter";
import { AgentLogModel, type AgentLog } from "../models/agent-log";
import { ENV } from "../env";

type Serializable<T> = T extends infer U ? U : never;

type CreateProjectInput = {
  title: string;
  description?: string;
  type: "book" | "course" | "article";
  targetPages: number;
  outline: Array<{
    title: string;
    description?: string;
    order: number;
    estimatedWords?: number;
    chapterId?: string;
  }>;
  agentConfig?: Serializable<Project["agentConfig"]>;
};

const defaultAgentConfig: Project["agentConfig"] = {
  editor: { model: "deepseek/deepseek-v3.2-exp" },
  researcher: { model: "deepseek/deepseek-v3.2-exp" },
  writer: { model: "deepseek/deepseek-v3.2-exp" },
  reviewer: { model: "deepseek/deepseek-v3.2-exp" },
  // Usamos um modelo de texto (DeepSeek) para gerar prompts de imagem, sem depender de endpoints de imagem.
  artist: { model: "deepseek/deepseek-v3.2-exp" },
};

function serializeProject(doc: any): Project {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
  } as Project;
}

function serializeChapter(doc: any): Chapter {
  const { _id, projectId, ...rest } = doc;
  return {
    id: _id.toString(),
    projectId: projectId.toString(),
    ...rest,
  } as Chapter;
}

function serializeAgentLog(doc: any): AgentLog {
  const { _id, projectId, chapterId, ...rest } = doc;
  return {
    id: _id.toString(),
    projectId: projectId.toString(),
    chapterId: chapterId ? chapterId.toString() : undefined,
    ...rest,
  } as AgentLog;
}

export async function getProjectsByUser(userId: string): Promise<Project[]> {
  await connectToDatabase();
  const projects = await ProjectModel.find({ userId }).sort({ updatedAt: -1 }).lean();
  return projects.map(serializeProject);
}

export async function getProjectById(userId: string, projectId: string): Promise<Project | null> {
  await connectToDatabase();
  const project = await ProjectModel.findOne({ _id: projectId, userId }).lean();
  return project ? serializeProject(project) : null;
}

export async function getChaptersByProject(projectId: string): Promise<Chapter[]> {
  await connectToDatabase();
  const chapters = await ChapterModel.find({ projectId }).sort({ order: 1 }).lean();
  return chapters.map(serializeChapter);
}

export async function getAgentLogsByProject(projectId: string): Promise<AgentLog[]> {
  await connectToDatabase();
  const logs = await AgentLogModel.find({ projectId }).sort({ createdAt: -1 }).limit(25).lean();
  return logs.map(serializeAgentLog);
}

async function assertProjectOwnership(userId: string, projectId: string) {
  const project = await ProjectModel.findOne({ _id: projectId, userId });
  if (!project) {
    throw new Error("Projeto não encontrado ou acesso negado");
  }
  return project;
}

async function haltProjectChapters(projectId: string, newStatus: "paused" | "cancelled") {
  await ChapterModel.updateMany(
    { projectId, status: { $nin: ["completed", "cancelled"] } },
    { status: newStatus }
  );
}

async function callOpenRouterChat(model: string, systemPrompt: string, userPrompt: string) {
  const url = ENV.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions";

  const startedAt = Date.now();
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bookreator.app",
      "X-Title": "Bookreator Project Chapter Generation",
    },
    body: JSON.stringify({
      model,
      temperature: 0.75,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    }),
  });

  const duration = Date.now() - startedAt;

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro na IA: ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content as string | undefined;
  const usage = data?.usage || {};
  const inputTokens =
    usage.prompt_tokens ?? usage.input_tokens ?? usage.total_tokens ?? 0;
  const outputTokens =
    usage.completion_tokens ?? usage.output_tokens ?? 0;

  if (!content || typeof content !== "string") {
    throw new Error("Resposta da IA vazia ao gerar capítulo");
  }

  return {
    content,
    duration,
    inputTokens: typeof inputTokens === "number" ? inputTokens : 0,
    outputTokens: typeof outputTokens === "number" ? outputTokens : 0,
  } as const;
}

async function runWriterForChapter(projectDoc: any, chapterDoc: any) {
  let model =
    projectDoc.agentConfig?.writer?.model ??
    defaultAgentConfig?.writer?.model ??
    "deepseek/deepseek-v3.2-exp";

  // Normalizar IDs legados para o formato atual do OpenRouter
  if (typeof model === "string" && model.startsWith("openrouter/")) {
    model = model.replace(/^openrouter\//, "");
  }

  // Qualquer modelo fictício da família GPT-5 faz fallback para DeepSeek base
  if (typeof model === "string" && model.includes("gpt-5-")) {
    model = "deepseek/deepseek-v3.2-exp";
  }

  const estimatedChapters = projectDoc.totalChapters || 1;
  const targetWords = projectDoc.targetPages
    ? Math.floor((projectDoc.targetPages * 500) / estimatedChapters)
    : 800;

  const systemPrompt =
    "Você é um escritor especializado em cursos e livros práticos. Gere um capítulo completo, em português, bem estruturado, com introdução, seções claras, exemplos e conclusão.";

  const userPrompt = `
Contexto do projeto:
- Título: ${projectDoc.title}
- Tipo: ${projectDoc.type}
- Descrição: ${projectDoc.description || "(sem descrição)"}
- Meta de páginas: ${projectDoc.targetPages}

Capítulo a ser escrito:
- Ordem: ${chapterDoc.order}
- Título: ${chapterDoc.title}

Requisitos:
- Escreva em tom didático e profissional.
- Use markdown básico (títulos, listas, subtítulos) mas sem cabeçalho H1 global.
- Foque em entregar conteúdo utilizável imediatamente em um curso ou livro.
- Busque aproximadamente ${targetWords} palavras (pode variar um pouco para cima ou para baixo se necessário).
`; 

  console.log(
    `[ProjectAgents] Gerando capítulo ${chapterDoc.order} para projeto ${projectDoc._id} com modelo ${model}`
  );

  chapterDoc.status = "writing";
  await chapterDoc.save();

  try {
    const { content, duration, inputTokens, outputTokens } = await callOpenRouterChat(
      model,
      systemPrompt,
      userPrompt
    );

    const wordCount = content.split(/\s+/).filter(Boolean).length;

    chapterDoc.draftContent = content;
    chapterDoc.finalContent = content;
    chapterDoc.wordCount = wordCount;
    chapterDoc.status = "completed";
    await chapterDoc.save();

    await AgentLogModel.create({
      projectId: projectDoc._id,
      chapterId: chapterDoc._id,
      agentType: "writer",
      model,
      inputTokens,
      outputTokens,
      duration,
      status: "success",
    });

    // Após o texto, tentar gerar pelo menos um prompt de imagem
    try {
      await runDesignerForChapter(projectDoc, chapterDoc);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : String(error);
      console.error(
        `[ProjectAgents] Falha ao acionar designer para capítulo ${chapterDoc.order} do projeto ${projectDoc._id}: ${message}`
      );
    }

    // Em seguida, acionar o editor/supervisor para revisar e expandir se necessário
    try {
      await runEditorForChapter(projectDoc, chapterDoc, targetWords);
    } catch (error) {
      console.error(
        `[ProjectAgents] Falha ao acionar editor para capítulo ${chapterDoc.order} do projeto ${projectDoc._id}:`,
        error
      );
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido ao gerar capítulo";

    await AgentLogModel.create({
      projectId: projectDoc._id,
      chapterId: chapterDoc._id,
      agentType: "writer",
      model,
      inputTokens: 0,
      outputTokens: 0,
      duration: 0,
      status: "error",
      errorMessage: message,
    });

    chapterDoc.status = "paused";
    await chapterDoc.save();

    console.error(
      `[ProjectAgents] Falha ao gerar capítulo ${chapterDoc.order} para projeto ${projectDoc._id}:`,
      error
    );

    throw error;
  }
}

async function runDesignerForChapter(projectDoc: any, chapterDoc: any) {
  let model =
    projectDoc.agentConfig?.artist?.model ??
    defaultAgentConfig?.artist?.model ??
    "deepseek/deepseek-v3.2-exp";

  if (typeof model === "string" && model.startsWith("openrouter/")) {
    model = model.replace(/^openrouter\//, "");
  }

  // Mapear IDs legados relacionados a imagem para um modelo de texto estável
  if (
    model === "fal-ai/image-creation" ||
    model === "google/gemini-2.5-flash-image" ||
    model === "google/gemini-2.5-flash-image-preview" ||
    model === "google/gemini-2.5-flash-image-preview:free"
  ) {
    model = "deepseek/deepseek-v3.2-exp";
  }

  const systemPrompt =
    "Você é um diretor de arte especializado em criar prompts para modelos de imagem. Gere descrições ricas, mas concisas, em português.";

  const baseText =
    chapterDoc.finalContent ||
    chapterDoc.draftContent ||
    projectDoc.description ||
    "Curso ou livro educativo.";

  const snippet = String(baseText).slice(0, 800);

  const userPrompt = `
Gere UM prompt de imagem (apenas texto) para ilustrar o capítulo abaixo.

Capítulo: ${chapterDoc.order} - ${chapterDoc.title}

Resumo de contexto:
${snippet}

Requisitos do prompt de imagem:
- Foque em uma cena marcante que represente o conteúdo.
- Descreva estilo visual, enquadramento e atmosfera.
- Não use markdown, nem citação, nem explicações. Responda apenas com o prompt em uma única linha.
`;

  const { content, duration, inputTokens, outputTokens } = await callOpenRouterChat(
    model,
    systemPrompt,
    userPrompt
  );

  const images = Array.isArray(chapterDoc.images) ? [...chapterDoc.images] : [];
  images.push({
    type: "prompt",
    model,
    prompt: content.trim(),
    createdAt: new Date(),
  });
  chapterDoc.images = images;
  await chapterDoc.save();

  await AgentLogModel.create({
    projectId: projectDoc._id,
    chapterId: chapterDoc._id,
    agentType: "artist",
    model,
    inputTokens,
    outputTokens,
    duration,
    status: "success",
  });
}

async function runEditorForChapter(
  projectDoc: any,
  chapterDoc: any,
  targetWords: number
) {
  let model =
    projectDoc.agentConfig?.editor?.model ??
    defaultAgentConfig?.editor?.model ??
    "deepseek/deepseek-v3.2-exp";

  if (typeof model === "string" && model.startsWith("openrouter/")) {
    model = model.replace(/^openrouter\//, "");
  }

  const currentText =
    chapterDoc.finalContent || chapterDoc.reviewedContent || chapterDoc.draftContent || "";

  const currentWordCount = typeof currentText === "string"
    ? currentText.split(/\s+/).filter(Boolean).length
    : 0;

  const systemPrompt =
    "Você é um editor sênior e supervisor de qualidade de conteúdo. Sua função é revisar capítulos, garantir que requisitos sejam atendidos e expandir o conteúdo quando necessário.";

  const userPrompt = `
Você receberá o texto de um capítulo de um projeto (${projectDoc.type}).

Objetivos do supervisor/editor:
- Verificar se o capítulo cobre bem o tema proposto.
- Garantir que o texto esteja claro, bem estruturado e útil para o leitor.
- Comparar o comprimento atual (${currentWordCount} palavras) com a meta de ~${targetWords} palavras.
- Se estiver significativamente abaixo da meta, expandir principalmente as partes mais interessantes, com exemplos e detalhes práticos.
- Corrigir problemas de coesão, redundâncias e pontos fracos.

Responda SOMENTE em JSON válido, no seguinte formato:
{
  "status": "ok" | "expanded",
  "summary": "resumo curto do capítulo em 2-4 frases",
  "keyPoints": ["bullet 1", "bullet 2", "..."],
  "suggestions": ["sugestão 1", "sugestão 2", "..."],
  "finalContent": "texto completo revisado e, se necessário, expandido"
}

Texto do capítulo para revisão (em português, mantenha o mesmo idioma na saída):
"""
${currentText}
"""
`;

  const { content, duration, inputTokens, outputTokens } = await callOpenRouterChat(
    model,
    systemPrompt,
    userPrompt
  );

  let parsed: any = null;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    console.warn("[ProjectAgents] Falha ao fazer parse do JSON do editor; usando conteúdo bruto.");
  }

  const finalContent: string =
    (parsed && typeof parsed.finalContent === "string" && parsed.finalContent.trim()) || currentText;

  const summary: string | undefined =
    parsed && typeof parsed.summary === "string" && parsed.summary.trim()
      ? parsed.summary.trim()
      : undefined;

  const keyPoints: string[] = Array.isArray(parsed?.keyPoints)
    ? parsed.keyPoints.filter((item: unknown) => typeof item === "string" && item.trim())
    : [];

  const suggestions: string[] = Array.isArray(parsed?.suggestions)
    ? parsed.suggestions.filter((item: unknown) => typeof item === "string" && item.trim())
    : [];

  const newWordCount = typeof finalContent === "string"
    ? finalContent.split(/\s+/).filter(Boolean).length
    : currentWordCount;

  chapterDoc.reviewedContent = finalContent;
  if (summary) {
    chapterDoc.contextSummary = summary;
  }
  if (keyPoints.length > 0) {
    chapterDoc.keyPoints = keyPoints;
  }
  if (suggestions.length > 0) {
    chapterDoc.connections = suggestions;
  }
  chapterDoc.wordCount = newWordCount;
  await chapterDoc.save();

  await AgentLogModel.create({
    projectId: projectDoc._id,
    chapterId: chapterDoc._id,
    agentType: "editor",
    model,
    inputTokens,
    outputTokens,
    duration,
    status: "success",
  });
}

export async function pauseProject(userId: string, projectId: string) {
  await connectToDatabase();
  const project = await assertProjectOwnership(userId, projectId);
  if (project.status === "completed" || project.status === "cancelled") {
    throw new Error("Não é possível pausar um projeto finalizado ou cancelado");
  }
  project.status = "paused";
  await project.save();
  await haltProjectChapters(project._id, "paused");
  return serializeProject(project.toObject());
}

export async function resumeProject(userId: string, projectId: string) {
  await connectToDatabase();
  const project = await assertProjectOwnership(userId, projectId);
  if (project.status !== "paused") {
    throw new Error("Somente projetos pausados podem ser retomados");
  }
  project.status = "in_progress";
  await project.save();
  await ChapterModel.updateMany({ projectId, status: "paused" }, { status: "pending" });
  return serializeProject(project.toObject());
}

export async function cancelProject(userId: string, projectId: string) {
  await connectToDatabase();
  const project = await assertProjectOwnership(userId, projectId);
  if (project.status === "cancelled") {
    return serializeProject(project.toObject());
  }
  project.status = "cancelled";
  await project.save();
  await haltProjectChapters(project._id, "cancelled");
  return serializeProject(project.toObject());
}

export async function deleteProject(userId: string, projectId: string) {
  await connectToDatabase();
  await assertProjectOwnership(userId, projectId);
  await ChapterModel.deleteMany({ projectId });
  await AgentLogModel.deleteMany({ projectId });
  await ProjectModel.deleteOne({ _id: projectId });
  return { success: true };
}

export async function regenerateChapter(userId: string, projectId: string, chapterId: string) {
  await connectToDatabase();
  const project = await assertProjectOwnership(userId, projectId);

  const chapter = await ChapterModel.findOne({ _id: chapterId, projectId: project._id });
  if (!chapter) {
    throw new Error("Capítulo não encontrado");
  }

  console.log(
    `[ProjectAgents] Regenerando capítulo ${chapter.order} (${chapter._id}) do projeto ${project._id}`
  );

  // Mantemos histórico anterior (conteúdo e imagens), mas o novo texto substitui o finalContent
  await runWriterForChapter(project, chapter);

  return serializeChapter(chapter.toObject());
}

export async function runPendingChapters(userId: string, projectId: string) {
  await connectToDatabase();
  const project = await assertProjectOwnership(userId, projectId);

  if (project.status === "cancelled") {
    throw new Error("Não é possível gerar capítulos para um projeto cancelado");
  }

  console.log(
    `[ProjectAgents] Iniciando geração de capítulos pendentes para projeto ${project._id}`
  );

  project.status = "in_progress";
  await project.save();

  const chapters = await ChapterModel.find({
    projectId: project._id,
    status: "pending",
  })
    .sort({ order: 1 })
    .exec();

  if (chapters.length === 0) {
    console.log(
      `[ProjectAgents] Nenhum capítulo pendente encontrado para projeto ${project._id}`
    );
  }

  for (const chapter of chapters) {
    await runWriterForChapter(project, chapter);
  }

  const completedCount = await ChapterModel.countDocuments({
    projectId: project._id,
    status: "completed",
  });

  project.currentChapter = completedCount;
  if (project.totalChapters && completedCount >= project.totalChapters) {
    project.status = "completed";
  }
  await project.save();

  console.log(
    `[ProjectAgents] Conclusão da geração para projeto ${project._id} – capítulos completos: ${completedCount}/${project.totalChapters}`
  );

  return serializeProject(project.toObject());
}

export async function createProjectWithOutline(userId: string, data: {
  title: string;
  description?: string;
  type: "book" | "course" | "article";
  targetPages: number;
  chapters: number;
}) {
  await connectToDatabase();

  const outline = Array.from({ length: data.chapters }).map((_, index) => ({
    order: index + 1,
    title: `${data.title} - Capítulo ${index + 1}`,
    chapterId: randomUUID(),
  }));

  const project = await ProjectModel.create({
    userId,
    title: data.title,
    description: data.description,
    type: data.type,
    targetPages: data.targetPages,
    totalChapters: data.chapters,
    outline,
    agentConfig: defaultAgentConfig,
  });

  await ChapterModel.insertMany(
    outline.map((chapter) => ({
      projectId: project._id,
      chapterId: chapter.chapterId,
      order: chapter.order,
      title: chapter.title,
    }))
  );

  return serializeProject(project.toObject());
}

export async function createProject(userId: string, payload: CreateProjectInput) {
  await connectToDatabase();

  const outline = payload.outline.map((chapter, index) => ({
    order: chapter.order ?? index + 1,
    title: chapter.title,
    description: chapter.description,
    estimatedWords: chapter.estimatedWords,
    chapterId: chapter.chapterId ?? randomUUID(),
  }));

  const projectDoc = await ProjectModel.create({
    userId,
    title: payload.title,
    description: payload.description,
    type: payload.type,
    targetPages: payload.targetPages,
    totalChapters: outline.length,
    outline,
    agentConfig: payload.agentConfig || defaultAgentConfig,
  });

  await ChapterModel.insertMany(
    outline.map((chapter) => ({
      projectId: projectDoc._id,
      chapterId: chapter.chapterId,
      order: chapter.order,
      title: chapter.title,
      status: "pending",
    }))
  );

  return serializeProject(projectDoc.toObject());
}

export async function getProjectAnalytics(projectId: string) {
  await connectToDatabase();

  const [chapters, logs] = await Promise.all([
    ChapterModel.find({ projectId }).lean(),
    AgentLogModel.find({ projectId }).sort({ createdAt: -1 }).limit(50).lean(),
  ]);

  const chapterStats = {
    total: chapters.length,
    completed: chapters.filter((ch) => ch.status === "completed").length,
    inProgress: chapters.filter((ch) => !["pending", "completed"].includes(ch.status)).length,
    pending: chapters.filter((ch) => ch.status === "pending").length,
  };

  const tokenUsage = logs.reduce(
    (acc, log) => {
      const input = log.inputTokens || 0;
      const output = log.outputTokens || 0;
      acc.total += input + output;
      acc.input += input;
      acc.output += output;
      acc.durationMs += log.duration || 0;
      acc.agentCalls[log.agentType] = (acc.agentCalls[log.agentType] || 0) + 1;
      return acc;
    },
    {
      total: 0,
      input: 0,
      output: 0,
      durationMs: 0,
      agentCalls: {} as Record<string, number>,
    }
  );

  return {
    chapterStats,
    tokenUsage,
    recentLogs: logs.map(serializeAgentLog),
  };
}

export type { CreateProjectInput };
