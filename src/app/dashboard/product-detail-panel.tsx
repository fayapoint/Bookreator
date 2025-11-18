"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  BookOpenCheck,
  CheckCircle2,
  ExternalLink,
  History,
  ImagePlus,
  Loader2,
  Sparkles,
  Star,
  Wand2,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { type CatalogProduct } from "@/server/models/catalog-product";
import {
  type AiSuggestionState,
  type CloneActionState,
  type EnhanceProductState,
} from "./actions";
import { CloneConfigDrawer } from "./clone-config-drawer";

type ModuleInfo = {
  title: string;
  description?: string;
  lessons?: number;
  duration?: string;
};

type BonusInfo = {
  title: string;
  description?: string;
  value?: number | string;
};

type TestimonialInfo = {
  author: string;
  quote: string;
  role?: string;
};

type CopySuggestionContent = {
  headline?: string;
  subheadline?: string;
  description?: string;
  shortDescription?: string;
};

type MarketingSuggestionContent = {
  ctaPrimaryText?: string;
  ctaSecondaryText?: string;
  newTags?: string[];
  positioning?: string;
};

type OutlineSuggestionItem = {
  action: "add" | "update" | "remove";
  title: string;
  notes?: string;
};

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

type Props = {
  product?: CatalogProduct;
  cloneAction: (formData: FormData) => void;
  cloneState: CloneActionState;
  enhanceAction: (formData: FormData) => void;
  enhanceState: EnhanceProductState;
  aiAction: (formData: FormData) => void;
  aiState: AiSuggestionState;
};

export default function ProductDetailPanel({
  product,
  cloneAction,
  cloneState,
  enhanceAction,
  enhanceState,
  aiAction,
  aiState,
}: Props) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const images = useMemo(() => {
    if (!product) return [];
    return [product.heroImage, ...(product.images || [])].filter(Boolean) as string[];
  }, [product]);

  if (!product) {
    return (
      <Card className="border-primary/40 bg-gradient-to-b from-primary/5 via-background to-background">
        <CardHeader>
          <CardTitle>Nenhum produto selecionado</CardTitle>
          <CardDescription>Escolha um item ao lado para visualizar os detalhes.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const pricing = product.pricing;
  const modules = (product.curriculum?.modules || product.detailedCurriculum?.modules || []) as ModuleInfo[];
  const bonuses = (product.bonuses || []) as BonusInfo[];
  const testimonials = (product.testimonials || []) as TestimonialInfo[];
  const benefits = (product.copy?.benefits || []) as string[];
  const metrics = product.metrics || {};

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/40 bg-background/95">
        <CardHeader className="space-y-5">
          <header className="flex flex-wrap items-start justify-between gap-6">
            <div className="space-y-3">
              <Badge variant="outline" className="border-primary/40 text-primary">
                {product.categoryPrimary || product.type}
              </Badge>
              <div>
                <CardTitle className="text-3xl font-semibold text-foreground">
                  {product.copy?.headline || product.title}
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  {product.copy?.subheadline || product.summary || product.description}
                </CardDescription>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                {product.tags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border/60">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="text-right">
              {pricing?.price && (
                <p className="text-3xl font-semibold text-primary">{currencyFormatter.format(pricing.price)}</p>
              )}
              {pricing?.originalPrice && (
                <p className="text-sm text-muted-foreground line-through">
                  {currencyFormatter.format(Number(pricing.originalPrice))}
                </p>
              )}
            </div>
          </header>

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="outline" className="border-border/70">
              Atualizado {new Date(product.updatedAt ?? product.createdAt ?? Date.now()).toLocaleString("pt-BR")}
            </Badge>
            {product.lastEditedBy && (
              <Badge variant="outline" className="border-border/70">
                <History className="mr-1 h-3 w-3" /> Última edição por {product.lastEditedBy}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <Gallery images={images} />

          <div className="grid gap-4 md:grid-cols-2">
            <MetricCard label="Alunos" value={metrics.students} suffix="alunos" />
            <MetricCard label="Avaliação" value={metrics.rating} suffix="/5" icon={<Star className="h-4 w-4 text-amber-400" />} />
            <MetricCard label="Lições" value={metrics.lessons} suffix="aulas" />
            <MetricCard label="Duração" value={metrics.duration} suffix="horas" />
          </div>

          {benefits.length > 0 && (
            <section className="rounded-2xl border border-border/60 bg-muted/10 p-5">
              <h4 className="text-sm font-semibold text-foreground">Benefícios que prometemos</h4>
              <div className="mt-3 grid gap-2 md:grid-cols-2">
                {benefits.slice(0, 8).map((benefit) => (
                  <p key={benefit} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" /> {benefit}
                  </p>
                ))}
              </div>
            </section>
          )}

          {modules.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <BookOpenCheck className="h-4 w-4 text-primary" /> Currículo
                </div>
                <Badge variant="outline" className="border-border/60">
                  {modules.length} módulos
                </Badge>
              </div>
              <div className="space-y-3">
                {modules.slice(0, 4).map((module, index) => (
                  <div
                    key={`${module.title || "module"}-${index}`}
                    className="rounded-2xl border border-border/60 bg-muted/5 p-4"
                  >
                    <p className="font-medium text-foreground">{module.title}</p>
                    <p className="text-xs text-muted-foreground">{module.description}</p>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {module.lessons} aulas • {module.duration}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {bonuses.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Bônus inclusos</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {bonuses.map((bonus, index) => (
                  <Card key={`${bonus.title || "bonus"}-${index}`} className="border-border/60 bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{bonus.title}</CardTitle>
                      <CardDescription>{bonus.description}</CardDescription>
                    </CardHeader>
                    {bonus.value && (
                      <CardContent className="text-sm text-primary">
                        Valor estimado: {currencyFormatter.format(Number(bonus.value))}
                      </CardContent>
                    )}
                  </Card>
                ))}
              </div>
            </section>
          )}

          {testimonials.length > 0 && (
            <section className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Depoimentos</h4>
              <div className="grid gap-3 md:grid-cols-2">
                {testimonials.slice(0, 2).map((testimonial, index) => (
                  <Card
                    key={`${testimonial.author || "testimonial"}-${index}`}
                    className="border-border/50 bg-muted/5"
                  >
                    <CardContent className="space-y-2 p-4 text-sm text-muted-foreground">
                      <p>“{testimonial.quote}”</p>
                      <p className="text-xs font-semibold uppercase tracking-wide text-foreground">
                        {testimonial.author} — {testimonial.role}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )}

          <div className="flex justify-center">
            <CloneConfigDrawer
              product={product}
              cloneAction={cloneAction}
              cloneState={cloneState}
              aiAction={aiAction}
              aiState={aiState}
            />
          </div>

          <Separator className="opacity-40" />

          <div className="flex flex-wrap gap-3">
            <Button variant="default" className="gap-2 shadow-sm" asChild>
              <a href={`/dashboard/products/${product.id}/edit`}>
                <Wand2 className="h-4 w-4" /> Editar Produto Completo
              </a>
            </Button>
            <Button variant="secondary" className="gap-2" asChild>
              <a href={product.cta?.primary?.url ?? "#"} target="_blank" rel="noreferrer">
                Ir para landing <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>

          <AiSuggestionPanel
            product={product}
            aiAction={aiAction}
            aiState={aiState}
            enhanceAction={enhanceAction}
            toggleSection={toggleSection}
            openSections={openSections}
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Gallery({ images }: { images: string[] }) {
  if (images.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhuma imagem cadastrada. Use o botão <strong className="text-foreground">"Atualizar produto"</strong> abaixo para adicionar imagens.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {images.map((image, idx) => (
        <div key={`${image}-${idx}`} className="overflow-hidden rounded-2xl border border-border/60">
          <img src={image} alt={`Imagem ${idx + 1}`} className="h-48 w-full object-cover" />
        </div>
      ))}
    </div>
  );
}

function MetricCard({
  label,
  value,
  suffix,
  icon,
}: {
  label: string;
  value?: number | string;
  suffix?: string;
  icon?: ReactNode;
}) {
  if (!value) return null;
  return (
    <div className="rounded-2xl border border-border/60 bg-muted/5 p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="flex items-center gap-2 text-2xl font-semibold text-foreground">
        {value} {suffix}
        {icon}
      </div>
    </div>
  );
}

function AiSuggestionPanel({
  product,
  aiAction,
  aiState,
  enhanceAction,
  openSections,
  toggleSection,
}: {
  product: CatalogProduct;
  aiAction: (formData: FormData) => void;
  aiState: AiSuggestionState;
  enhanceAction: (formData: FormData) => void;
  openSections: Record<string, boolean>;
  toggleSection: (key: string) => void;
}) {
  const hasSuggestions = aiState.status === "success";

  return (
    <Card className="border-border/60 bg-muted/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Wand2 className="h-4 w-4 text-primary" /> Sugestões com IA
        </CardTitle>
        <CardDescription>Itere com segurança antes de enviar para produção.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <form action={aiAction} className="flex flex-wrap items-center gap-3">
          <input type="hidden" name="productId" value={product.id} />
          <Button type="submit" variant="secondary" className="gap-2" disabled={aiState.status === "idle" ? false : aiState.status === "error" ? false : false}>
            {aiState.status === "idle" || aiState.status === "error" ? (
              <>
                <Sparkles className="h-4 w-4" /> Gerar sugestões
              </>
            ) : aiState.status === "success" ? (
              <>
                <Sparkles className="h-4 w-4" /> Regerar
              </>
            ) : (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processando
              </>
            )}
          </Button>
          {aiState.status === "error" && <span className="text-destructive">{aiState.message}</span>}
        </form>

        {hasSuggestions && aiState.suggestions.copy && (
          <CopySuggestionCard
            content={aiState.suggestions.copy as CopySuggestionContent}
            productId={product.id}
            enhanceAction={enhanceAction}
            isOpen={openSections.copy}
            toggle={() => toggleSection("copy")}
          />
        )}

        {hasSuggestions && aiState.suggestions.marketing && (
          <MarketingSuggestionCard
            content={aiState.suggestions.marketing as MarketingSuggestionContent}
            productId={product.id}
            enhanceAction={enhanceAction}
            isOpen={openSections.marketing}
            toggle={() => toggleSection("marketing")}
          />
        )}

        {hasSuggestions && aiState.suggestions.outline && aiState.suggestions.outline.length > 0 && (
          <OutlineSuggestion
            suggestions={aiState.suggestions.outline as OutlineSuggestionItem[]}
            isOpen={openSections.outline}
            toggle={() => toggleSection("outline")}
          />
        )}
      </CardContent>
    </Card>
  );
}

function CopySuggestionCard({
  content,
  productId,
  enhanceAction,
  isOpen,
  toggle,
}: {
  content: CopySuggestionContent;
  productId: string;
  enhanceAction: (formData: FormData) => void;
  isOpen?: boolean;
  toggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-semibold text-foreground">Copy</p>
          <p className="text-xs text-muted-foreground">Sugestões de headline e descrição</p>
        </div>
        <span className="text-xs text-muted-foreground">{isOpen ? "Fechar" : "Abrir"}</span>
      </button>
      {isOpen && (
        <div className="space-y-3 border-t border-border/40 px-4 py-4 text-sm text-muted-foreground">
          {content.headline && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Headline</p>
              <p>{content.headline}</p>
            </div>
          )}
          {content.subheadline && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Subheadline</p>
              <p>{content.subheadline}</p>
            </div>
          )}
          {content.description && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Descrição</p>
              <p>{content.description}</p>
            </div>
          )}
          {content.shortDescription && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Resumo curto</p>
              <p>{content.shortDescription}</p>
            </div>
          )}
          <form action={enhanceAction} className="flex items-center gap-3">
            <input type="hidden" name="productId" value={productId} />
            {content.headline && <input type="hidden" name="headline" value={content.headline} />}
            {content.subheadline && <input type="hidden" name="subheadline" value={content.subheadline} />}
            {content.description && <input type="hidden" name="description" value={content.description} />}
            {content.shortDescription && (
              <input type="hidden" name="shortDescription" value={content.shortDescription} />
            )}
            <Button type="submit" size="sm" variant="secondary" className="gap-2">
              Aceitar sugestão
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function MarketingSuggestionCard({
  content,
  productId,
  enhanceAction,
  isOpen,
  toggle,
}: {
  content: MarketingSuggestionContent;
  productId: string;
  enhanceAction: (formData: FormData) => void;
  isOpen?: boolean;
  toggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-semibold text-foreground">Marketing</p>
          <p className="text-xs text-muted-foreground">CTA, posicionamento e tags</p>
        </div>
        <span className="text-xs text-muted-foreground">{isOpen ? "Fechar" : "Abrir"}</span>
      </button>
      {isOpen && (
        <div className="space-y-3 border-t border-border/40 px-4 py-4 text-sm text-muted-foreground">
          {content.positioning && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Posicionamento</p>
              <p>{content.positioning}</p>
            </div>
          )}
          {(content.newTags?.length ?? 0) > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-foreground">Novas tags</p>
              <div className="flex flex-wrap gap-2">
                {content.newTags?.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-border/50 text-xs">
                    #{tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <form action={enhanceAction} className="flex flex-wrap gap-3">
            <input type="hidden" name="productId" value={productId} />
            {content.ctaPrimaryText && (
              <input type="hidden" name="ctaPrimaryText" value={content.ctaPrimaryText} />
            )}
            {content.ctaSecondaryText && (
              <input type="hidden" name="ctaSecondaryText" value={content.ctaSecondaryText} />
            )}
            {content.newTags && <input type="hidden" name="tags" value={content.newTags.join(", ")} />}
            {content.positioning && <input type="hidden" name="positioning" value={content.positioning} />}
            <Button type="submit" size="sm" variant="secondary" className="gap-2">
              Aceitar marketing
            </Button>
          </form>
        </div>
      )}
    </div>
  );
}

function OutlineSuggestion({
  suggestions,
  isOpen,
  toggle,
}: {
  suggestions: OutlineSuggestionItem[];
  isOpen?: boolean;
  toggle: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border/60 bg-background/70">
      <button type="button" onClick={toggle} className="flex w-full items-center justify-between px-4 py-3 text-left">
        <div>
          <p className="text-sm font-semibold text-foreground">Outline</p>
          <p className="text-xs text-muted-foreground">Ajustes sugeridos para o currículo</p>
        </div>
        <span className="text-xs text-muted-foreground">{isOpen ? "Fechar" : "Abrir"}</span>
      </button>
      {isOpen && (
        <div className="space-y-3 border-t border-border/40 px-4 py-4 text-sm text-muted-foreground">
          {suggestions.map((item) => (
            <div key={`${item.title}-${item.action}`} className="rounded-xl border border-border/40 bg-muted/5 p-3">
              <p className="text-xs uppercase tracking-wide text-foreground">{item.action}</p>
              <p className="font-medium text-foreground">{item.title}</p>
              {item.notes && <p className="text-xs text-muted-foreground">{item.notes}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
