"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical, Wand2, BookOpen, Clock, FileText, ChevronDown, ChevronRight, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

import { type CatalogProduct } from "@/server/models/catalog-product";

type Props = {
  product: CatalogProduct;
};

type OutlineItem = {
  order: number;
  title: string;
  description?: string;
  estimatedWords?: number;
  estimatedDuration?: number;
};

export function OutlineEditor({ product }: Props) {
  // Check if we have detailed curriculum first
  const hasDetailedCurriculum = product.detailedCurriculum?.modules && product.detailedCurriculum.modules.length > 0;
  const hasBasicOutline = product.outline && product.outline.length > 0;
  
  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [chapters, setChapters] = useState<OutlineItem[]>(
    hasBasicOutline
      ? product.outline.map((item, idx) => ({
          order: item.order ?? idx + 1,
          title: item.title,
          description: item.description || undefined,
          estimatedWords: item.estimatedWords || undefined,
          estimatedDuration: item.estimatedDuration || undefined,
        }))
      : []
  );

  const toggleModule = (moduleId: number) => {
    setExpandedModules(prev => ({ ...prev, [moduleId]: !prev[moduleId] }));
  };

  const addChapter = () => {
    setChapters([
      ...chapters,
      {
        order: chapters.length + 1,
        title: "",
        description: "",
        estimatedWords: 0,
        estimatedDuration: 0,
      },
    ]);
  };

  const removeChapter = (index: number) => {
    const updated = chapters.filter((_, i) => i !== index);
    // Reorder
    updated.forEach((ch, i) => {
      ch.order = i + 1;
    });
    setChapters(updated);
  };

  const updateChapter = (index: number, field: keyof OutlineItem, value: string | number) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  // Render detailed curriculum if available
  if (hasDetailedCurriculum) {
    const curriculum = product.detailedCurriculum!;
    const totalLessons = curriculum.totalLessons || 0;
    const totalDuration = curriculum.totalDuration || "N/A";
    const totalModules = curriculum.totalModules || curriculum.modules?.length || 0;

    return (
      <div className="space-y-6">
        {/* Stats Overview */}
        <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-background">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-2xl">
              <BookOpen className="h-7 w-7 text-primary" />
              Estrutura Completa do Currículo
            </CardTitle>
            <CardDescription className="text-base">
              Currículo detalhado com {totalModules} módulos e {totalLessons} aulas organizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <BookOpen className="h-4 w-4 text-blue-500" />
                  Módulos
                </div>
                <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{totalModules}</div>
              </div>
              
              <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <FileText className="h-4 w-4 text-violet-500" />
                  Aulas
                </div>
                <div className="mt-2 text-3xl font-bold text-violet-600 dark:text-violet-400">{totalLessons}</div>
              </div>
              
              <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Clock className="h-4 w-4 text-emerald-500" />
                  Duração
                </div>
                <div className="mt-2 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{totalDuration}</div>
              </div>
              
              <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  Capítulos
                </div>
                <div className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
                  {curriculum.totalChapters || 0}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Modules List */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Módulos do Curso</CardTitle>
                <CardDescription>
                  Visualize e gerencie todo o conteúdo do curso organizado por módulos
                </CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-2">
                <Wand2 className="h-4 w-4" /> IA: Otimizar Estrutura
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {curriculum.modules && curriculum.modules.map((module: any, modIndex: number) => {
              const isExpanded = expandedModules[modIndex];
              return (
                <div
                  key={modIndex}
                  className="overflow-hidden rounded-xl border-2 border-border/60 bg-gradient-to-br from-card via-card to-muted/20 transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  {/* Module Header */}
                  <button
                    type="button"
                    onClick={() => toggleModule(modIndex)}
                    className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex flex-1 items-start gap-4">
                      <Badge className="shrink-0 text-base font-bold" variant="default">
                        Módulo {module.moduleNumber || modIndex + 1}
                      </Badge>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-foreground">{module.title}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">{module.description}</p>
                        <div className="mt-3 flex flex-wrap gap-3">
                          <Badge variant="outline" className="gap-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            {module.duration}
                          </Badge>
                          <Badge variant="outline" className="gap-1.5">
                            <FileText className="h-3.5 w-3.5" />
                            {module.lessons} aulas
                          </Badge>
                          {module.chapters && (
                            <Badge variant="outline" className="gap-1.5">
                              <BookOpen className="h-3.5 w-3.5" />
                              {module.chapters.length} capítulos
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform" />
                    ) : (
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground transition-transform" />
                    )}
                  </button>

                  {/* Module Content - Chapters and Lessons */}
                  {isExpanded && module.chapters && (
                    <div className="border-t border-border/60 bg-muted/10 p-5">
                      <div className="space-y-4">
                        {module.chapters.map((chapter: any, chapterIndex: number) => (
                          <div
                            key={chapterIndex}
                            className="rounded-lg border border-border/40 bg-card p-4"
                          >
                            <div className="flex items-start gap-3">
                              <Badge variant="secondary" className="shrink-0">
                                Cap. {chapter.number}
                              </Badge>
                              <div className="flex-1">
                                <h4 className="font-semibold text-foreground">{chapter.title}</h4>
                                <p className="mt-1 text-sm text-muted-foreground">{chapter.duration}</p>
                                
                                {/* Lessons */}
                                {chapter.lessons && chapter.lessons.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {chapter.lessons.map((lesson: any, lessonIndex: number) => (
                                      <div
                                        key={lessonIndex}
                                        className="flex items-start gap-3 rounded-md bg-muted/30 p-3 text-sm"
                                      >
                                        <Badge variant="outline" className="shrink-0 text-xs">
                                          {lesson.number}
                                        </Badge>
                                        <div className="flex-1">
                                          <p className="font-medium text-foreground">{lesson.title}</p>
                                          <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                            <span className="flex items-center gap-1">
                                              <Clock className="h-3 w-3" />
                                              {lesson.duration}
                                            </span>
                                            {lesson.type && (
                                              <Badge variant="outline" className="text-xs">
                                                {lesson.type}
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    );
  }

  // Fallback to basic outline editor
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Estrutura do Currículo
              <Badge variant="secondary">{chapters.length} capítulos</Badge>
            </CardTitle>
            <CardDescription>
              Defina todos os capítulos/aulas do produto. Quanto mais detalhado, melhor será o resultado final.
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" className="gap-2">
              <Wand2 className="h-4 w-4" /> IA: Sugerir Estrutura
            </Button>
            <Button type="button" onClick={addChapter} size="sm" className="gap-2">
              <Plus className="h-4 w-4" /> Adicionar Capítulo
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {chapters.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/10 p-8 text-center">
            <p className="text-muted-foreground">Nenhum capítulo adicionado ainda</p>
            <Button type="button" onClick={addChapter} variant="outline" size="sm" className="mt-4 gap-2">
              <Plus className="h-4 w-4" /> Adicionar Primeiro Capítulo
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {chapters.map((chapter, index) => (
              <div
                key={index}
                className="group relative rounded-lg border border-border/60 bg-card p-4 transition-colors hover:border-primary/40"
              >
                <input type="hidden" name={`outline[${index}].order`} value={chapter.order} />
                
                <div className="flex items-start gap-3">
                  <div className="flex shrink-0 items-center gap-2">
                    <GripVertical className="h-5 w-5 text-muted-foreground" />
                    <Badge variant="outline" className="min-w-[2.5rem] justify-center">
                      {chapter.order}
                    </Badge>
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor={`chapter-${index}-title`} className="text-sm font-medium">
                        Título do Capítulo *
                      </Label>
                      <Input
                        id={`chapter-${index}-title`}
                        name={`outline[${index}].title`}
                        value={chapter.title}
                        onChange={(e) => updateChapter(index, "title", e.target.value)}
                        placeholder="Ex: Introdução à Inteligência Artificial"
                        required
                        className="font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`chapter-${index}-description`} className="text-sm">
                        Descrição / Objetivos de Aprendizado
                      </Label>
                      <Textarea
                        id={`chapter-${index}-description`}
                        name={`outline[${index}].description`}
                        value={chapter.description || ""}
                        onChange={(e) => updateChapter(index, "description", e.target.value)}
                        rows={2}
                        placeholder="O que o aluno vai aprender neste capítulo..."
                      />
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`chapter-${index}-words`} className="text-sm">
                          Palavras Estimadas
                        </Label>
                        <Input
                          id={`chapter-${index}-words`}
                          name={`outline[${index}].estimatedWords`}
                          type="number"
                          value={chapter.estimatedWords || ""}
                          onChange={(e) => updateChapter(index, "estimatedWords", parseInt(e.target.value) || 0)}
                          placeholder="Ex: 2000"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`chapter-${index}-duration`} className="text-sm">
                          Duração (minutos)
                        </Label>
                        <Input
                          id={`chapter-${index}-duration`}
                          name={`outline[${index}].estimatedDuration`}
                          type="number"
                          value={chapter.estimatedDuration || ""}
                          onChange={(e) => updateChapter(index, "estimatedDuration", parseInt(e.target.value) || 0)}
                          placeholder="Ex: 30"
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeChapter(index)}
                    className="shrink-0 text-destructive opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="rounded-lg border border-primary/40 bg-primary/5 p-4">
          <p className="text-sm font-medium">💡 Dica de Estruturação</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Para produtos de alta qualidade, defina entre 10-50 capítulos com descrições claras. 
            A IA usará essas informações para gerar conteúdo personalizado e coerente.
          </p>
        </div>

        {chapters.length > 0 && (
          <div className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
            <div className="text-sm">
              <span className="font-semibold">Total:</span> {chapters.length} capítulos •{" "}
              {chapters.reduce((acc, ch) => acc + (ch.estimatedWords || 0), 0).toLocaleString()} palavras •{" "}
              {chapters.reduce((acc, ch) => acc + (ch.estimatedDuration || 0), 0)} minutos
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
