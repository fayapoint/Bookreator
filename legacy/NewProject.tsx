import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Loader2, Sparkles } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function NewProject() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"book" | "course" | "article">("book");
  const [targetPages, setTargetPages] = useState(50);
  const [outlineText, setOutlineText] = useState("");

  const createProjectMutation = trpc.projects.create.useMutation({
    onSuccess: (project) => {
      toast.success("Projeto criado com sucesso!");
      setLocation(`/project/${project?.id}`);
    },
    onError: (error) => {
      toast.error(`Erro ao criar projeto: ${error.message}`);
    },
  });

  if (authLoading) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Por favor, insira um título");
      return;
    }
    
    // Parse outline from text (one chapter per line)
    const lines = outlineText.split("\n").filter(line => line.trim());
    const outline = lines.map((line, index) => ({
      chapterId: `chapter-${index + 1}`,
      title: line.trim(),
      description: "",
      order: index + 1,
      estimatedWords: Math.floor((targetPages * 500) / lines.length),
    }));
    
    if (outline.length === 0) {
      toast.error("Por favor, adicione pelo menos um capítulo");
      return;
    }
    
    // Default agent configuration
    const agentConfig = {
      editor: { model: "anthropic/claude-3.5-sonnet" },
      researcher: { model: "openai/gpt-4-turbo" },
      writer: { model: "anthropic/claude-3.5-sonnet" },
      reviewer: { model: "openai/gpt-4-turbo" },
      artist: { model: "openai/dall-e-3" },
    };
    
    createProjectMutation.mutate({
      title,
      description,
      type,
      targetPages,
      outline,
      agentConfig,
    });
  };

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
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Novo Projeto</h2>
          <p className="text-muted-foreground mt-1">
            Configure seu projeto e comece a gerar conteúdo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Informações Básicas</CardTitle>
              <CardDescription>
                Defina o título, tipo e objetivo do seu projeto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título do Projeto *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Guia Completo de Machine Learning"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva brevemente o objetivo e conteúdo do projeto..."
                  rows={3}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo de Conteúdo *</Label>
                  <Select value={type} onValueChange={(v: any) => setType(v)}>
                    <SelectTrigger id="type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="book">Livro</SelectItem>
                      <SelectItem value="course">Curso</SelectItem>
                      <SelectItem value="article">Artigo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPages">Páginas Alvo *</Label>
                  <Input
                    id="targetPages"
                    type="number"
                    min={1}
                    max={250}
                    value={targetPages}
                    onChange={(e) => setTargetPages(parseInt(e.target.value) || 50)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Estrutura do Conteúdo</CardTitle>
              <CardDescription>
                Liste os capítulos ou seções (um por linha)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="outline">Capítulos *</Label>
                <Textarea
                  id="outline"
                  value={outlineText}
                  onChange={(e) => setOutlineText(e.target.value)}
                  placeholder={"Introdução ao Machine Learning\nAlgoritmos Supervisionados\nRedes Neurais\nDeep Learning\nConclusão"}
                  rows={10}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Digite um capítulo por linha. {outlineText.split("\n").filter(l => l.trim()).length} capítulos definidos.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Configuração de Agentes</CardTitle>
              <CardDescription>
                Os modelos padrão já estão configurados. Você poderá ajustá-los depois.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>✓ Editor: Claude 3.5 Sonnet</p>
              <p>✓ Pesquisador: GPT-4 Turbo</p>
              <p>✓ Escritor: Claude 3.5 Sonnet</p>
              <p>✓ Revisor: GPT-4 Turbo</p>
              <p>✓ Artista: DALL-E 3</p>
            </CardContent>
          </Card>

          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLocation("/dashboard")}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createProjectMutation.isPending}
              className="flex-1"
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                "Criar Projeto"
              )}
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
}
