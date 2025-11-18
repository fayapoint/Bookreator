/**
 * OpenRouter API Integration
 * Provides helpers for interacting with multiple LLM models through OpenRouter
 */

export interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Call OpenRouter API with the specified model and messages
 */
export async function callOpenRouter(
  request: OpenRouterRequest
): Promise<OpenRouterResponse> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.VITE_APP_URL || "https://manus.space",
      "X-Title": "Content Factory AI",
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${error}`);
  }

  return response.json();
}

/**
 * Get list of available models from OpenRouter
 */
export async function getAvailableModels(): Promise<Array<{
  id: string;
  name: string;
  description?: string;
  pricing?: {
    prompt: string;
    completion: string;
  };
}>> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  const response = await fetch("https://openrouter.ai/api/v1/models", {
    headers: {
      "Authorization": `Bearer ${apiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch models: ${response.status}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Default models for each agent type
 */
export const DEFAULT_AGENT_MODELS = {
  editor: "anthropic/claude-3.5-sonnet",
  researcher: "openai/gpt-4-turbo",
  writer: "anthropic/claude-3.5-sonnet",
  reviewer: "openai/gpt-4-turbo",
  artist: "openai/dall-e-3",
} as const;

/**
 * Recommended models for each agent type with descriptions
 */
export const RECOMMENDED_MODELS = {
  editor: [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Excelente para raciocínio complexo e orquestração" },
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", description: "Ótimo para análise e tomada de decisões" },
    { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", description: "Máxima capacidade de raciocínio" },
  ],
  researcher: [
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", description: "Excelente para pesquisa e análise factual" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Ótimo para síntese de informações" },
    { id: "perplexity/llama-3.1-sonar-large-128k-online", name: "Perplexity Sonar", description: "Acesso a informações atualizadas" },
  ],
  writer: [
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Excelente para escrita criativa e técnica" },
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", description: "Versátil para diversos estilos" },
    { id: "anthropic/claude-3-opus", name: "Claude 3 Opus", description: "Máxima qualidade de escrita" },
  ],
  reviewer: [
    { id: "openai/gpt-4-turbo", name: "GPT-4 Turbo", description: "Excelente para revisão e crítica" },
    { id: "anthropic/claude-3.5-sonnet", name: "Claude 3.5 Sonnet", description: "Ótimo para análise de coesão" },
  ],
  artist: [
    { id: "openai/dall-e-3", name: "DALL-E 3", description: "Alta qualidade e compreensão de prompts" },
    { id: "stability-ai/stable-diffusion-xl", name: "Stable Diffusion XL", description: "Flexível e customizável" },
  ],
} as const;
