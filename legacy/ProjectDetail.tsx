import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { BookOpen, Loader2, Play, Pause, Sparkles, FileText, TrendingUp } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

export default function ProjectDetail() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const projectId = parseInt(params.id || "0");

  const { data: project, isLoading, refetch } = trpc.projects.get.useQuery(
    { id: projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const { data: chapters } = trpc.chapters.list.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const { data: progress } = trpc.generation.getProgress.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0, refetchInterval: 5000 }
  );

  const { data: stats } = trpc.analytics.projectStats.useQuery(
    { projectId },
    { enabled: isAuthenticated && projectId > 0 }
  );

  const startGenerationMutation = trpc.generation.startGeneration.useMutation({
    onSuccess: () => {
      toast.success("Geração iniciada!");
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const pauseGenerationMutation = trpc.generation.pauseGeneration.useMutation({
    onSuccess: () => {
      toast.success("Geração pausada");
      refetch();
    },
  });

  const resumeGenerationMutation = trpc.generation.resumeGeneration.useMutation({
    onSuccess: () => {
      toast.success("Geração retomada");
      refetch();
    },
  });

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = getLoginUrl();
    return null;
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Projeto não encontrado</h2>
          <Button onClick={() => setLocation("/dashboard")}>Voltar ao Dashboard</Button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "paused":
        return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-500/20";
    }
  };

  const progressPercentage = progress ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Sparkles className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">{APP_TITLE}</h1>
          </div>
          <Button variant="ghost" onClick={() => setLocation("/dashboard")}>
            Voltar
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Project Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-3xl font-bold text-foreground">{project.title}</h2>
                <Badge className={getStatusColor(project.status)}>
                  {project.status === "in_progress" ? "Em Progresso" :
                   project.status === "completed" ? "Concluído" :
                   project.status === "paused" ? "Pausado" : "Planejamento"}
                </Badge>
              </div>
              <p className="text-muted-foreground">{project.description || "Sem descrição"}</p>
            </div>
            <div className="flex gap-2">
              {project.status === "planning" && (
                <Button
                  onClick={() => startGenerationMutation.mutate({ projectId })}
                  disabled={startGenerationMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Iniciar Geração
                </Button>
              )}
              {project.status === "in_progress" && (
                <Button
                  variant="outline"
                  onClick={() => pauseGenerationMutation.mutate({ projectId })}
                  disabled={pauseGenerationMutation.isPending}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pausar
                </Button>
              )}
              {project.status === "paused" && (
                <Button
                  onClick={() => resumeGenerationMutation.mutate({ projectId })}
                  disabled={resumeGenerationMutation.isPending}
                >
                  <Play className="h-4 w-4 mr-2" />
                  Retomar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Progress Section */}
        {progress && (
          <Card className="bg-card border-border mb-8">
            <CardHeader>
              <CardTitle>Progresso da Geração</CardTitle>
              <CardDescription>
                {progress.completed} de {progress.total} capítulos concluídos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso Geral</span>
                  <span className="font-semibold text-foreground">{progressPercentage.toFixed(0)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-3" />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-500">{progress.completed}</p>
                  <p className="text-sm text-muted-foreground">Concluídos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-500">{progress.inProgress}</p>
                  <p className="text-sm text-muted-foreground">Em Progresso</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-500">{progress.pending}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Section */}
        {stats && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total de Tokens
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {stats.totalTokens.toLocaleString()}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tempo Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {Math.floor(stats.totalDuration / 1000 / 60)}min
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Chamadas de Agentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-foreground">
                  {Object.values(stats.agentCalls).reduce((a, b) => a + b, 0)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Chapters List */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle>Capítulos</CardTitle>
            <CardDescription>
              {chapters?.length || 0} capítulos no total
            </CardDescription>
          </CardHeader>
          <CardContent>
            {chapters && chapters.length > 0 ? (
              <div className="space-y-2">
                {chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                        {chapter.order}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{chapter.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {chapter.wordCount || 0} palavras
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        chapter.status === "completed" ? "bg-green-500/10 text-green-500 border-green-500/20" :
                        chapter.status === "pending" ? "bg-gray-500/10 text-gray-500 border-gray-500/20" :
                        "bg-blue-500/10 text-blue-500 border-blue-500/20"
                      }
                    >
                      {chapter.status === "completed" ? "Concluído" :
                       chapter.status === "pending" ? "Pendente" :
                       chapter.status === "researching" ? "Pesquisando" :
                       chapter.status === "writing" ? "Escrevendo" :
                       chapter.status === "reviewing" ? "Revisando" :
                       "Gerando Imagens"}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum capítulo criado ainda
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
