"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getCurrentUserId } from "@/server/current-user";
import {
  createCatalogProduct,
  createProjectFromProduct,
  generateProductImprovementSuggestions,
  type CreateCatalogProductInput,
  type ProductImprovementSuggestions,
  updateCatalogProduct,
} from "@/server/services/catalog-products";

const suggestionSchema = z.object({
  title: z.string().min(3, "Informe um título"),
  summary: z.string().max(300).optional(),
  description: z.string().max(2000).optional(),
  type: z.enum(["book", "course", "article"]),
  targetPages: z.coerce.number().min(10).max(500).default(120),
  tags: z.string().optional(),
  audience: z.string().max(500).optional(),
  level: z.string().max(100).optional(),
  format: z.string().max(100).optional(),
  outline: z
    .string()
    .min(5, "Insira o outline do curso")
    .transform((value) =>
      value
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
    ),
});

export type SuggestionFormState =
  | { status: "idle" }

const saveOutlineSchema = z.object({
  productId: z.string().min(1),
  outline: z.string().min(2),
});

export type SaveOutlineState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

export async function saveProductOutlineAction(
  prevState: SaveOutlineState,
  formData: FormData
): Promise<SaveOutlineState> {
  const parsed = saveOutlineSchema.safeParse({
    productId: formData.get("productId"),
    outline: formData.get("outline"),
  });

  if (!parsed.success) {
    return { status: "error", message: "Outline inválido" };
  }

  try {
    const outlinePayload = JSON.parse(parsed.data.outline) as Array<{
      title: string;
      description?: string;
      order?: number;
      duration?: string;
    }>;

    if (!Array.isArray(outlinePayload) || outlinePayload.length === 0) {
      return { status: "error", message: "Outline vazio" };
    }

    const normalizedOutline = outlinePayload.map((item, index) => ({
      title: item.title,
      description: item.description,
      order: item.order ?? index + 1,
      estimatedDuration: item.duration,
    }));

    await updateCatalogProduct(parsed.data.productId, { outline: normalizedOutline });
    revalidatePath("/dashboard");
    return { status: "success", message: "Outline atualizado" };
  } catch (error) {
    console.error("Failed to save outline", error);
    return { status: "error", message: "Erro ao salvar outline" };
  }
}

export type EnhanceProductState =
  | { status: "idle" }
  | { status: "success"; message?: string }
  | { status: "error"; message: string };

export type AiSuggestionState =
  | { status: "idle" }
  | { status: "success"; suggestions: ProductImprovementSuggestions }
  | { status: "error"; message: string };

const enhanceSchema = z.object({
  productId: z.string().min(1),
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  price: z.coerce.number().optional(),
  tags: z.string().optional(),
  heroImage: z.string().url().optional(),
  images: z.string().optional(),
  ctaPrimaryText: z.string().optional(),
  ctaPrimaryUrl: z.string().optional(),
  ctaSecondaryText: z.string().optional(),
  ctaSecondaryUrl: z.string().optional(),
  positioning: z.string().optional(),
});

export async function updateCatalogProductAction(
  prevState: EnhanceProductState,
  formData: FormData
) {
  const toOptionalString = (value: FormDataEntryValue | null) => {
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  };

  const parsed = enhanceSchema.safeParse({
    productId: formData.get("productId"),
    headline: toOptionalString(formData.get("headline")),
    subheadline: toOptionalString(formData.get("subheadline")),
    description: toOptionalString(formData.get("description")),
    shortDescription: toOptionalString(formData.get("shortDescription")),
    price: formData.get("price") || undefined,
    tags: toOptionalString(formData.get("tags")),
    heroImage: toOptionalString(formData.get("heroImage")),
    images: toOptionalString(formData.get("images")),
    ctaPrimaryText: toOptionalString(formData.get("ctaPrimaryText")),
    ctaPrimaryUrl: toOptionalString(formData.get("ctaPrimaryUrl")),
    ctaSecondaryText: toOptionalString(formData.get("ctaSecondaryText")),
    ctaSecondaryUrl: toOptionalString(formData.get("ctaSecondaryUrl")),
    positioning: toOptionalString(formData.get("positioning")),
  });

  if (!parsed.success) {
    return { status: "error" as const, message: parsed.error.issues[0]?.message };
  }

  try {
    const tags = parsed.data.tags?.split(",").map((tag) => tag.trim()).filter(Boolean);
    const images = parsed.data.images?.split(",").map((url) => url.trim()).filter(Boolean);
    const userId = getCurrentUserId();
    const ctaPatch = parsed.data.ctaPrimaryText || parsed.data.ctaPrimaryUrl || parsed.data.ctaSecondaryText || parsed.data.ctaSecondaryUrl
      ? {
          primary:
            parsed.data.ctaPrimaryText || parsed.data.ctaPrimaryUrl
              ? {
                  text: parsed.data.ctaPrimaryText,
                  url: parsed.data.ctaPrimaryUrl,
                }
              : undefined,
          secondary:
            parsed.data.ctaSecondaryText || parsed.data.ctaSecondaryUrl
              ? {
                  text: parsed.data.ctaSecondaryText,
                  url: parsed.data.ctaSecondaryUrl,
                }
              : undefined,
        }
      : undefined;

    await updateCatalogProduct(parsed.data.productId, {
      copy: {
        headline: parsed.data.headline,
        subheadline: parsed.data.subheadline,
        fullDescription: parsed.data.description,
        shortDescription: parsed.data.shortDescription,
      },
      pricing: {
        price: parsed.data.price,
      },
      tags,
      heroImage: parsed.data.heroImage,
      images,
      cta: ctaPatch,
      metadata: parsed.data.positioning ? { positioning: parsed.data.positioning } : undefined,
      lastEditedBy: userId,
    });
    revalidatePath("/dashboard");
    return { status: "success" as const, message: "Produto atualizado com sucesso" };
  } catch (error) {
    console.error("Failed to update product", error);
    return { status: "error" as const, message: "Não foi possível salvar as alterações" };
  }
}

const suggestionSchemaFull = z.object({
  productId: z.string().min(1),
});

export async function getProductSuggestionsAction(
  prevState: AiSuggestionState,
  formData: FormData
) {
  const parsed = suggestionSchemaFull.safeParse({ productId: formData.get("productId") });
  if (!parsed.success) {
    return { status: "error" as const, message: "Produto inválido" };
  }

  try {
    const suggestions = await generateProductImprovementSuggestions(parsed.data.productId);
    return { status: "success" as const, suggestions };
  } catch (error) {
    console.error("Failed to generate suggestions", error);
    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "Falha ao gerar sugestões",
    };
  }
}

export async function createProductSuggestionAction(prevState: SuggestionFormState, formData: FormData) {
  const parsed = suggestionSchema.safeParse({
    title: formData.get("title"),
    summary: formData.get("summary") || undefined,
    description: formData.get("description") || undefined,
    type: formData.get("type"),
    targetPages: formData.get("targetPages") || undefined,
    tags: formData.get("tags") || undefined,
    audience: formData.get("audience") || undefined,
    level: formData.get("level") || undefined,
    format: formData.get("format") || undefined,
    outline: formData.get("outline"),
  });

  if (!parsed.success) {
    return {
      status: "error" as const,
      message: parsed.error.issues[0]?.message || "Dados inválidos",
    };
  }

  const payload: CreateCatalogProductInput = {
    title: parsed.data.title,
    summary: parsed.data.summary,
    description: parsed.data.description,
    type: parsed.data.type,
    targetPages: parsed.data.targetPages,
    tags: parsed.data.tags?.split(",").map((tag) => tag.trim()).filter(Boolean),
    audience: parsed.data.audience,
    level: parsed.data.level,
    format: parsed.data.format,
    outline: parsed.data.outline.map((title, index) => ({
      title,
      order: index + 1,
      estimatedWords: Math.floor((parsed.data.targetPages / parsed.data.outline.length) * 350),
    })),
  };

  try {
    await createCatalogProduct(payload);
    revalidatePath("/dashboard");
    return {
      status: "success" as const,
      message: "Sugestão adicionada ao catálogo!",
    };
  } catch (error) {
    console.error("Failed to create catalog product", error);
    return {
      status: "error" as const,
      message: "Não foi possível salvar a sugestão.",
    };
  }
}

const cloneSchema = z.object({
  productId: z.string().min(1),
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  targetPages: z.coerce.number().min(1).max(500).optional(),
  editorModel: z.string().optional(),
  researcherModel: z.string().optional(),
  writerModel: z.string().optional(),
  reviewerModel: z.string().optional(),
});

export type CloneActionState =
  | { status: "idle" }
  | { status: "error"; message: string };

export async function cloneProductToProjectAction(prevState: CloneActionState, formData: FormData) {
  const parsed = cloneSchema.safeParse({
    productId: formData.get("productId"),
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    targetPages: formData.get("targetPages") || undefined,
    editorModel: formData.get("editorModel") || undefined,
    researcherModel: formData.get("researcherModel") || undefined,
    writerModel: formData.get("writerModel") || undefined,
    reviewerModel: formData.get("reviewerModel") || undefined,
  });

  if (!parsed.success) {
    return {
      status: "error" as const,
      message: "Produto inválido",
    };
  }

  const outlineItems: Array<{ title: string; description?: string; duration?: string; order: number }> = [];
  let outlineIndex = 0;
  while (formData.has(`outline[${outlineIndex}].title`)) {
    const title = (formData.get(`outline[${outlineIndex}].title`) as string) || "";
    const description = (formData.get(`outline[${outlineIndex}].description`) as string) || undefined;
    const duration = (formData.get(`outline[${outlineIndex}].duration`) as string) || undefined;
    if (title.trim()) {
      outlineItems.push({ title: title.trim(), description, duration, order: outlineIndex + 1 });
    }
    outlineIndex++;
  }

  try {
    const userId = getCurrentUserId();
    const project = await createProjectFromProduct(
      userId,
      parsed.data.productId,
      {
        title: parsed.data.title,
        description: parsed.data.description,
        targetPages: parsed.data.targetPages,
        agentConfig: {
          editor: parsed.data.editorModel ? { model: parsed.data.editorModel } : undefined,
          researcher: parsed.data.researcherModel ? { model: parsed.data.researcherModel } : undefined,
          writer: parsed.data.writerModel ? { model: parsed.data.writerModel } : undefined,
          reviewer: parsed.data.reviewerModel ? { model: parsed.data.reviewerModel } : undefined,
        },
        outline: outlineItems,
      }
    );
    revalidatePath("/dashboard");
    redirect(`/project/${project.id}`);
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT;")
    ) {
      throw error;
    }
    console.error("Failed to clone product", error);
    return {
      status: "error" as const,
      message: error instanceof Error ? error.message : "Erro ao criar projeto",
    };
  }
}
