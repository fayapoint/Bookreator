"use client";

import { useState, useActionState } from "react";
import { Sparkles, Save, BookOpen, DollarSign, Image, Users, Settings as SettingsIcon, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { type CatalogProduct } from "@/server/models/catalog-product";
import { updateFullProductAction, type UpdateProductState } from "@/app/dashboard/products/[id]/edit/actions";
import { EditableCurriculum } from "@/app/dashboard/products/[id]/edit/editable-curriculum";
import { EditableBonuses } from "@/app/dashboard/products/[id]/edit/editable-bonuses";
import { EditableTestimonials } from "@/app/dashboard/products/[id]/edit/editable-testimonials";
import { EditableFAQs } from "@/app/dashboard/products/[id]/edit/editable-faqs";

type Props = {
  product: CatalogProduct;
};

export function ProductEditForm({ product }: Props) {
  const [state, formAction] = useActionState<UpdateProductState, FormData>(
    updateFullProductAction,
    { status: "idle" }
  );

  const [activeTab, setActiveTab] = useState("basic");

  const displayTitle = product.title || product.copy?.headline || "";
  const displaySummary = product.summary || product.copy?.shortDescription || "";
  const displayDescription = product.description || product.copy?.fullDescription || "";

  // Determine existing curriculum source
  const simpleCurriculum = (product as any).curriculum as any;
  const detailed = product.detailedCurriculum as any;
  const outline = product.outline as any[] | undefined;

  const hasDetailedModules =
    !!detailed && Array.isArray(detailed.modules) && detailed.modules.length > 0;

  const hasSimpleCurriculumModules =
    !!simpleCurriculum && Array.isArray(simpleCurriculum.modules) && simpleCurriculum.modules.length > 0;

  const initialCurriculum = hasSimpleCurriculumModules
    ? {
          totalModules: simpleCurriculum.modules.length,
          totalChapters: 0,
          totalLessons: 0,
          modules: simpleCurriculum.modules.map((m: any, index: number) => ({
            moduleNumber: m.moduleNumber || index + 1,
            title: m.title || "",
            description: m.description || "",
            duration: m.duration || "",
            lessons: m.lessons || 0,
            chapters: (m.chapters || []).map((c: any, chapterIndex: number) => ({
              number: c.number || String(chapterIndex + 1),
              title: c.title || "",
              duration: c.duration || "",
              lessons: (c.lessons || []),
            })),
          })),
        }
      : hasDetailedModules
        ? detailed
      : outline && outline.length > 0
        ? {
            totalModules: 1,
            totalChapters: outline.length,
            totalLessons: 0,
            modules: [
              {
                moduleNumber: 1,
                title: "Módulo 1",
                description: "",
                duration: "",
                lessons: 0,
                chapters: outline.map((item: any, index: number) => ({
                  number: String(index + 1),
                  title: item.title || "",
                  duration: "",
                  lessons: [],
                })),
              },
            ],
          }
        : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="productId" value={product.id} />

      {/* Beautiful header with vibrant gradient */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-violet-400/50 bg-gradient-to-br from-violet-100 via-purple-100 to-pink-100 dark:from-violet-950 dark:via-purple-950 dark:to-pink-950 p-8 shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-violet-500/10 to-pink-500/10 dark:from-blue-500/5 dark:via-violet-500/5 dark:to-pink-500/5" />
        <div className="relative">
          <h2 className="text-4xl font-black bg-gradient-to-r from-violet-600 via-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-violet-400 dark:via-purple-400 dark:to-pink-400">
            {displayTitle}
          </h2>
          <p className="mt-3 text-lg text-violet-900 dark:text-violet-200">
            {displaySummary || displayDescription}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {product.tags?.map((tag, i) => (
              <Badge key={i} className="bg-violet-600 text-white hover:bg-violet-700 shadow-md">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-6 gap-2 rounded-2xl bg-gradient-to-r from-violet-100 via-purple-100 to-pink-100 dark:from-violet-950/50 dark:via-purple-950/50 dark:to-pink-950/50 p-2 shadow-lg lg:w-auto lg:inline-grid">
          <TabsTrigger 
            value="basic" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-blue-700 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Sparkles className="h-4 w-4" /> Básico
          </TabsTrigger>
          <TabsTrigger 
            value="outline" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-violet-700 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <BookOpen className="h-4 w-4" /> Currículo
          </TabsTrigger>
          <TabsTrigger 
            value="copy" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-purple-700 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Wand2 className="h-4 w-4" /> Copy
          </TabsTrigger>
          <TabsTrigger 
            value="pricing" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-emerald-700 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <DollarSign className="h-4 w-4" /> Preços
          </TabsTrigger>
          <TabsTrigger 
            value="media" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-amber-600 data-[state=active]:to-amber-700 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Image className="h-4 w-4" /> Mídia
          </TabsTrigger>
          <TabsTrigger 
            value="audience" 
            className="gap-2 rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-600 data-[state=active]:to-pink-700 data-[state=active]:text-white data-[state=active]:shadow-lg"
          >
            <Users className="h-4 w-4" /> Audiência
          </TabsTrigger>
        </TabsList>

        {/* BASIC INFO TAB */}
        <TabsContent value="basic" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações Fundamentais</CardTitle>
              <CardDescription>Dados essenciais sobre o produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Título do Produto *</Label>
                  <Input
                    id="title"
                    name="title"
                    defaultValue={displayTitle}
                    placeholder="Ex: Dominando IA com ChatGPT"
                    required
                    className="text-base"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Produto *</Label>
                  <Select name="type" defaultValue={product.type || "course"}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="book">Livro</SelectItem>
                      <SelectItem value="article">Artigo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">Resumo</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  defaultValue={displaySummary}
                  rows={2}
                  placeholder="Um resumo curto e direto do produto"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição Completa</Label>
                <Textarea
                  id="description"
                  name="description"
                  defaultValue={displayDescription}
                  rows={4}
                  placeholder="Descrição detalhada incluindo benefícios, diferenciais e o que o aluno vai aprender"
                />
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="level">Nível</Label>
                  <Select name="level" defaultValue={product.level || ""}>
                    <SelectTrigger id="level">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Iniciante</SelectItem>
                      <SelectItem value="intermediate">Intermediário</SelectItem>
                      <SelectItem value="advanced">Avançado</SelectItem>
                      <SelectItem value="all">Todos os níveis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Formato</Label>
                  <Input
                    id="format"
                    name="format"
                    defaultValue={product.format || ""}
                    placeholder="Ex: Vídeo, Texto, Híbrido"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPages">Meta de Páginas</Label>
                  <Input
                    id="targetPages"
                    name="targetPages"
                    type="number"
                    defaultValue={product.targetPages || 80}
                    min={10}
                    max={500}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                <Input
                  id="tags"
                  name="tags"
                  defaultValue={product.tags?.join(", ") || ""}
                  placeholder="ia, automação, produtividade"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* OUTLINE/CURRICULUM TAB */}
        <TabsContent value="outline" className="space-y-6 mt-6">
          <EditableCurriculum initialCurriculum={initialCurriculum} />
        </TabsContent>

        {/* COPY TAB */}
        <TabsContent value="copy" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Copy & Marketing</CardTitle>
                  <CardDescription>Textos persuasivos para conversão</CardDescription>
                </div>
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Wand2 className="h-4 w-4" /> Melhorar com IA
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="headline">Headline Principal</Label>
                <Input
                  id="headline"
                  name="headline"
                  defaultValue={product.copy?.headline || ""}
                  placeholder="Título impactante que chama atenção"
                  className="text-lg"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subheadline">Subheadline</Label>
                <Input
                  id="subheadline"
                  name="subheadline"
                  defaultValue={product.copy?.subheadline || ""}
                  placeholder="Complemento que explica o valor"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shortDescription">Descrição Curta</Label>
                <Textarea
                  id="shortDescription"
                  name="shortDescription"
                  defaultValue={product.copy?.shortDescription || ""}
                  rows={3}
                  placeholder="Uma descrição concisa para cards e listagens"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullDescription">Descrição Completa (Copy Longa)</Label>
                <Textarea
                  id="fullDescription"
                  name="fullDescription"
                  defaultValue={product.copy?.fullDescription || ""}
                  rows={8}
                  placeholder="Copy de vendas completa com benefícios, transformação, provas sociais"
                />
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="benefits">Benefícios (um por linha)</Label>
                <Textarea
                  id="benefits"
                  name="benefits"
                  defaultValue={product.copy?.benefits?.join("\n") || ""}
                  rows={6}
                  placeholder="Domine IA em 30 dias&#10;Aumente sua produtividade em 10x&#10;Crie automações profissionais"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Call-to-Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="ctaPrimaryText">CTA Principal - Texto</Label>
                  <Input
                    id="ctaPrimaryText"
                    name="ctaPrimaryText"
                    defaultValue={product.cta?.primary?.text || ""}
                    placeholder="Comprar Agora"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaPrimaryUrl">CTA Principal - URL</Label>
                  <Input
                    id="ctaPrimaryUrl"
                    name="ctaPrimaryUrl"
                    type="url"
                    defaultValue={product.cta?.primary?.url || ""}
                    placeholder="https://..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* EDITABLE BONUSES */}
          <EditableBonuses initialBonuses={product.bonuses} />

          {/* EDITABLE TESTIMONIALS */}
          <EditableTestimonials initialTestimonials={product.testimonials} />

          {/* IMPACT STATEMENTS */}
          {(product.copy?.impactCompanies || product.copy?.impactEntrepreneurs || product.copy?.impactIndividuals) && (
            <Card className="border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  💎 Declarações de Impacto
                </CardTitle>
                <CardDescription>Benefícios específicos para cada público</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {product.copy?.impactCompanies && product.copy.impactCompanies.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold text-blue-600 dark:text-blue-400">🏢 Para Empresas</h4>
                    <div className="space-y-1">
                      {product.copy.impactCompanies.map((impact: string, i: number) => (
                        <div key={i} className="text-sm text-muted-foreground">{impact}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {product.copy?.impactEntrepreneurs && product.copy.impactEntrepreneurs.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold text-violet-600 dark:text-violet-400">🚀 Para Empreendedores</h4>
                    <div className="space-y-1">
                      {product.copy.impactEntrepreneurs.map((impact: string, i: number) => (
                        <div key={i} className="text-sm text-muted-foreground">{impact}</div>
                      ))}
                    </div>
                  </div>
                )}
                
                {product.copy?.impactIndividuals && product.copy.impactIndividuals.length > 0 && (
                  <div>
                    <h4 className="mb-2 font-semibold text-emerald-600 dark:text-emerald-400">👤 Para Indivíduos</h4>
                    <div className="space-y-1">
                      {product.copy.impactIndividuals.map((impact: string, i: number) => (
                        <div key={i} className="text-sm text-muted-foreground">{impact}</div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* EDITABLE FAQs */}
          <EditableFAQs initialFaqs={product.faqs} />
        </TabsContent>

        {/* PRICING TAB */}
        <TabsContent value="pricing" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Preços</CardTitle>
              <CardDescription>Defina o modelo de precificação do produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="price">Preço de Venda (R$)</Label>
                  <Input
                    id="price"
                    name="price"
                    type="number"
                    step="0.01"
                    defaultValue={product.pricing?.price || product.price || ""}
                    placeholder="297.00"
                    className="text-lg font-semibold"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="originalPrice">Preço Original (R$)</Label>
                  <Input
                    id="originalPrice"
                    name="originalPrice"
                    type="number"
                    step="0.01"
                    defaultValue={product.pricing?.originalPrice || ""}
                    placeholder="597.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Moeda</Label>
                  <Select name="currency" defaultValue={product.pricing?.currency || "BRL"}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">BRL - Real</SelectItem>
                      <SelectItem value="USD">USD - Dólar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
                <p className="text-sm font-medium">💡 Dica de Precificação</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Mostrar o preço original cria senso de urgência e destaca o valor do desconto. 
                  Considere um desconto entre 30-50% para máxima conversão.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MEDIA TAB */}
        <TabsContent value="media" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Imagens e Mídia</CardTitle>
              <CardDescription>Adicione imagens para tornar o produto visualmente atraente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="heroImage">Imagem Principal (Hero)</Label>
                <Input
                  id="heroImage"
                  name="heroImage"
                  type="url"
                  defaultValue={product.heroImage || ""}
                  placeholder="https://exemplo.com/hero-image.jpg"
                  className="font-mono text-sm"
                />
                {product.heroImage && (
                  <div className="mt-3 overflow-hidden rounded-lg border border-border/60">
                    <img src={product.heroImage} alt="Preview" className="h-48 w-full object-cover" />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="images">Galeria de Imagens (URLs separadas por vírgula)</Label>
                <Textarea
                  id="images"
                  name="images"
                  rows={4}
                  defaultValue={product.images?.join(", ") || ""}
                  placeholder="https://exemplo.com/img1.jpg, https://exemplo.com/img2.jpg"
                  className="font-mono text-sm"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AUDIENCE TAB */}
        <TabsContent value="audience" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Público-Alvo e Categorias</CardTitle>
              <CardDescription>Defina para quem este produto é ideal</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Audiência Principal</Label>
                <Textarea
                  id="audience"
                  name="audience"
                  defaultValue={product.audience || ""}
                  rows={3}
                  placeholder="Descreva quem é o público-alvo ideal: profissionais, estudantes, empresários, etc."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="categoryPrimary">Categoria Principal</Label>
                  <Input
                    id="categoryPrimary"
                    name="categoryPrimary"
                    defaultValue={product.categoryPrimary || ""}
                    placeholder="Tecnologia, Negócios, Marketing"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="categorySecondary">Categoria Secundária</Label>
                  <Input
                    id="categorySecondary"
                    name="categorySecondary"
                    defaultValue={product.categorySecondary || ""}
                    placeholder="IA, Automação, Produtividade"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="targetAudience">Público-Alvo Detalhado (um por linha)</Label>
                <Textarea
                  id="targetAudience"
                  name="targetAudience"
                  defaultValue={product.targetAudience?.join("\n") || ""}
                  rows={4}
                  placeholder="Profissionais de marketing&#10;Empreendedores digitais&#10;Desenvolvedores"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SAVE SECTION */}
      <Card className="sticky bottom-4 border-2 border-primary/40 bg-card/95 shadow-2xl backdrop-blur">
        <CardContent className="flex items-center justify-between gap-4 p-4">
          <div className="flex-1">
            {state.status === "error" && (
              <p className="text-sm font-medium text-destructive">❌ {state.message}</p>
            )}
            {state.status === "success" && (
              <p className="text-sm font-medium text-emerald-500">✅ {state.message}</p>
            )}
            {state.status === "idle" && (
              <p className="text-sm text-muted-foreground">Faça as alterações necessárias e salve</p>
            )}
          </div>
          <Button type="submit" size="lg" className="gap-2 shadow-lg shadow-primary/30">
            <Save className="h-5 w-5" /> Salvar Todas as Alterações
          </Button>
        </CardContent>
      </Card>
    </form>
  );
}
