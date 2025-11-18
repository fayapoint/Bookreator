import Link from "next/link";
import { ArrowRight, BarChart3, BookOpen, Layers, Plus, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { APP_TAGLINE, APP_TITLE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { getCurrentUserId } from "@/server/current-user";
import { getProjectsByUser } from "@/server/services/projects";
import { listCatalogProducts } from "@/server/services/catalog-products";
import { ProjectCard } from "./project-card";
import { CatalogProductsSection } from "./products-section";

const statusCopy: Record<string, { label: string; badgeClass: string }> = {
  planning: {
    label: "Planejamento",
    badgeClass: "bg-slate-500/10 text-slate-200 border-slate-500/30",
  },
  in_progress: {
    label: "Em progresso",
    badgeClass: "bg-blue-500/10 text-blue-200 border-blue-500/30",
  },
  completed: {
    label: "Concluído",
    badgeClass: "bg-green-500/10 text-green-200 border-green-500/30",
  },
  paused: {
    label: "Pausado",
    badgeClass: "bg-amber-500/10 text-amber-200 border-amber-500/30",
  },
};

function ProjectProgress({ project }: { project: Awaited<ReturnType<typeof getProjectsByUser>>[number] }) {
  const total = project.totalChapters || project.outline?.length || 0;
  const current = project.currentChapter || 0;
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Progresso</span>
        <span className="font-semibold text-foreground">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-2 bg-muted/40" />
      <div className="text-xs text-muted-foreground">
        {current}/{total || 1} capítulos concluídos
      </div>
    </div>
  );
}

export default async function DashboardPage() {
  const userId = getCurrentUserId();
  let projects: Awaited<ReturnType<typeof getProjectsByUser>> = [];
  let catalogProducts = [] as Awaited<ReturnType<typeof listCatalogProducts>>;

  try {
    projects = await getProjectsByUser(userId);
  } catch (error) {
    console.error("Failed to load projects", error);
  }

  try {
    catalogProducts = await listCatalogProducts(30);
  } catch (error) {
    console.error("Failed to load catalog products", error);
  }

  const summaries = {
    total: projects.length,
    active: projects.filter((p) => p.status === "in_progress").length,
    completed: projects.filter((p) => p.status === "completed").length,
    paused: projects.filter((p) => p.status === "paused").length,
    cancelled: projects.filter((p) => p.status === "cancelled").length,
    pages: projects.reduce((acc, project) => acc + (project.targetPages || 0), 0),
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]">
      <div className="absolute inset-0 -z-10 opacity-60">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-background to-background" />
        <div className="absolute left-1/2 top-10 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      </div>

      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3 text-primary">
              <Sparkles className="h-8 w-8" />
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary/70">{APP_TAGLINE}</p>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-foreground">{APP_TITLE}</h1>
              <p className="text-muted-foreground">Central de orquestração de livros, cursos e documentações</p>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" asChild>
              <Link href="/">Voltar para o site</Link>
            </Button>
            <Button asChild>
              <Link href="/project/new">
                <Plus className="mr-2 h-4 w-4" /> Novo Projeto
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 space-y-12">
        <section className="grid gap-6 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-2xl shadow-primary/10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <Badge className="bg-primary/15 text-primary">
              Operação assistida por IA em tempo real
            </Badge>
            <h2 className="text-4xl font-semibold leading-tight text-foreground">
              Monitoramento completo dos agentes, capítulos e tokens consumidos.
            </h2>
            <p className="text-lg text-muted-foreground">
              Configure diferentes modelos por agente, acompanhe o progresso de cada capítulo e tenha um painel consolidado
              com métricas de contexto, tokens e logs.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" asChild>
                <Link href="/project/new">Iniciar novo fluxo</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="#projects">Projetos recentes</Link>
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {[
                {
                  icon: BookOpen,
                  label: "Projetos ativos",
                  value: summaries.active || "—",
                  description: "Rodando agentes em paralelo",
                },
                {
                  icon: Layers,
                  label: "Páginas planejadas",
                  value: summaries.pages || "—",
                  description: "Volume alvo somado",
                },
                {
                  icon: Sparkles,
                  label: "Pausados / Cancelados",
                  value: `${summaries.paused}/${summaries.cancelled}`,
                  description: "Projetos aguardando ação",
                },
              ].map((stat) => (
                <Card key={stat.label} className="border-border/80 bg-background/80">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0">
                    <CardDescription className="uppercase tracking-widest text-xs text-muted-foreground">
                      {stat.label}
                    </CardDescription>
                    <stat.icon className="h-5 w-5 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-semibold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Card className="border border-border/70 bg-background/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-primary" /> Panorama rápido
              </CardTitle>
              <CardDescription>Resumo consolidado dos seus projetos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-sm text-muted-foreground">Projetos</p>
                  <p className="text-2xl font-semibold text-foreground">{summaries.total}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                  <p className="text-2xl font-semibold text-foreground">{summaries.completed}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Agentes</p>
                  <p className="text-2xl font-semibold text-foreground">5</p>
                </div>
              </div>
              <div className="rounded-2xl border border-border/60 bg-muted/40 p-4">
                <p className="text-sm font-medium text-muted-foreground">Logs de agentes</p>
                <p className="text-foreground text-lg">Monitoramento granular de tokens, tempo e status.</p>
              </div>
              <div className="rounded-2xl border border-border/60 bg-primary/10 p-4">
                <p className="text-sm text-primary">Contexto compartilhado</p>
                <p className="text-base text-primary-foreground">
                  Cada capítulo atualiza um sumário global para manter coerência em toda a obra.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section id="projects" className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">Seus projetos</p>
              <h3 className="text-2xl font-semibold text-foreground">Monitoramento em tempo real</h3>
            </div>
            <Button variant="ghost" asChild>
              <Link href="/project/new">
                Criar projeto <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>

          {projects.length === 0 ? (
            <Card className="border-dashed border-primary/40 bg-primary/5">
              <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
                <Sparkles className="h-12 w-12 text-primary" />
                <div>
                  <h4 className="text-xl font-semibold text-foreground">Nenhum projeto ainda</h4>
                  <p className="text-muted-foreground">
                    Comece configurando seu outline e deixe os agentes cuidarem do resto.
                  </p>
                </div>
                <Button size="lg" asChild>
                  <Link href="/project/new">
                    <Plus className="mr-2 h-4 w-4" /> Criar primeiro projeto
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </section>
        <CatalogProductsSection products={catalogProducts} />
      </main>
    </div>
  );
}
