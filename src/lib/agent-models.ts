export type AgentModel = {
  value: string;
  label: string;
  provider: string;
  price: {
    inputPerM: number; // USD per million input tokens
    outputPerM: number; // USD per million output tokens
  };
};

export const AVAILABLE_AGENT_MODELS: AgentModel[] = [
  // DeepSeek – base / custo-prioritário
  {
    value: "deepseek/deepseek-v3.2-exp",
    label: "DeepSeek V3.2 Exp",
    provider: "DeepSeek",
    price: { inputPerM: 0.27, outputPerM: 0.4 },
  },
  {
    value: "deepseek/deepseek-v3",
    label: "DeepSeek V3",
    provider: "DeepSeek",
    price: { inputPerM: 0.14, outputPerM: 0.28 },
  },
  {
    value: "deepseek/deepseek-r1",
    label: "DeepSeek R1 (Reasoner)",
    provider: "DeepSeek",
    price: { inputPerM: 0.55, outputPerM: 1.1 },
  },

  // Anthropic – reasoning premium
  {
    value: "anthropic/claude-3.5-sonnet",
    label: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    price: { inputPerM: 3, outputPerM: 15 },
  },
  {
    value: "anthropic/claude-3.5-haiku",
    label: "Claude 3.5 Haiku",
    provider: "Anthropic",
    price: { inputPerM: 1.5, outputPerM: 5 },
  },

  // OpenAI – modelos amplamente suportados
  {
    value: "openai/gpt-4o",
    label: "GPT-4o",
    provider: "OpenAI",
    price: { inputPerM: 5, outputPerM: 15 },
  },
  {
    value: "openai/gpt-4o-mini",
    label: "GPT-4o Mini",
    provider: "OpenAI",
    price: { inputPerM: 0.6, outputPerM: 2.4 },
  },

  // Mistral – bom custo/benefício
  {
    value: "mistralai/mistral-large",
    label: "Mistral Large",
    provider: "Mistral",
    price: { inputPerM: 2, outputPerM: 6 },
  },
  {
    value: "mistralai/mistral-small",
    label: "Mistral Small",
    provider: "Mistral",
    price: { inputPerM: 0.3, outputPerM: 0.9 },
  },

  // Meta Llama – open weights
  {
    value: "meta-llama/llama-3.1-8b-instruct",
    label: "Llama 3.1 8B",
    provider: "Meta",
    price: { inputPerM: 0.15, outputPerM: 0.3 },
  },

  // Google Gemini – image ("Nano Banana")
  {
    value: "google/gemini-2.5-flash-image",
    label: "Gemini 2.5 Flash Image",
    provider: "Google",
    price: { inputPerM: 0.6, outputPerM: 2.0 },
  },
  {
    value: "google/gemini-2.5-flash-image-preview:free",
    label: "Gemini 2.5 Flash Image Preview (Free)",
    provider: "Google",
    price: { inputPerM: 0, outputPerM: 0 },
  },

  // NVIDIA Nemotron – multimodal vídeo / documentos (free)
  {
    value: "nvidia/nemotron-nano-12b-v2-vl:free",
    label: "Nemotron Nano 12B 2 VL (Free)",
    provider: "NVIDIA",
    price: { inputPerM: 0, outputPerM: 0 },
  },
] as const;

export const DEFAULT_AGENT_CONFIG = {
  editor: { model: "deepseek/deepseek-v3.2-exp", label: "DeepSeek V3.2 Exp" },
  researcher: { model: "deepseek/deepseek-v3.2-exp", label: "DeepSeek V3.2 Exp" },
  writer: { model: "deepseek/deepseek-v3.2-exp", label: "DeepSeek V3.2 Exp" },
  reviewer: { model: "deepseek/deepseek-v3.2-exp", label: "DeepSeek V3.2 Exp" },
} as const;
