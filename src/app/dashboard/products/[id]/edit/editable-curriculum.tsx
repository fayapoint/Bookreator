"use client";

import { useState } from "react";
import { Plus, Trash2, Edit2, ChevronDown, ChevronRight, BookOpen, Clock, FileText, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Lesson = {
  number: string;
  title: string;
  duration: string;
  type?: string;
  objectives?: string[];
};

type Chapter = {
  number: string;
  title: string;
  duration: string;
  lessons: Lesson[];
};

type Module = {
  moduleNumber: number;
  title: string;
  description: string;
  duration: string;
  lessons: number;
  chapters: Chapter[];
};

type Props = {
  initialCurriculum?: any;
};

export function EditableCurriculum({ initialCurriculum }: Props) {
  const [modules, setModules] = useState<Module[]>(
    initialCurriculum?.modules?.map((m: any) => ({
      moduleNumber: m.moduleNumber || 0,
      title: m.title || "",
      description: m.description || "",
      duration: m.duration || "",
      lessons: m.lessons || 0,
      chapters: (m.chapters || []).map((c: any) => ({
        number: c.number || "",
        title: c.title || "",
        duration: c.duration || "",
        lessons: (c.lessons || []).map((l: any) => ({
          number: l.number || "",
          title: l.title || "",
          duration: l.duration || "",
          type: l.type || "",
          objectives: l.objectives || [],
        })),
      })),
    })) || []
  );

  const [expandedModules, setExpandedModules] = useState<Record<number, boolean>>({});
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const toggleModule = (index: number) => {
    setExpandedModules(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const toggleChapter = (key: string) => {
    setExpandedChapters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const addModule = () => {
    setModules([
      ...modules,
      {
        moduleNumber: modules.length + 1,
        title: "",
        description: "",
        duration: "",
        lessons: 0,
        chapters: [],
      },
    ]);
  };

  const removeModule = (index: number) => {
    setModules(modules.filter((_, i) => i !== index));
  };

  const updateModule = (index: number, field: keyof Module, value: any) => {
    const updated = [...modules];
    updated[index] = { ...updated[index], [field]: value };
    setModules(updated);
  };

  const addChapter = (moduleIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].chapters.push({
      number: `${updated[moduleIndex].chapters.length + 1}`,
      title: "",
      duration: "",
      lessons: [],
    });
    setModules(updated);
  };

  const removeChapter = (moduleIndex: number, chapterIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].chapters = updated[moduleIndex].chapters.filter((_, i) => i !== chapterIndex);
    setModules(updated);
  };

  const updateChapter = (moduleIndex: number, chapterIndex: number, field: keyof Chapter, value: any) => {
    const updated = [...modules];
    updated[moduleIndex].chapters[chapterIndex] = {
      ...updated[moduleIndex].chapters[chapterIndex],
      [field]: value,
    };
    setModules(updated);
  };

  const addLesson = (moduleIndex: number, chapterIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].chapters[chapterIndex].lessons.push({
      number: `${updated[moduleIndex].chapters[chapterIndex].lessons.length + 1}`,
      title: "",
      duration: "",
      type: "Vídeo",
    });
    setModules(updated);
  };

  const removeLesson = (moduleIndex: number, chapterIndex: number, lessonIndex: number) => {
    const updated = [...modules];
    updated[moduleIndex].chapters[chapterIndex].lessons = updated[moduleIndex].chapters[
      chapterIndex
    ].lessons.filter((_, i) => i !== lessonIndex);
    setModules(updated);
  };

  const updateLesson = (
    moduleIndex: number,
    chapterIndex: number,
    lessonIndex: number,
    field: keyof Lesson,
    value: any
  ) => {
    const updated = [...modules];
    updated[moduleIndex].chapters[chapterIndex].lessons[lessonIndex] = {
      ...updated[moduleIndex].chapters[chapterIndex].lessons[lessonIndex],
      [field]: value,
    };
    setModules(updated);
  };

  const totalLessons = modules.reduce((acc, m) => {
    // Prefer explicit lessons under chapters; fall back to numeric lessons count on module
    const lessonsFromChapters = m.chapters.reduce((acc2, c) => acc2 + c.lessons.length, 0);
    if (lessonsFromChapters > 0) return acc + lessonsFromChapters;
    return acc + (m.lessons || 0);
  }, 0);

  const totalChapters = modules.reduce((acc, m) => {
    // If there are no explicit chapters but the module has lessons count,
    // treat it as having one logical chapter for stats purposes
    if (m.chapters.length > 0) return acc + m.chapters.length;
    return acc + (m.lessons > 0 ? 1 : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 via-violet-50 to-purple-50 dark:from-blue-950/20 dark:via-violet-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <BookOpen className="h-7 w-7 text-primary" />
                Estrutura Completa do Currículo
              </CardTitle>
              <CardDescription className="text-base">
                Currículo detalhado com {modules.length} módulos, {totalChapters} capítulos e {totalLessons} aulas
              </CardDescription>
            </div>
            <Button
              type="button"
              onClick={addModule}
              className="gap-2 bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white shadow-lg"
            >
              <Plus className="h-4 w-4" /> Adicionar Módulo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-xl border border-blue-400/40 bg-gradient-to-br from-blue-500/10 to-blue-600/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BookOpen className="h-4 w-4 text-blue-500" />
                Módulos
              </div>
              <div className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">{modules.length}</div>
            </div>

            <div className="rounded-xl border border-violet-400/40 bg-gradient-to-br from-violet-500/10 to-violet-600/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <FileText className="h-4 w-4 text-violet-500" />
                Capítulos
              </div>
              <div className="mt-2 text-3xl font-bold text-violet-600 dark:text-violet-400">{totalChapters}</div>
            </div>

            <div className="rounded-xl border border-purple-400/40 bg-gradient-to-br from-purple-500/10 to-purple-600/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4 text-purple-500" />
                Aulas
              </div>
              <div className="mt-2 text-3xl font-bold text-purple-600 dark:text-purple-400">{totalLessons}</div>
            </div>

            <div className="rounded-xl border border-pink-400/40 bg-gradient-to-br from-pink-500/10 to-pink-600/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Sparkles className="h-4 w-4 text-pink-500" />
                Status
              </div>
              <div className="mt-2 text-lg font-bold text-pink-600 dark:text-pink-400">
                {modules.length > 0 ? "✓ Completo" : "Vazio"}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modules List */}
      <Card>
        <CardHeader>
          <CardTitle>Módulos do Curso</CardTitle>
          <CardDescription>Adicione, edite e organize os módulos, capítulos e aulas</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {modules.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-border/60 bg-muted/10 p-12 text-center">
              <BookOpen className="mx-auto h-16 w-16 text-muted-foreground/40" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">Nenhum módulo adicionado</p>
              <p className="mt-1 text-sm text-muted-foreground">Comece criando o primeiro módulo do curso</p>
              <Button type="button" onClick={addModule} className="mt-6 gap-2" size="lg">
                <Plus className="h-5 w-5" /> Criar Primeiro Módulo
              </Button>
            </div>
          ) : (
            modules.map((module, moduleIndex) => (
              <div
                key={moduleIndex}
                className="overflow-hidden rounded-xl border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 via-card to-card dark:from-blue-950/20 dark:via-card dark:to-card shadow-lg"
              >
                {/* Hidden inputs for form submission */}
                <input type="hidden" name={`curriculum.modules[${moduleIndex}].moduleNumber`} value={module.moduleNumber} />
                <input type="hidden" name={`curriculum.modules[${moduleIndex}].title`} value={module.title} />
                <input type="hidden" name={`curriculum.modules[${moduleIndex}].description`} value={module.description} />
                <input type="hidden" name={`curriculum.modules[${moduleIndex}].duration`} value={module.duration} />

                {/* Module Header - EDITABLE */}
                <div className="border-b border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-100 to-violet-100 dark:from-blue-900/20 dark:to-violet-900/20 p-5">
                  <div className="flex items-start gap-4">
                    <button
                      type="button"
                      onClick={() => toggleModule(moduleIndex)}
                      className="shrink-0 rounded-lg p-2 hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                    >
                      {expandedModules[moduleIndex] ? (
                        <ChevronDown className="h-5 w-5 text-blue-600" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-blue-600" />
                      )}
                    </button>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-blue-600 text-white text-base font-bold px-3 py-1">
                          Módulo {module.moduleNumber}
                        </Badge>
                        <Input
                          value={module.title}
                          onChange={(e) => updateModule(moduleIndex, "title", e.target.value)}
                          placeholder="Título do Módulo"
                          className="flex-1 text-lg font-bold border-blue-300 dark:border-blue-700"
                        />
                      </div>

                      <Textarea
                        value={module.description}
                        onChange={(e) => updateModule(moduleIndex, "description", e.target.value)}
                        placeholder="Descrição do módulo..."
                        rows={2}
                        className="border-blue-300 dark:border-blue-700"
                      />

                      <div className="flex gap-3">
                        <Input
                          value={module.duration}
                          onChange={(e) => updateModule(moduleIndex, "duration", e.target.value)}
                          placeholder="Duração (ex: 3 horas)"
                          className="w-48 border-blue-300 dark:border-blue-700"
                        />
                        <Button
                          type="button"
                          onClick={() => addChapter(moduleIndex)}
                          variant="outline"
                          size="sm"
                          className="gap-2"
                        >
                          <Plus className="h-4 w-4" /> Adicionar Capítulo
                        </Button>
                      </div>
                    </div>

                    <Button
                      type="button"
                      onClick={() => removeModule(moduleIndex)}
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-red-600 hover:bg-red-100 dark:hover:bg-red-950"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Chapters - Show when expanded */}
                {expandedModules[moduleIndex] && (
                  <div className="p-5 space-y-4">
                    {module.chapters.length === 0 ? (
                      <div className="rounded-lg border-2 border-dashed border-blue-300 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 p-6 text-center">
                        <p className="text-sm text-muted-foreground">Nenhum capítulo neste módulo</p>
                        <Button
                          type="button"
                          onClick={() => addChapter(moduleIndex)}
                          variant="outline"
                          size="sm"
                          className="mt-3"
                        >
                          <Plus className="mr-2 h-4 w-4" /> Adicionar Capítulo
                        </Button>
                      </div>
                    ) : (
                      module.chapters.map((chapter, chapterIndex) => {
                        const chapterKey = `${moduleIndex}-${chapterIndex}`;
                        return (
                          <div
                            key={chapterIndex}
                            className="rounded-lg border border-violet-200 dark:border-violet-800 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 p-4"
                          >
                            {/* Hidden inputs for chapter */}
                            <input type="hidden" name={`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].number`} value={chapter.number} />
                            <input type="hidden" name={`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].title`} value={chapter.title} />
                            <input type="hidden" name={`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].duration`} value={chapter.duration} />

                            <div className="flex items-start gap-3">
                              <button
                                type="button"
                                onClick={() => toggleChapter(chapterKey)}
                                className="shrink-0 rounded p-1 hover:bg-white/50 dark:hover:bg-black/20"
                              >
                                {expandedChapters[chapterKey] ? (
                                  <ChevronDown className="h-4 w-4 text-violet-600" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-violet-600" />
                                )}
                              </button>

                              <div className="flex-1 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary" className="shrink-0">Cap. {chapter.number}</Badge>
                                  <Input
                                    value={chapter.title}
                                    onChange={(e) => updateChapter(moduleIndex, chapterIndex, "title", e.target.value)}
                                    placeholder="Título do Capítulo"
                                    className="flex-1 font-semibold border-violet-300 dark:border-violet-700"
                                  />
                                  <Input
                                    value={chapter.duration}
                                    onChange={(e) => updateChapter(moduleIndex, chapterIndex, "duration", e.target.value)}
                                    placeholder="Duração"
                                    className="w-32 border-violet-300 dark:border-violet-700"
                                  />
                                </div>

                                <Button
                                  type="button"
                                  onClick={() => addLesson(moduleIndex, chapterIndex)}
                                  variant="outline"
                                  size="sm"
                                  className="gap-2"
                                >
                                  <Plus className="h-3 w-3" /> Adicionar Aula
                                </Button>

                                {/* Lessons - Show when chapter expanded */}
                                {expandedChapters[chapterKey] && chapter.lessons.length > 0 && (
                                  <div className="mt-3 space-y-2">
                                    {chapter.lessons.map((lesson, lessonIndex) => (
                                      <div
                                        key={lessonIndex}
                                        className="flex items-start gap-2 rounded-md border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-950/20 p-3"
                                      >
                                        {/* Hidden inputs for lesson */}
                                        <input type="hidden" name={`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].number`} value={lesson.number} />
                                        <input type="hidden" name={`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].title`} value={lesson.title} />
                                        <input type="hidden" name={`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].duration`} value={lesson.duration} />
                                        <input type="hidden" name={`curriculum.modules[${moduleIndex}].chapters[${chapterIndex}].lessons[${lessonIndex}].type`} value={lesson.type || ""} />

                                        <Badge variant="outline" className="shrink-0 text-xs">{lesson.number}</Badge>
                                        <div className="flex-1 space-y-2">
                                          <Input
                                            value={lesson.title}
                                            onChange={(e) =>
                                              updateLesson(moduleIndex, chapterIndex, lessonIndex, "title", e.target.value)
                                            }
                                            placeholder="Título da Aula"
                                            className="text-sm border-purple-300 dark:border-purple-700"
                                          />
                                          <div className="flex gap-2">
                                            <Input
                                              value={lesson.duration}
                                              onChange={(e) =>
                                                updateLesson(moduleIndex, chapterIndex, lessonIndex, "duration", e.target.value)
                                              }
                                              placeholder="Duração"
                                              className="w-24 text-xs border-purple-300 dark:border-purple-700"
                                            />
                                            <Input
                                              value={lesson.type || ""}
                                              onChange={(e) =>
                                                updateLesson(moduleIndex, chapterIndex, lessonIndex, "type", e.target.value)
                                              }
                                              placeholder="Tipo"
                                              className="w-24 text-xs border-purple-300 dark:border-purple-700"
                                            />
                                          </div>
                                        </div>
                                        <Button
                                          type="button"
                                          onClick={() => removeLesson(moduleIndex, chapterIndex, lessonIndex)}
                                          variant="ghost"
                                          size="icon"
                                          className="h-8 w-8 text-red-600"
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <Button
                                type="button"
                                onClick={() => removeChapter(moduleIndex, chapterIndex)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
