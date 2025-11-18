/**
 * AI Agents for Content Generation
 * Each agent has a specific role in the content creation pipeline
 */

import { callOpenRouter, OpenRouterMessage } from "./openrouter";
import { createAgentLog } from "./db";

export interface AgentContext {
  projectId: number;
  chapterId?: number;
  globalSummary?: string;
  previousChapters?: Array<{
    title: string;
    summary: string;
  }>;
}

export interface AgentResult {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
  };
  duration: number;
}

/**
 * Log agent execution for analytics and debugging
 */
async function logAgentExecution(
  agentType: "editor" | "researcher" | "writer" | "reviewer" | "artist",
  model: string,
  projectId: number,
  chapterId: number | undefined,
  tokensUsed: { input: number; output: number },
  duration: number,
  status: "success" | "error",
  errorMessage?: string
) {
  try {
    await createAgentLog({
      projectId,
      chapterId: chapterId || null,
      agentType,
      model,
      inputTokens: tokensUsed.input,
      outputTokens: tokensUsed.output,
      duration,
      status,
      errorMessage: errorMessage || null,
    });
  } catch (error) {
    console.error("Failed to log agent execution:", error);
  }
}

/**
 * Editor Agent - Orchestrates the content creation process
 * Responsibilities:
 * - Create chapter outlines
 * - Validate content coherence
 * - Maintain global context
 * - Make final decisions
 */
export async function editorAgent(
  model: string,
  task: string,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();
  
  const systemPrompt = `Você é o Editor-Chefe de uma fábrica de conteúdo. Seu papel é:
1. Orquestrar a criação de conteúdo de alta qualidade
2. Garantir coesão e coerência entre capítulos
3. Manter o foco no tema central
4. Tomar decisões editoriais finais

Você tem acesso ao resumo geral do material e aos capítulos anteriores para manter a consistência.`;

  const contextInfo = [];
  if (context.globalSummary) {
    contextInfo.push(`Resumo Geral: ${context.globalSummary}`);
  }
  if (context.previousChapters && context.previousChapters.length > 0) {
    contextInfo.push(`Capítulos Anteriores:\n${context.previousChapters.map(ch => `- ${ch.title}: ${ch.summary}`).join('\n')}`);
  }

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `${contextInfo.join('\n\n')}\n\nTarefa: ${task}` },
  ];

  try {
    const response = await callOpenRouter({
      model,
      messages,
      temperature: 0.7,
      max_tokens: 4000,
    });

    const duration = Date.now() - startTime;
    const result: AgentResult = {
      content: response.choices[0].message.content,
      tokensUsed: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
      },
      duration,
    };

    await logAgentExecution(
      "editor",
      model,
      context.projectId,
      context.chapterId,
      result.tokensUsed,
      duration,
      "success"
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logAgentExecution(
      "editor",
      model,
      context.projectId,
      context.chapterId,
      { input: 0, output: 0 },
      duration,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Researcher Agent - Gathers and validates information
 * Responsibilities:
 * - Research topics
 * - Validate facts
 * - Provide sources
 * - Gather relevant data
 */
export async function researcherAgent(
  model: string,
  topic: string,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();
  
  const systemPrompt = `Você é um Pesquisador especializado. Seu papel é:
1. Pesquisar informações relevantes e precisas sobre o tópico
2. Validar fatos e dados
3. Fornecer fontes confiáveis
4. Organizar informações de forma estruturada

Seja factual, preciso e cite fontes quando possível.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Pesquise sobre: ${topic}\n\nForneça informações detalhadas, dados relevantes e organize o conteúdo de forma estruturada.` },
  ];

  try {
    const response = await callOpenRouter({
      model,
      messages,
      temperature: 0.5,
      max_tokens: 3000,
    });

    const duration = Date.now() - startTime;
    const result: AgentResult = {
      content: response.choices[0].message.content,
      tokensUsed: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
      },
      duration,
    };

    await logAgentExecution(
      "researcher",
      model,
      context.projectId,
      context.chapterId,
      result.tokensUsed,
      duration,
      "success"
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logAgentExecution(
      "researcher",
      model,
      context.projectId,
      context.chapterId,
      { input: 0, output: 0 },
      duration,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Writer Agent - Creates the actual content
 * Responsibilities:
 * - Write engaging content
 * - Maintain consistent tone and style
 * - Adapt to target audience
 * - Create well-structured text
 */
export async function writerAgent(
  model: string,
  chapterTitle: string,
  researchContent: string,
  targetWords: number,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();
  
  const systemPrompt = `Você é um Escritor profissional. Seu papel é:
1. Criar conteúdo envolvente e bem escrito
2. Manter tom e estilo consistentes
3. Adaptar o conteúdo ao público-alvo
4. Estruturar o texto de forma lógica e fluida

Escreva de forma clara, objetiva e interessante.`;

  const contextInfo = [];
  if (context.globalSummary) {
    contextInfo.push(`Contexto Geral: ${context.globalSummary}`);
  }
  if (context.previousChapters && context.previousChapters.length > 0) {
    const lastChapters = context.previousChapters.slice(-3);
    contextInfo.push(`Últimos Capítulos:\n${lastChapters.map(ch => `- ${ch.title}`).join('\n')}`);
  }

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `${contextInfo.join('\n\n')}\n\nCapítulo: ${chapterTitle}\n\nPesquisa:\n${researchContent}\n\nEscreva um capítulo completo com aproximadamente ${targetWords} palavras. Mantenha a coesão com o material anterior e o contexto geral.` },
  ];

  try {
    const response = await callOpenRouter({
      model,
      messages,
      temperature: 0.8,
      max_tokens: Math.min(targetWords * 2, 8000),
    });

    const duration = Date.now() - startTime;
    const result: AgentResult = {
      content: response.choices[0].message.content,
      tokensUsed: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
      },
      duration,
    };

    await logAgentExecution(
      "writer",
      model,
      context.projectId,
      context.chapterId,
      result.tokensUsed,
      duration,
      "success"
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logAgentExecution(
      "writer",
      model,
      context.projectId,
      context.chapterId,
      { input: 0, output: 0 },
      duration,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Reviewer Agent - Ensures quality and coherence
 * Responsibilities:
 * - Review grammar and spelling
 * - Check coherence and flow
 * - Suggest improvements
 * - Validate narrative structure
 */
export async function reviewerAgent(
  model: string,
  draftContent: string,
  chapterTitle: string,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();
  
  const systemPrompt = `Você é um Revisor profissional. Seu papel é:
1. Revisar gramática, ortografia e pontuação
2. Verificar coesão e coerência
3. Sugerir melhorias de estilo
4. Validar a estrutura narrativa

Seja crítico mas construtivo. Mantenha o estilo do autor enquanto melhora a qualidade.`;

  const messages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Capítulo: ${chapterTitle}\n\nRascunho:\n${draftContent}\n\nRevise este conteúdo, corrija erros, melhore a fluidez e retorne a versão final editada.` },
  ];

  try {
    const response = await callOpenRouter({
      model,
      messages,
      temperature: 0.3,
      max_tokens: 8000,
    });

    const duration = Date.now() - startTime;
    const result: AgentResult = {
      content: response.choices[0].message.content,
      tokensUsed: {
        input: response.usage.prompt_tokens,
        output: response.usage.completion_tokens,
      },
      duration,
    };

    await logAgentExecution(
      "reviewer",
      model,
      context.projectId,
      context.chapterId,
      result.tokensUsed,
      duration,
      "success"
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logAgentExecution(
      "reviewer",
      model,
      context.projectId,
      context.chapterId,
      { input: 0, output: 0 },
      duration,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}

/**
 * Artist Agent - Generates images for content
 * Responsibilities:
 * - Generate illustrations
 * - Create diagrams
 * - Maintain visual consistency
 */
export async function artistAgent(
  model: string,
  prompt: string,
  context: AgentContext
): Promise<AgentResult> {
  const startTime = Date.now();
  
  // For image generation, we'll use the built-in image generation helper
  // This is a placeholder that will be implemented with actual image generation
  try {
    // TODO: Implement actual image generation using OpenRouter or dedicated image API
    const result: AgentResult = {
      content: `Image generation prompt: ${prompt}`,
      tokensUsed: {
        input: 0,
        output: 0,
      },
      duration: Date.now() - startTime,
    };

    await logAgentExecution(
      "artist",
      model,
      context.projectId,
      context.chapterId,
      result.tokensUsed,
      result.duration,
      "success"
    );

    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    await logAgentExecution(
      "artist",
      model,
      context.projectId,
      context.chapterId,
      { input: 0, output: 0 },
      duration,
      "error",
      error instanceof Error ? error.message : String(error)
    );
    throw error;
  }
}
