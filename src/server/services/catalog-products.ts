"use server";

import "server-only";
import { randomUUID } from "crypto";
import { Types } from "mongoose";

import { getCatalogProductModel, type CatalogProduct } from "../models/catalog-product";
import { createProject, type CreateProjectInput } from "./projects";
import { ENV } from "../env";

function serialize(doc: any): CatalogProduct {
  const { _id, ...rest } = doc;
  return {
    id: _id.toString(),
    ...rest,
  } as CatalogProduct;
}

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export type CatalogOutlineItem = {
  title: string;
  description?: string;
  order?: number;
  estimatedWords?: number;
};

export type CreateCatalogProductInput = {
  title: string;
  summary?: string;
  description?: string;
  type: "book" | "course" | "article";
  targetPages?: number;
  tags?: string[];
  outline: CatalogOutlineItem[];
  audience?: string;
  level?: string;
  format?: string;
};

type CopyPatch = {
  headline?: string;
  subheadline?: string;
  fullDescription?: string;
  shortDescription?: string;
};

type CtaPatch = {
  primary?: {
    text?: string;
    url?: string;
  };
  secondary?: {
    text?: string;
    url?: string;
  };
};

export type UpdateCatalogProductInput = {
  title?: string;
  summary?: string;
  description?: string;
  type?: "book" | "course" | "article";
  targetPages?: number;
  tags?: string[];
  heroImage?: string;
  images?: string[];
  copy?: CopyPatch;
  pricing?: {
    price?: number;
    originalPrice?: number;
    discount?: number;
  };
  cta?: CtaPatch;
  metadata?: Record<string, unknown>;
  lastEditedBy?: string;
  outline?: any[];
  bonuses?: any[];
  testimonials?: any[];
  faqs?: any[];
  detailedCurriculum?: any;
  curriculum?: any;
  audience?: string;
  categoryPrimary?: string;
  categorySecondary?: string;
  targetAudience?: string[];
};

export async function listCatalogProducts(limit = 50) {
  const model = await getCatalogProductModel();
  const docs = await model.find().sort({ updatedAt: -1 }).limit(limit).lean();
  return docs.map(serialize);
}

export async function createCatalogProduct(input: CreateCatalogProductInput) {
  const model = await getCatalogProductModel();
  const doc = await model.create({
    title: input.title,
    slug: slugify(input.title),
    summary: input.summary,
    description: input.description,
    type: input.type,
    targetPages: input.targetPages ?? 100,
    tags: input.tags ?? [],
    audience: input.audience,
    level: input.level,
    format: input.format,
    outline: input.outline.map((item, index) => ({
      title: item.title,
      description: item.description,
      order: item.order ?? index + 1,
      estimatedWords: item.estimatedWords,
    })),
    metadata: {
      suggestion: true,
      createdFromDashboard: true,
    },
  });

  return serialize(doc.toObject());
}

export async function getCatalogProductById(productId: string) {
  if (!Types.ObjectId.isValid(productId)) {
    return null;
  }

  const model = await getCatalogProductModel();
  const doc = await model.findById(productId).lean();
  return doc ? serialize(doc) : null;
}

const removeUndefined = <T extends Record<string, any>>(obj?: T) => {
  if (!obj) return undefined;
  const entries = Object.entries(obj).filter(([, value]) => value !== undefined && value !== null);
  return entries.length ? (Object.fromEntries(entries) as T) : undefined;
};

export async function updateCatalogProduct(productId: string, data: UpdateCatalogProductInput) {
  if (!Types.ObjectId.isValid(productId)) {
    throw new Error("Produto inválido");
  }

  const model = await getCatalogProductModel();
  const existing = await model.findById(productId);
  if (!existing) {
    throw new Error("Produto não encontrado");
  }

  const updatePayload: Record<string, any> = {};

  if (data.title !== undefined) {
    updatePayload.title = data.title;
    updatePayload.slug = slugify(data.title);
  }
  if (data.summary !== undefined) updatePayload.summary = data.summary;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.type !== undefined) updatePayload.type = data.type;
  if (data.targetPages !== undefined) updatePayload.targetPages = data.targetPages;
  if (data.heroImage !== undefined) updatePayload.heroImage = data.heroImage;
  if (data.tags) updatePayload.tags = data.tags;
  if (data.images) updatePayload.images = data.images;
  if (data.metadata) updatePayload.metadata = { ...(existing.metadata || {}), ...data.metadata };

  if (data.outline) updatePayload.outline = data.outline;
  if (data.bonuses) updatePayload.bonuses = data.bonuses;
  if (data.testimonials) updatePayload.testimonials = data.testimonials;
  if (data.faqs) updatePayload.faqs = data.faqs;
  if (data.detailedCurriculum) updatePayload.detailedCurriculum = data.detailedCurriculum;
  if (data.curriculum) updatePayload.curriculum = data.curriculum;

  if (data.audience !== undefined) updatePayload.audience = data.audience;
  if (data.categoryPrimary !== undefined) updatePayload.categoryPrimary = data.categoryPrimary;
  if (data.categorySecondary !== undefined) updatePayload.categorySecondary = data.categorySecondary;
  if (data.targetAudience !== undefined) updatePayload.targetAudience = data.targetAudience;

  if (data.copy) {
    const cleanCopy = removeUndefined(data.copy);
    if (cleanCopy) {
      updatePayload.copy = { ...(existing.copy || {}), ...cleanCopy };
    }
  }

  if (data.pricing) {
    const cleanPricing = removeUndefined(data.pricing);
    if (cleanPricing) {
      updatePayload.pricing = { ...(existing.pricing || {}), ...cleanPricing };
    }
  }

  if (data.cta) {
    const currentCta = existing.cta || {};
    const mergedCta: Record<string, any> = { ...currentCta };
    if (data.cta.primary) {
      const cleanPrimary = removeUndefined(data.cta.primary);
      if (cleanPrimary) {
        mergedCta.primary = { ...(currentCta.primary || {}), ...cleanPrimary };
      }
    }
    if (data.cta.secondary) {
      const cleanSecondary = removeUndefined(data.cta.secondary);
      if (cleanSecondary) {
        mergedCta.secondary = { ...(currentCta.secondary || {}), ...cleanSecondary };
      }
    }
    if (Object.keys(mergedCta).length) {
      updatePayload.cta = mergedCta;
    }
  }

  if (data.lastEditedBy) {
    updatePayload.lastEditedBy = data.lastEditedBy;
  }

  updatePayload.updatedAt = new Date();

  const updatedDoc = await model.findByIdAndUpdate(productId, { $set: updatePayload }, { new: true, lean: true });
  if (!updatedDoc) {
    throw new Error("Produto não encontrado");
  }

  return serialize(updatedDoc);
}

export async function createProjectFromProduct(
  userId: string,
  productId: string,
  overrides?: {
    title?: string;
    description?: string;
    targetPages?: number;
    agentConfig?: Partial<{
      editor?: { model: string };
      researcher?: { model: string };
      writer?: { model: string };
      reviewer?: { model: string };
    }>;
    outline?: CatalogOutlineItem[];
  }
) {
  const product = await getCatalogProductById(productId);
  if (!product) {
    throw new Error("Produto não encontrado");
  }

  const outlineSource = overrides?.outline && overrides.outline.length > 0
    ? overrides.outline
    : product.outline && product.outline.length > 0
      ? product.outline
      : product.metadata?.outlineText
        ?.split("\n")
        .map((line: string) => line.trim())
        .filter(Boolean)
        .map((title: string, index: number) => ({ title, order: index + 1 }));

  const outline = outlineSource as CatalogOutlineItem[];

  if (!outline || outline.length === 0) {
    throw new Error("Produto não possui outline configurado");
  }

  const payload: CreateProjectInput = {
    title: overrides?.title ?? product.title,
    description: overrides?.description ?? product.description ?? product.summary ?? undefined,
    type: product.type ?? "course",
    targetPages: overrides?.targetPages ?? product.targetPages ?? outline.length * 8,
    outline: outline.map((item, index) => ({
      title: item.title,
      description: item.description,
      order: item.order ?? index + 1,
      estimatedWords: item.estimatedWords,
      chapterId: randomUUID(),
    })),
    agentConfig: overrides?.agentConfig
      ? {
          editor: overrides.agentConfig.editor ?? { model: "deepseek/deepseek-v3.2-exp" },
          researcher: overrides.agentConfig.researcher ?? { model: "deepseek/deepseek-v3.2-exp" },
          writer: overrides.agentConfig.writer ?? { model: "deepseek/deepseek-v3.2-exp" },
          reviewer: overrides.agentConfig.reviewer ?? { model: "deepseek/deepseek-v3.2-exp" },
          artist: { model: "fal-ai/image-creation" },
        }
      : undefined,
  };

  return createProject(userId, payload);
}

export type ProductImprovementSuggestions = {
  copy?: {
    headline?: string;
    subheadline?: string;
    description?: string;
    shortDescription?: string;
  };
  marketing?: {
    ctaPrimaryText?: string;
    ctaSecondaryText?: string;
    newTags?: string[];
    positioning?: string;
  };
  outline?: Array<{ action: "add" | "update" | "remove"; title: string; notes?: string }>;
};

export async function generateProductImprovementSuggestions(productId: string) {
  const product = await getCatalogProductById(productId);
  if (!product) {
    throw new Error("Produto não encontrado");
  }

  const prompt = `Você é um estrategista de produtos premium. Analise o JSON a seguir e proponha melhorias objetivas.
  Responda APENAS em JSON com o formato:
  {
    "copy": {
      "headline": "...",
      "subheadline": "...",
      "description": "...",
      "shortDescription": "..."
    },
    "marketing": {
      "ctaPrimaryText": "...",
      "ctaSecondaryText": "...",
      "newTags": ["..."],
      "positioning": "..."
    },
    "outline": [
      { "action": "add", "title": "", "notes": "" }
    ]
  }
  Mantenha respostas em português.
  Produto: ${JSON.stringify(product)}`;

  const response = await fetch(ENV.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://bookreator.app",
      "X-Title": "Bookreator Catalog Suggestions",
    },
    body: JSON.stringify({
      model: "anthropic/claude-3.5-sonnet",
      temperature: 0.6,
      messages: [
        { role: "system", content: "Você gera sugestões claras e acionáveis para melhorar cursos." },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Erro na IA: ${text}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Resposta da IA vazia");
  }

  try {
    return JSON.parse(content) as ProductImprovementSuggestions;
  } catch (error) {
    throw new Error("Não foi possível interpretar as sugestões da IA");
  }
}
