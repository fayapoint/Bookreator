import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Circle,
  Clock3,
  Download,
  LayoutDashboard,
  ListChecks,
  NotebookPen,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { getCurrentUserId } from "@/server/current-user";
import {
  getChaptersByProject,
  getProjectAnalytics,
  getProjectById,
} from "@/server/services/projects";
import { ProjectLifecycleControls } from "./lifecycle-controls";
import { ChapterRefazerButton } from "./chapter-refazer-button";

const statusCopy: Record<string, { label: string; badgeClass: string; description: string }> = {
  planning: {
    label: "Planejamento",
    badgeClass: "bg-slate-500/15 text-slate-200 border-slate-500/30",
    description: "Organizando capítulos e agentes",
  },
  in_progress: {
    label: "Em progresso",
    badgeClass: "bg-blue-500/15 text-blue-100 border-blue-500/30",
    description: "Agentes operando em paralelo",
  },
  completed: {
    label: "Concluído",
    badgeClass: "bg-emerald-500/15 text-emerald-100 border-emerald-500/30",
    description: "Conteúdo finalizado",
  },
  paused: {
    label: "Pausado",
    badgeClass: "bg-amber-500/15 text-amber-100 border-amber-500/30",
    description: "Execução interrompida temporariamente",
  },
};

function formatDate(value?: string | Date) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

function formatTime(value?: string | Date) {
  if (!value) return "—";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default async function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const userId = getCurrentUserId();
  const { id } = await params;

  let project = null;
  try {
    project = await getProjectById(userId, id);
  } catch (error) {
    console.error("Failed to load project", error);
  }

  if (!project) {
    notFound();
  }

  const [chapters, analytics] = await Promise.all([
    getChaptersByProject(project.id).catch((error) => {
      console.error("Failed to load chapters", error);
      return [];
    }),
    getProjectAnalytics(project.id).catch((error) => {
      console.error("Failed to load analytics", error);
      return null;
    }),
  ]);

  const defaultChapterStats = {
    total: chapters.length,
    completed: chapters.filter((ch) => ch.status === "completed").length,
    inProgress: chapters.filter((ch) => !["pending", "completed"].includes(ch.status)).length,
    pending: chapters.filter((ch) => ch.status === "pending").length,
  };

  const chapterStats = analytics?.chapterStats ?? defaultChapterStats;
  const tokenUsage =
    analytics?.tokenUsage ?? ({ total: 0, input: 0, output: 0, durationMs: 0, agentCalls: {} } as const);
  const logs = analytics?.recentLogs ?? [];

  const progress = chapterStats.total > 0 ? Math.round((chapterStats.completed / chapterStats.total) * 100) : 0;
  const curriculumOutline = Array.isArray(project.outline) ? project.outline : [];
  const outlineEntries = (curriculumOutline.length > 0
    ? curriculumOutline
    : chapters.map((chapter) => ({
        order: chapter.order,
        title: chapter.title,
        description: chapter.contextSummary,
      }))) as Array<{ order?: number; title?: string; description?: string }>;

  const chaptersWithFinalContent = chapters.filter((ch) => Boolean(ch.reviewedContent || ch.finalContent)).length;
  const chaptersWithImages = chapters.filter((ch) => Array.isArray(ch.images) && ch.images.length > 0).length;
  const totalAssets = chapters.reduce((acc, ch) => acc + (Array.isArray(ch.images) ? ch.images.length : 0), 0);
  const researchSourcesCount = chapters.reduce(
    (acc, ch) => acc + (Array.isArray(ch.researchSources) ? ch.researchSources.length : 0),
    0
  );
  const hasErrors = logs.some((log) => log.status === "error");

  const targetWordsPerChapter =
    project.targetPages && chapterStats.total
      ? Math.floor((project.targetPages * 500) / chapterStats.total)
      : null;

  const marketingDeliverables: Array<{ label: string; value: string; ready: boolean }> = [
    { label: "Headline principal", value: project.title || "Sem título", ready: Boolean(project.title) },
    {
      label: "Subheadline / Descrição curta",
      value: project.description || "Sem descrição cadastrada",
      ready: Boolean(project.description),
    },
    {
      label: "Resumo global",
      value: project.globalSummary ||
        "Execute o agente editor após concluir cada capítulo para consolidar o resumo.",
      ready: Boolean(project.globalSummary),
    },
    {
      label: "CTA principal",
      value: "Defina texto e url do CTA antes da publicação final.",
      ready: false,
    },
    {
      label: "Ofertas / Bônus",
      value: "Mapeie seus bônus e anexos para agregar valor ao lançamento.",
      ready: false,
    },
  ];

  const assetHighlights: Array<{ label: string; value: string; helper?: string; ready: boolean }> = [
    {
      label: "Capítulos com conteúdo final",
      value: `${chaptersWithFinalContent}/${chapters.length || 1}`,
      helper: "Baseado em finalContent",
      ready: chapters.length > 0 && chaptersWithFinalContent === chapters.length,
    },
    {
      label: "Capítulos com imagens",
      value: `${chaptersWithImages}/${chapters.length || 1}`,
      helper: "Use o agente artista para cada capítulo",
      ready: chapters.length > 0 && chaptersWithImages === chapters.length,
    },
    {
      label: "Assets gerados",
      value: `${totalAssets} imagens`,
      helper: "Somatório de imagens por capítulo",
      ready: totalAssets > 0,
    },
    {
      label: "Fontes pesquisadas",
      value: `${researchSourcesCount} referências`,
      helper: "Registradas pelos agentes pesquisadores",
      ready: researchSourcesCount > 0,
    },
  ];

  const checklistItems: Array<{ label: string; done: boolean; helper?: string }> = [
    {
      label: "Outline definido",
      done: outlineEntries.length > 0,
      helper: `${outlineEntries.length} itens mapeados`,
    },
    {
      label: "Resumo global consolidado",
      done: Boolean(project.globalSummary),
    },
    {
      label: "Capítulos completos",
      done: chapterStats.total > 0 && chapterStats.completed === chapterStats.total,
      helper: `${chapterStats.completed}/${chapterStats.total || 1}`,
    },
    {
      label: "Assets visuais gerados",
      done: totalAssets > 0,
      helper: totalAssets ? `${totalAssets} imagens` : "Pendentes",
    },
    {
      label: "Logs sem erros",
      done: !hasErrors,
      helper: hasErrors ? "Revise execuções com falha" : "Ok",
    },
  ];

  const nextActions: Array<{ label: string; detail?: string }> = [];
  if (chapterStats.pending > 0) {
    nextActions.push({ label: "Gerar capítulos pendentes", detail: `${chapterStats.pending} capítulos aguardando execução` });
  }
  if (project.status === "paused") {
    nextActions.push({ label: "Retomar produção", detail: "Use o botão Retomar para continuar a execução." });
  }
  if (!project.globalSummary) {
    nextActions.push({ label: "Atualizar resumo global", detail: "Execute o agente editor após concluir os capítulos." });
  }
  if (totalAssets === 0) {
    nextActions.push({ label: "Planejar assets visuais", detail: "Acione o agente artista para gerar imagens ou gráficos." });
  }
  if (hasErrors) {
    nextActions.push({ label: "Investigar erros recentes", detail: "Consulte os logs e ajuste prompts/modelos." });
  }
  if (nextActions.length === 0) {
    nextActions.push({ label: "Tudo pronto!", detail: "Você pode exportar o conteúdo ou iniciar a etapa de publicação." });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute left-1/2 top-16 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-primary">
              <Sparkles className="h-9 w-9" />
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-primary/70">Projeto</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-foreground">{project.title}</h1>
              <Badge variant="outline" className="capitalize text-sm">
                {project.type}
              </Badge>
              <Badge
                className={statusCopy[project.status]?.badgeClass || statusCopy.planning.badgeClass}
              >
                {statusCopy[project.status]?.label || statusCopy.planning.label}
              </Badge>
            </div>
            <p className="max-w-3xl text-muted-foreground">{project.description || "Projeto sem descrição."}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" /> Dashboard
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/project/new">
                <NotebookPen className="mr-2 h-4 w-4" /> Novo projeto
              </Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href={`/project/${project.id}/export`}>
                <Download className="mr-2 h-4 w-4" /> Exportar Markdown
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-10">
        <ProjectLifecycleControls projectId={project.id} status={project.status} />
        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-card/90 shadow-lg shadow-primary/10">
            <CardHeader className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <CardTitle className="text-2xl">Progresso dos capítulos</CardTitle>
                <CardDescription>
                  {chapterStats.completed} de {chapterStats.total || 1} capítulos concluídos
                </CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Última atualização</p>
                <p className="text-lg font-semibold text-foreground">{formatDate(project.updatedAt)}</p>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Progresso geral</span>
                  <span className="font-semibold text-foreground">{progress}%</span>
                </div>
                <Progress value={progress} className="h-3 bg-muted/50" />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {[{
                  label: "Concluídos",
                  value: chapterStats.completed,
                  accent: "text-emerald-400",
                },
                {
                  label: "Em execução",
                  value: chapterStats.inProgress,
                  accent: "text-blue-300",
                },
                {
                  label: "Pendentes",
                  value: chapterStats.pending,
                  accent: "text-slate-300",
                }].map((stat) => (
                  <div key={stat.label} className="rounded-2xl border border-border/70 bg-muted/20 p-4">
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className={`text-3xl font-semibold ${stat.accent}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-background/85">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-primary" /> Métricas dos agentes
              </CardTitle>
              <CardDescription>Tokens e chamadas recentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                  <p className="text-sm text-muted-foreground">Tokens totais</p>
                  <p className="text-3xl font-semibold text-foreground">{tokenUsage.total.toLocaleString()}</p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/80 p-4">
                  <p className="text-sm text-muted-foreground">Tempo acumulado</p>
                  <p className="text-3xl font-semibold text-foreground">
                    {Math.max(1, Math.round((tokenUsage.durationMs || 0) / 60000))} min
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Entrada</span>
                  <span>{tokenUsage.input.toLocaleString()} tokens</span>
                </div>
                <Progress value={(tokenUsage.input / Math.max(1, tokenUsage.total)) * 100} className="h-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Saída</span>
                  <span>{tokenUsage.output.toLocaleString()} tokens</span>
                </div>
                <Progress value={(tokenUsage.output / Math.max(1, tokenUsage.total)) * 100} className="h-1.5" />
              </div>

              <Separator className="my-4" />

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Chamadas por agente</p>
                {Object.entries(tokenUsage.agentCalls).length === 0 ? (
                  <p className="text-sm text-muted-foreground">Sem logs registrados ainda.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(tokenUsage.agentCalls).map(([agent, count]) => (
                      <Badge key={agent} variant="outline" className="border-primary/40 text-primary">
                        {agent}: {count}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-8 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-5 w-5 text-primary" /> Capítulos
              </CardTitle>
              <CardDescription>Estrutura completa do conteúdo</CardDescription>
            </CardHeader>
            <CardContent>
              {chapters.length === 0 ? (
                <div className="text-center text-muted-foreground py-12">
                  Nenhum capítulo registrado ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {chapters.map((chapter) => (
                    <div
                      key={chapter.id}
                      className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/80 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-4">
                          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
                            {chapter.order}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{chapter.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {chapter.wordCount || 0} palavras
                              {targetWordsPerChapter
                                ? ` • meta ~${targetWordsPerChapter.toLocaleString()} palavras`
                                : ""}
                            </p>
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-xs capitalize"
                        >
                          {chapter.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      {chapter.reviewedContent || chapter.finalContent ? (
                        <div className="mt-1 max-h-64 w-full overflow-y-auto rounded-xl bg-muted/10 p-3 text-xs text-muted-foreground whitespace-pre-line">
                          {chapter.reviewedContent || chapter.finalContent}
                        </div>
                      ) : null}

                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-[11px] text-muted-foreground">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">Prompts de imagem</span>
                          {Array.isArray(chapter.images) && chapter.images.length > 0 ? (
                            <ul className="list-disc pl-4 space-y-0.5">
                              {chapter.images.slice(0, 3).map((img: any, index: number) => (
                                <li key={index} className="truncate" title={img.prompt || String(img)}>
                                  {(img.prompt as string) || String(img)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <span>Nenhum prompt gerado ainda.</span>
                          )}
                        </div>

                        <ChapterRefazerButton projectId={project.id} chapterId={chapter.id} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" /> Logs recentes dos agentes
              </CardTitle>
              <CardDescription>25 últimas execuções</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logs.length === 0 ? (
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center text-sm text-muted-foreground">
                  Sem logs disponíveis para este projeto ainda.
                </div>
              ) : (
                <div className="space-y-3">
                  {logs.map((log) => (
                    <div key={log.id} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="capitalize text-xs">
                            {log.agentType}
                          </Badge>
                          <span className="text-muted-foreground">{log.model}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)} • {formatTime(log.createdAt)}
                        </span>
                      </div>
                      <Separator className="my-3" />
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3.5 w-3.5" /> {log.inputTokens || 0} in
                        </span>
                        <span className="flex items-center gap-1">
                          <Activity className="h-3.5 w-3.5" /> {log.outputTokens || 0} out
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock3 className="h-3.5 w-3.5" /> {Math.max(1, Math.round((log.duration || 0) / 1000))}s
                        </span>
                        <Badge variant="outline" className={log.status === "success" ? "border-emerald-300 text-emerald-200" : "border-destructive/60 text-destructive"}>
                          {log.status === "success" ? "OK" : "Erro"}
                        </Badge>
                      </div>
                      {log.errorMessage && (
                        <p className="mt-3 text-xs text-destructive">{log.errorMessage}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" /> Entregáveis finais
              </CardTitle>
              <CardDescription>Tudo que será usado no lançamento do curso/livro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {marketingDeliverables.map((item) => (
                <div key={item.label} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <Badge variant="outline" className={item.ready ? "border-emerald-400/40 text-emerald-200" : "border-amber-400/40 text-amber-200"}>
                      {item.ready ? "Pronto" : "Pendente"}
                    </Badge>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground whitespace-pre-line">{item.value}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Resumo de assets
              </CardTitle>
              <CardDescription>Conteúdo gerado pelos agentes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {assetHighlights.map((asset) => (
                <div key={asset.label} className="rounded-2xl border border-border/60 bg-background/80 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{asset.label}</p>
                      {asset.helper ? (
                        <p className="text-xs text-muted-foreground">{asset.helper}</p>
                      ) : null}
                    </div>
                    <Badge variant="outline" className={asset.ready ? "border-emerald-400/40 text-emerald-200" : "border-slate-400/40 text-slate-200"}>
                      {asset.value}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" /> Outline e estrutura
              </CardTitle>
              <CardDescription>Visão completa do que será entregue</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {outlineEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/60 p-6 text-center text-sm text-muted-foreground">
                  Nenhum outline cadastrado. Configure o roteiro para orientar os agentes.
                </div>
              ) : (
                outlineEntries.map((entry, index) => (
                  <div key={`${entry.title}-${index}`} className="flex flex-col gap-1 rounded-2xl border border-border/60 bg-background/80 p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-primary">#{entry.order ?? index + 1}</span>
                      <p className="font-medium text-foreground">{entry.title || "Capítulo"}</p>
                    </div>
                    {entry.description ? (
                      <p className="text-xs text-muted-foreground">{entry.description}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LayoutDashboard className="h-5 w-5 text-primary" /> Checklist & próximos passos
              </CardTitle>
              <CardDescription>Garanta que nada fique faltando</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                {checklistItems.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 p-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      {item.helper ? <p className="text-xs text-muted-foreground">{item.helper}</p> : null}
                    </div>
                    {item.done ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-300" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold text-foreground">Próximas ações</p>
                <div className="space-y-2">
                  {nextActions.map((action, index) => (
                    <div key={`${action.label}-${index}`} className="rounded-2xl border border-primary/30 bg-primary/5 p-3">
                      <p className="text-sm font-medium text-primary">{action.label}</p>
                      {action.detail ? (
                        <p className="text-xs text-muted-foreground">{action.detail}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </div>
  );
}
