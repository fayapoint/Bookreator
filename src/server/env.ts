import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  OPENROUTER_API_KEY: z.string().min(1, "OPENROUTER_API_KEY is required"),
  OPENROUTER_BASE_URL: z
    .string()
    .url()
    .default("https://openrouter.ai/api/v1/chat/completions"),
  DEMO_USER_ID: z.string().default("demo-user"),
});

export const ENV = envSchema.parse({
  MONGODB_URI: process.env.MONGODB_URI,
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
  OPENROUTER_BASE_URL: process.env.OPENROUTER_BASE_URL,
  DEMO_USER_ID: process.env.DEMO_USER_ID,
});
