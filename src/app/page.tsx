"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { APP_TITLE, APP_TAGLINE } from "@/lib/constants";
import { BookOpen, Bot, FileText, Image as ImageIcon, LayoutDashboard, Sparkles, Users } from "lucide-react";

const agentHighlights = [
  {
    icon: Users,
    title: "Editor-Chefe",
    description: "Orquestra o fluxo de criação e garante coesão entre capítulos.",
  },
  {
    icon: FileText,
    title: "Pesquisador",
    description: "Mergulha em fontes confiáveis e prepara dossiês detalhados para cada capítulo.",
  },
  {
    icon: BookOpen,
    title: "Escritor",
    description: "Transforma pesquisas em narrativa consistente e envolvente.",
  },
  {
    icon: Bot,
    title: "Revisor",
    description: "Garante qualidade editorial, sugere melhorias e mantém o tom alinhado.",
  },
  {
    icon: ImageIcon,
    title: "Artista",
    description: "Gera imagens, mockups e capas para cada capítulo ou módulo.",
  },
];

const stats = [
  { label: "Modelos conectados", value: "15+" },
  { label: "Capítulos por projeto", value: "até 250" },
  { label: "Agentes paralelos", value: "5 principais" },
  { label: "Formatos de exportação", value: "MD, HTML" },
];

export default function Home() {
  const router = useRouter();

  const handleStart = () => {
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="container mx-auto flex items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <Sparkles className="h-9 w-9 text-primary" />
            <div>
              <p className="text-lg font-semibold text-foreground">{APP_TITLE}</p>
              <p className="text-sm text-muted-foreground">{APP_TAGLINE}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Entrar</Link>
            </Button>
            <Button onClick={handleStart}>Começar</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-16 space-y-20">
        <section className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <Badge className="bg-primary/15 text-primary border-primary/20">Fábrica de Conteúdo Inteligente</Badge>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Crie Livros, Cursos e Documentações com um time de agentes IA
            </h1>
            <p className="text-lg text-muted-foreground">
              Configure modelos da OpenRouter para cada agente, gere até 250 páginas com controle de contexto e exporte
              tudo em formatos profissionais. Operação contínua, logs detalhados e monitoramento em tempo real.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button size="lg" className="px-8" onClick={handleStart}>
                Começar agora
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/dashboard">Ver dashboard</Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat) => (
                <Card key={stat.label} className="bg-card/80 border-border/60">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs uppercase tracking-wide text-muted-foreground">
                      {stat.label}
                    </CardDescription>
                    <CardTitle className="text-2xl font-semibold text-foreground">{stat.value}</CardTitle>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
          <Card className="bg-card border-border/60 shadow-xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <LayoutDashboard className="h-6 w-6 text-primary" />
                <div>
                  <CardTitle className="text-xl">Dashboard Inteligente</CardTitle>
                  <CardDescription>Controle total dos agentes, capítulos e modelos.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-xl border border-border/60 bg-background/70 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Projeto</span>
                  <Badge variant="outline">Em progresso</Badge>
                </div>
                <h3 className="mt-2 text-xl font-semibold text-foreground">Livro Técnico de IA aplicada</h3>
                <p className="text-sm text-muted-foreground">120 capítulos • 5 agentes • 4 modelos OpenRouter</p>
                <Separator className="my-4" />
                <div className="space-y-3">
                  {["Pesquisa", "Escrita", "Revisão", "Imagens"].map((phase, idx) => (
                    <div key={phase} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-2.5 w-2.5 rounded-full" style={{ background: `hsl(${260 + idx * 15} 70% 60%)` }} />
                        <span>{phase}</span>
                      </div>
                      <span className="text-muted-foreground">{30 + idx * 15}%</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-border/60 bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">Resumo executivo</p>
                <p className="text-base font-medium text-foreground">
                  Cada capítulo valida contexto anterior e mantém um sumário global em tempo real, garantindo coesão do
                  material completo.
                </p>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-3">
            <p className="text-sm font-semibold uppercase tracking-widest text-primary">Agentes Especializados</p>
            <h2 className="text-3xl font-bold text-foreground">Cada agente tem um papel claro no pipeline</h2>
            <p className="text-muted-foreground">
              Configure modelos diferentes para cada agente, defina tokens, temperatura e monitore logs no MongoDB em
              tempo real.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {agentHighlights.map((agent) => (
              <Card key={agent.title} className="border-border/60 bg-card/80">
                <CardHeader>
                  <agent.icon className="h-10 w-10 text-primary" />
                  <CardTitle className="text-xl">{agent.title}</CardTitle>
                  <CardDescription>{agent.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
            <Card className="border-dashed border-primary/40 bg-primary/5">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-primary" />
                <CardTitle>Controle de Contexto</CardTitle>
                <CardDescription>
                  Cada capítulo gera um resumo automático armazenado no MongoDB e consultado pelo próximo agente antes de continuar.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </section>

        <section className="space-y-6 rounded-3xl border border-border/60 bg-muted/40 p-8 shadow-inner">
          <div className="flex flex-col gap-4 text-center lg:flex-row lg:items-center lg:justify-between lg:text-left">
            <div>
              <p className="text-sm uppercase tracking-widest text-primary">Integração OpenRouter</p>
              <h3 className="text-2xl font-semibold text-foreground">
                Selecione modelos por agente e combine Claude, GPT-4o, Mistral e mais na mesma orquestração.
              </h3>
              <p className="text-muted-foreground max-w-2xl">
                O sistema armazena chaves no MongoDB, aplica rate limiting, registra tokens usados e gera logs detalhados por agente, capítulo e modelo.
              </p>
            </div>
            <Button size="lg" className="px-8" variant="secondary" onClick={handleStart}>
              Abrir Dashboard
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} {APP_TITLE}. Impulsionado por agentes de IA.
      </footer>
    </div>
  );
}
