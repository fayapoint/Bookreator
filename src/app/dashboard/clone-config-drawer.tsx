"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { AlertTriangle, BookOpen, FileText, PlusCircle, RefreshCcw, Settings, ShieldCheck, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { type CatalogProduct } from "@/server/models/catalog-product";
import { type AiSuggestionState, type CloneActionState, type SaveOutlineState, saveProductOutlineAction } from "./actions";
import { AVAILABLE_AGENT_MODELS, DEFAULT_AGENT_CONFIG } from "@/lib/agent-models";

type OutlineItem = {
  id: string;
  title: string;
  description?: string;
  duration?: string;
};

type OutlineItemEditable = Pick<OutlineItem, "title" | "description" | "duration">;

type AiOutlineSuggestion = {
  action: "add" | "update" | "remove";
  title: string;
  notes?: string;
};

function buildOutlineFromProduct(product: CatalogProduct): OutlineItem[] {
  const directOutline = product.outline || [];
  if (directOutline.length > 0) {
    return directOutline.map((item, index) => ({
      id: crypto.randomUUID(),
      title: item.title || `Capítulo ${index + 1}`,
      description: item.description ?? undefined,
      duration: (item as any).estimatedDuration ?? undefined,
    }));
  }

  const modules = ((product as any).curriculum?.modules || (product as any).detailedCurriculum?.modules || []) as any[];
  if (modules.length > 0) {
    return modules.flatMap((module, moduleIndex) => {
      if (Array.isArray(module.chapters) && module.chapters.length > 0) {
        return module.chapters.map((chapter: any, chapterIndex: number) => ({
          id: crypto.randomUUID(),
          title: chapter.title || `Capítulo ${moduleIndex + 1}.${chapterIndex + 1}`,
          description: (chapter.description ?? module.description) ?? undefined,
          duration: (chapter.duration ?? module.duration) ?? undefined,
        }));
      }
      return [
        {
          id: crypto.randomUUID(),
          title: module.title || `Módulo ${moduleIndex + 1}`,
          description: module.description ?? undefined,
          duration: module.duration ?? undefined,
        },
      ];
    });
  }

  return [];
}

function convertAiOutline(outline: AiOutlineSuggestion[]): OutlineItem[] {
  return outline.map((item, index) => ({
    id: crypto.randomUUID(),
    title: item.title || `Sugestão ${index + 1}`,
    description: item.notes,
    duration: undefined,
  }));
}

export type Props = {
  product: CatalogProduct;
  cloneAction: (formData: FormData) => void;
  cloneState: CloneActionState;
  aiAction: (formData: FormData) => void;
  aiState: AiSuggestionState;
};

export function CloneConfigDrawer({ product, cloneAction, cloneState, aiAction, aiState }: Props) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description ?? product.summary ?? "");
  const [targetPages, setTargetPages] = useState(product.targetPages || (product.outline?.length ?? 0) * 8 || 80);
  const [editorModel, setEditorModel] = useState<string>(DEFAULT_AGENT_CONFIG.editor.model);
  const [researcherModel, setResearcherModel] = useState<string>(DEFAULT_AGENT_CONFIG.researcher.model);
  const [writerModel, setWriterModel] = useState<string>(DEFAULT_AGENT_CONFIG.writer.model);
  const [reviewerModel, setReviewerModel] = useState<string>(DEFAULT_AGENT_CONFIG.reviewer.model);
  const [aiCheckPending, setAiCheckPending] = useState(false);

  const chapters = product.outline?.length || 0;
  const metrics = product.metrics || {};
  const curriculumModules = ((product as any).curriculum?.modules || (product as any).detailedCurriculum?.modules || []) as any[];
  const curriculumModulesCount = curriculumModules.length;
  const curriculumLessonsCount =
    typeof metrics.lessons === "number"
      ? metrics.lessons
      : curriculumModules.reduce((acc, m) => acc + (m.lessons || 0), 0);
  const curriculumDuration = (metrics as any).duration || (product as any).detailedCurriculum?.totalDuration || "";
  const bonusesCount = (product.bonuses || []).length;
  const testimonialsCount = (product.testimonials || []).length;
  const aiReady = aiState.status === "success";
  const [outlineItems, setOutlineItems] = useState<OutlineItem[]>([]);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [saveOutlineState, saveOutlineAction] = useActionState<SaveOutlineState, FormData>(saveProductOutlineAction, { status: "idle" });
  const [isClonePending, startCloneTransition] = useTransition();
  const [isSavePending, startSaveTransition] = useTransition();

  const readinessChecks = [
    { label: "Currículo detalhado", ok: curriculumModulesCount > 0 },
    { label: "Preço definido", ok: !!product.pricing?.price },
    { label: "CTA configurado", ok: !!product.cta?.primary?.url },
    { label: "Bônus configurados", ok: bonusesCount > 0 },
    { label: "Depoimentos configurados", ok: testimonialsCount > 0 },
  ];

  const outlineFallback = useMemo(() => buildOutlineFromProduct(product), [product]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startCloneTransition(() => {
      cloneAction(formData);
    });
  };

  const handleAiCheck = async () => {
    if (aiCheckPending) return;
    setAiCheckPending(true);
    const formData = new FormData();
    formData.append("productId", product.id);
    try {
      await aiAction(formData);
    } finally {
      setAiCheckPending(false);
    }
  };

  useEffect(() => {
    if (open && !hasInitialized) {
      setOutlineItems(outlineFallback);
      setHasInitialized(true);
    }
  }, [open, outlineFallback, hasInitialized]);

  useEffect(() => {
    if (aiState.status === "success") {
      const outlineSuggestions = aiState.suggestions.outline;
      if (outlineSuggestions && outlineSuggestions.length > 0) {
        setOutlineItems((prev) => (prev.length ? prev : convertAiOutline(outlineSuggestions)));
      }
    }
  }, [aiState]);

  const handleAddOutlineItem = () => {
    setOutlineItems((prev) => [
      ...prev,
      { id: crypto.randomUUID(), title: "Novo capítulo", description: "", duration: "" },
    ]);
  };

  const handleRemoveOutlineItem = (id: string) => {
    setOutlineItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleOutlineChange = (id: string, field: keyof OutlineItemEditable, value: string) => {
    setOutlineItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  const outlinePayload = outlineItems
    .map((item, index) => ({
      title: item.title.trim(),
      description: item.description?.trim() || undefined,
      duration: item.duration?.trim() || undefined,
      order: index + 1,
    }))
    .filter((item) => item.title);
  const outlinePayloadString = JSON.stringify(outlinePayload);

  const handleSaveOutline = () => {
    if (outlinePayload.length === 0) return;
    const data = new FormData();
    data.append("productId", product.id);
    data.append("outline", outlinePayloadString);
    startSaveTransition(() => {
      saveOutlineAction(data);
    });
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
          <Sparkles className="h-5 w-5" /> Configurar e clonar
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh] overflow-hidden border-t border-border/60 bg-background/98 backdrop-blur-xl">
        <DrawerHeader className="border-b border-border/60">
          <DrawerTitle className="flex items-center gap-2 text-2xl">
            <Settings className="h-6 w-6 text-primary" /> Configuração de Clonagem
          </DrawerTitle>
          <DrawerDescription>
            Revise e ajuste todos os parâmetros antes de gerar o projeto. Ideal para cursos com 200+ aulas.
          </DrawerDescription>
        </DrawerHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6 overflow-y-auto px-6 py-6">
          <input type="hidden" name="productId" value={product.id} />
          {/* Product overview / context */}
          <section className="space-y-3 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <Badge variant="outline" className="border-primary/40 text-primary text-[11px]">
                  {product.categoryPrimary || product.type}
                </Badge>
                <h3 className="text-lg font-semibold text-foreground">
                  {product.copy?.headline || product.title}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {product.copy?.subheadline || product.summary || product.description}
                </p>
                {product.tags && product.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-muted-foreground">
                    {product.tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-border/60">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              <div className="grid gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="font-semibold text-foreground">Currículo:</span>{" "}
                  <span>{curriculumModulesCount} módulos</span>
                  {curriculumLessonsCount ? <span>{` • ${curriculumLessonsCount} aulas`}</span> : null}
                  {curriculumDuration ? <span>{` • ${curriculumDuration}`}</span> : null}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Bônus:</span> {bonusesCount}
                </div>
                <div>
                  <span className="font-semibold text-foreground">Depoimentos:</span> {testimonialsCount}
                </div>
              </div>
            </div>
          </section>

          {/* AI readiness & checklist */}
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                <ShieldCheck className="h-4 w-4" /> Checklist de prontidão
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={handleAiCheck}
                  disabled={aiCheckPending}
                >
                  {aiCheckPending ? (
                    <>Analisando...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Verificar com IA</>
                  )}
                </Button>
                {aiReady && (
                  <Badge className="bg-emerald-500/20 text-emerald-700">Checklist aprovado</Badge>
                )}
              </div>
            </div>

            <div className="grid gap-2 md:grid-cols-2">
              {readinessChecks.map((check) => (
                <div
                  key={check.label}
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                    check.ok ? "border-emerald-400/40 bg-emerald-50" : "border-amber-400/40 bg-amber-50"
                  }`}
                >
                  {check.ok ? (
                    <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                  )}
                  <span className="font-medium text-foreground">{check.label}</span>
                </div>
              ))}
            </div>

            {aiState.status === "error" && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                {aiState.message}
              </div>
            )}

            {aiState.status === "success" && (
              <div className="space-y-3 text-xs text-muted-foreground">
                {aiState.suggestions.copy && (
                  <div className="rounded-lg border border-border/60 bg-card/70 p-3">
                    <p className="text-xs font-semibold text-foreground">Sugestões de Copy</p>
                    <ul className="mt-2 space-y-1">
                      {Object.entries(aiState.suggestions.copy)
                        .filter(([_, value]) => Boolean(value))
                        .map(([key, value]) => (
                          <li key={key}>
                            <span className="font-medium text-foreground">{key}:</span> {String(value)}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                {aiState.suggestions.marketing && (
                  <div className="rounded-lg border border-border/60 bg-card/70 p-3">
                    <p className="text-xs font-semibold text-foreground">Sugestões de Marketing</p>
                    <ul className="mt-2 space-y-1">
                      {Object.entries(aiState.suggestions.marketing)
                        .filter(([_, value]) => Boolean(value))
                        .map(([key, value]) => (
                          <li key={key}>
                            <span className="font-medium text-foreground">{key}:</span> {Array.isArray(value) ? value.join(", ") : String(value)}
                          </li>
                        ))}
                    </ul>
                  </div>
                )}
                {aiState.suggestions.outline && aiState.suggestions.outline.length > 0 && (
                  <div className="rounded-lg border border-border/60 bg-card/70 p-3">
                    <p className="text-xs font-semibold text-foreground">Ajustes sugeridos no outline</p>
                    <ul className="mt-2 space-y-1">
                      {aiState.suggestions.outline.map((item, idx) => (
                        <li key={`${item.title}-${idx}`}>
                          <span className="font-medium text-foreground">[{item.action}]</span> {item.title}
                          {item.notes ? ` — ${item.notes}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Project Info Section */}
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <FileText className="h-4 w-4" /> Informações do Projeto
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Projeto *</Label>
                <Input
                  id="title"
                  name="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Aprenda IA no seu dia a dia"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="targetPages">Meta de Páginas *</Label>
                <Input
                  id="targetPages"
                  name="targetPages"
                  type="number"
                  min={10}
                  max={500}
                  value={targetPages}
                  onChange={(e) => setTargetPages(Number(e.target.value))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição do Projeto</Label>
              <Textarea
                id="description"
                name="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Descrição opcional do projeto..."
              />
            </div>
          </section>

          <Separator />

          {/* Editable Outline Section */}
          <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
                  <BookOpen className="h-4 w-4" /> Outline Planejado
                </div>
                <p className="text-xs text-muted-foreground">
                  Este é o roteiro que os agentes usarão. Edite antes de enviar para produção.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="gap-1 text-xs"
                  onClick={() => setOutlineItems(buildOutlineFromProduct(product))}
                >
                  <RefreshCcw className="h-4 w-4" /> Usar currículo
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-1 text-xs"
                  disabled={aiState.status !== "success" || !(aiState.suggestions.outline?.length)}
                  onClick={() => {
                    if (aiState.status === "success") {
                      const outlineSuggestions = aiState.suggestions.outline;
                      if (outlineSuggestions && outlineSuggestions.length) {
                        setOutlineItems(convertAiOutline(outlineSuggestions));
                      }
                    }
                  }}
                >
                  <Sparkles className="h-4 w-4" /> Aplicar sugestões
                </Button>
                <Button type="button" className="gap-1 text-xs" onClick={handleAddOutlineItem}>
                  <PlusCircle className="h-4 w-4" /> Adicionar
                </Button>
              </div>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {outlineItems.length > 0 ? (
                outlineItems.map((item, index) => (
                  <div key={item.id} className="rounded-xl border border-border/40 bg-background/80 p-3">
                    <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold text-foreground">#{index + 1}</span>
                      <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveOutlineItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-1">
                        <Label>Título *</Label>
                        <Input
                          value={item.title}
                          onChange={(e) => handleOutlineChange(item.id, "title", e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-1">
                        <Label>Duração</Label>
                        <Input
                          value={item.duration || ""}
                          onChange={(e) => handleOutlineChange(item.id, "duration", e.target.value)}
                          placeholder="Ex: 45min"
                        />
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      <Label>Descrição / objetivos</Label>
                      <Textarea
                        value={item.description || ""}
                        onChange={(e) => handleOutlineChange(item.id, "description", e.target.value)}
                        rows={2}
                        placeholder="Resumo do capítulo, bullets, recursos..."
                      />
                    </div>

                    {/* Hidden inputs to send outline with clone form */}
                    <input type="hidden" name={`outline[${index}].title`} value={item.title} />
                    <input type="hidden" name={`outline[${index}].description`} value={item.description || ""} />
                    <input type="hidden" name={`outline[${index}].duration`} value={item.duration || ""} />
                    <input type="hidden" name={`outline[${index}].order`} value={index + 1} />
                  </div>
                ))
              ) : (
                <div className="rounded-xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Nenhum capítulo definido. Clique em "Usar currículo" ou "Adicionar".
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
              <span>
                {outlineItems.length} capítulos configurados. Essa lista alimenta os agentes antes da clonagem.
              </span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="gap-2"
                  onClick={handleSaveOutline}
                  disabled={outlinePayload.length === 0 || saveOutlineState.status === "success"}
                >
                  <RefreshCcw className="h-4 w-4" /> Salvar Outline
                </Button>
                {saveOutlineState.status === "success" && (
                  <Badge className="bg-emerald-500/20 text-emerald-700">Outline salvo</Badge>
                )}
                {saveOutlineState.status === "error" && (
                  <span className="text-destructive">{saveOutlineState.message}</span>
                )}
              </div>
            </div>
          </section>

          <Separator />

          {/* Agent Configuration Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
              <Sparkles className="h-4 w-4" /> Configuração dos Agentes
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editorModel">Editor</Label>
                <Select name="editorModel" value={editorModel} onValueChange={setEditorModel}>
                  <SelectTrigger id="editorModel">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_AGENT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label} <span className="text-xs text-muted-foreground">({model.provider})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Responsável por planejar e estruturar</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="researcherModel">Pesquisador</Label>
                <Select name="researcherModel" value={researcherModel} onValueChange={setResearcherModel}>
                  <SelectTrigger id="researcherModel">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_AGENT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label} <span className="text-xs text-muted-foreground">({model.provider})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Coleta informações e contexto</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="writerModel">Escritor</Label>
                <Select name="writerModel" value={writerModel} onValueChange={setWriterModel}>
                  <SelectTrigger id="writerModel">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_AGENT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label} <span className="text-xs text-muted-foreground">({model.provider})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Produz o conteúdo final</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reviewerModel">Revisor</Label>
                <Select name="reviewerModel" value={reviewerModel} onValueChange={setReviewerModel}>
                  <SelectTrigger id="reviewerModel">
                    <SelectValue placeholder="Selecione o modelo" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_AGENT_MODELS.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.label} <span className="text-xs text-muted-foreground">({model.provider})</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Revisa e melhora a qualidade</p>
              </div>
            </div>
          </section>

          {cloneState.status === "error" && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {cloneState.message}
            </div>
          )}

          <DrawerFooter className="border-t border-border/60 px-0">
            <div className="flex gap-3">
              <DrawerClose asChild>
                <Button variant="outline" type="button" className="flex-1">
                  Cancelar
                </Button>
              </DrawerClose>
              <Button type="submit" className="flex-1 gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/30">
                <Sparkles className="h-4 w-4" /> Gerar Projeto Agora
              </Button>
            </div>
          </DrawerFooter>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
