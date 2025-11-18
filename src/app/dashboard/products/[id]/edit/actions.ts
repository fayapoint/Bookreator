"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getCurrentUserId } from "@/server/current-user";
import { updateCatalogProduct } from "@/server/services/catalog-products";

export type UpdateProductState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string };

const outlineItemSchema = z.object({
  order: z.coerce.number(),
  title: z.string().min(1),
  description: z.string().optional(),
  estimatedWords: z.coerce.number().optional(),
  estimatedDuration: z.coerce.number().optional(),
});

const updateSchema = z.object({
  productId: z.string().min(1),
  // Basic
  title: z.string().optional(),
  type: z.enum(["book", "course", "article"]).optional(),
  summary: z.string().optional(),
  description: z.string().optional(),
  level: z.string().optional(),
  format: z.string().optional(),
  targetPages: z.coerce.number().optional(),
  tags: z.string().optional(),
  // Copy
  headline: z.string().optional(),
  subheadline: z.string().optional(),
  shortDescription: z.string().optional(),
  fullDescription: z.string().optional(),
  benefits: z.string().optional(),
  ctaPrimaryText: z.string().optional(),
  ctaPrimaryUrl: z.string().optional(),
  // Pricing
  price: z.coerce.number().optional(),
  originalPrice: z.coerce.number().optional(),
  currency: z.string().optional(),
  // Media
  heroImage: z.string().optional(),
  images: z.string().optional(),
  // Audience
  audience: z.string().optional(),
  categoryPrimary: z.string().optional(),
  categorySecondary: z.string().optional(),
  targetAudience: z.string().optional(),
});

export async function updateFullProductAction(
  prevState: UpdateProductState,
  formData: FormData
): Promise<UpdateProductState> {
  try {
    // Extract basic fields
    const rawData: Record<string, unknown> = {};
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("outline[")) {
        rawData[key] = value;
      }
    }

    const parsed = updateSchema.safeParse(rawData);
    if (!parsed.success) {
      console.error("Validation error:", parsed.error);
      return {
        status: "error",
        message: `Erro de validação: ${parsed.error.issues[0]?.message}`,
      };
    }

    // Parse outline
    const outline: z.infer<typeof outlineItemSchema>[] = [];
    let outlineIndex = 0;
    while (formData.has(`outline[${outlineIndex}].title`)) {
      const item = {
        order: parseInt(formData.get(`outline[${outlineIndex}].order`) as string) || outlineIndex + 1,
        title: (formData.get(`outline[${outlineIndex}].title`) as string) || "",
        description: (formData.get(`outline[${outlineIndex}].description`) as string) || undefined,
        estimatedWords: parseInt(formData.get(`outline[${outlineIndex}].estimatedWords`) as string) || undefined,
        estimatedDuration: parseInt(formData.get(`outline[${outlineIndex}].estimatedDuration`) as string) || undefined,
      };
      
      if (item.title) {
        outline.push(item);
      }
      outlineIndex++;
    }

    // Parse bonuses
    const bonuses: any[] = [];
    let bonusIndex = 0;
    while (formData.has(`bonuses[${bonusIndex}].title`)) {
      const bonus = {
        title: (formData.get(`bonuses[${bonusIndex}].title`) as string) || "",
        description: (formData.get(`bonuses[${bonusIndex}].description`) as string) || "",
        value: parseInt(formData.get(`bonuses[${bonusIndex}].value`) as string) || undefined,
      };
      if (bonus.title) {
        bonuses.push(bonus);
      }
      bonusIndex++;
    }

    // Parse testimonials
    const testimonials: any[] = [];
    let testimonialIndex = 0;
    while (formData.has(`testimonials[${testimonialIndex}].name`)) {
      const testimonial = {
        name: (formData.get(`testimonials[${testimonialIndex}].name`) as string) || "",
        role: (formData.get(`testimonials[${testimonialIndex}].role`) as string) || undefined,
        company: (formData.get(`testimonials[${testimonialIndex}].company`) as string) || undefined,
        comment: (formData.get(`testimonials[${testimonialIndex}].comment`) as string) || "",
        impact: (formData.get(`testimonials[${testimonialIndex}].impact`) as string) || undefined,
        rating: parseInt(formData.get(`testimonials[${testimonialIndex}].rating`) as string) || 5,
      };
      if (testimonial.name && testimonial.comment) {
        testimonials.push(testimonial);
      }
      testimonialIndex++;
    }

    // Parse FAQs
    const faqs: any[] = [];
    let faqIndex = 0;
    while (formData.has(`faqs[${faqIndex}].question`)) {
      const faq = {
        question: (formData.get(`faqs[${faqIndex}].question`) as string) || "",
        answer: (formData.get(`faqs[${faqIndex}].answer`) as string) || "",
      };
      if (faq.question && faq.answer) {
        faqs.push(faq);
      }
      faqIndex++;
    }

    // Parse nested curriculum structure (modules -> chapters -> lessons)
    const curriculumModules: any[] = [];
    let moduleIndex = 0;
    while (formData.has(`curriculum.modules[${moduleIndex}].title`)) {
      const module: any = {
        moduleNumber: parseInt(formData.get(`curriculum.modules[${moduleIndex}].moduleNumber`) as string) || moduleIndex + 1,
        title: (formData.get(`curriculum.modules[${moduleIndex}].title`) as string) || "",
        description: (formData.get(`curriculum.modules[${moduleIndex}].description`) as string) || "",
        duration: (formData.get(`curriculum.modules[${moduleIndex}].duration`) as string) || "",
        chapters: [],
      };

      // Parse chapters for this module
      let chapterIndex = 0;
      while (formData.has(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].title`)) {
        const chapter: any = {
          number: (formData.get(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].number`) as string) || "",
          title: (formData.get(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].title`) as string) || "",
          duration: (formData.get(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].duration`) as string) || "",
          lessons: [],
        };

        // Parse lessons for this chapter
        let lessonIndex = 0;
        while (formData.has(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].title`)) {
          const lesson = {
            number: (formData.get(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].number`) as string) || "",
            title: (formData.get(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].title`) as string) || "",
            duration: (formData.get(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].duration`) as string) || "",
            type: (formData.get(`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].type`) as string) || "",
          };
          if (lesson.title) {
            chapter.lessons.push(lesson);
          }
          lessonIndex++;
        }

        if (chapter.title) {
          module.chapters.push(chapter);
        }
        chapterIndex++;
      }

      if (module.title) {
        // Calculate module stats
        module.lessons = module.chapters.reduce((acc: number, ch: any) => acc + ch.lessons.length, 0);
        curriculumModules.push(module);
      }
      moduleIndex++;
    }

    // Build detailedCurriculum object as canonical source
    const detailedCurriculum = curriculumModules.length > 0
      ? {
          totalModules: curriculumModules.length,
          totalChapters: curriculumModules.reduce((acc: number, m: any) => acc + m.chapters.length, 0),
          totalLessons: curriculumModules.reduce((acc: number, m: any) => acc + m.lessons, 0),
          modules: curriculumModules,
        }
      : undefined;

    // Build lightweight curriculum summary used by dashboard cards
    const curriculum = curriculumModules.length > 0
      ? {
          moduleCount: curriculumModules.length,
          modules: curriculumModules.map((m: any) => ({
            id: m.moduleNumber,
            title: m.title,
            duration: m.duration,
            lessons: m.lessons,
          })),
        }
      : undefined;

    // Parse tags
    const tags = parsed.data.tags?.split(",").map((t) => t.trim()).filter(Boolean);

    // Parse benefits
    const benefits = parsed.data.benefits?.split("\n").map((b) => b.trim()).filter(Boolean);

    // Parse images
    const images = parsed.data.images?.split(",").map((url) => url.trim()).filter(Boolean);

    // Parse target audience
    const targetAudience = parsed.data.targetAudience?.split("\n").map((t) => t.trim()).filter(Boolean);

    const userId = getCurrentUserId();

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      title: parsed.data.title,
      type: parsed.data.type,
      summary: parsed.data.summary,
      description: parsed.data.description,
      level: parsed.data.level,
      format: parsed.data.format,
      targetPages: parsed.data.targetPages,
      tags,
      outline,
      bonuses,
      testimonials,
      faqs,
      detailedCurriculum,
      curriculum,
      copy: {
        headline: parsed.data.headline,
        subheadline: parsed.data.subheadline,
        shortDescription: parsed.data.shortDescription,
        fullDescription: parsed.data.fullDescription,
        benefits,
      },
      pricing: {
        price: parsed.data.price,
        originalPrice: parsed.data.originalPrice,
        currency: parsed.data.currency,
      },
      cta: {
        primary: parsed.data.ctaPrimaryText || parsed.data.ctaPrimaryUrl
          ? {
              text: parsed.data.ctaPrimaryText,
              url: parsed.data.ctaPrimaryUrl,
            }
          : undefined,
      },
      heroImage: parsed.data.heroImage,
      images,
      audience: parsed.data.audience,
      categoryPrimary: parsed.data.categoryPrimary,
      categorySecondary: parsed.data.categorySecondary,
      targetAudience,
      lastEditedBy: userId,
    };

    await updateCatalogProduct(parsed.data.productId, updatePayload);

    revalidatePath("/dashboard");
    revalidatePath(`/dashboard/products/${parsed.data.productId}/edit`);

    // After saving, go to dashboard with this product pre-selected for AI review / production
    redirect(`/dashboard?productId=${parsed.data.productId}`);
  } catch (error) {
    // Let Next.js handle redirects without treating them as real errors
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      typeof (error as any).digest === "string" &&
      (error as any).digest.startsWith("NEXT_REDIRECT;")
    ) {
      throw error;
    }

    console.error("Failed to update product:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Erro ao salvar alterações",
    };
  }
}
