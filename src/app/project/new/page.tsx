"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { createProjectAction, type CreateProjectActionState } from "./actions";

const outlinePlaceholder = `Introdução à Inteligência Artificial
Modelos Generativos em Profundidade
Infraestrutura e Deploy
Casos de Uso na Indústria
Roadmap de Implementação`;

const defaultState: CreateProjectActionState = { status: "idle" };

const typeCopy: Record<string, string> = {
  book: "Livro",
  course: "Curso",
  article: "Artigo",
};

export default function NewProjectPage() {
  const [state, formAction] = useActionState(createProjectAction, defaultState);
  const [outline, setOutline] = useState(outlinePlaceholder);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const outlineCount = useMemo(() => outline.split("\n").filter((line) => line.trim()).length, [outline]);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.15),_transparent_55%)]">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-background via-background/95 to-background" />

      <header className="border-b border-border/60 bg-background/70 backdrop-blur-lg">
        <div className="container mx-auto flex flex-wrap items-center justify-between gap-4 px-6 py-6">
          <div>
            <div className="flex items-center gap-3 text-primary">
              <Sparkles className="h-7 w-7" />
              <p className="uppercase text-xs tracking-[0.4em] text-primary/70">Pipeline Criativo</p>
            </div>
            <h1 className="text-3xl font-semibold text-foreground">Novo projeto</h1>
            <p className="text-muted-foreground">Configure o escopo e deixe o time de agentes assumir.</p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/dashboard">Voltar ao dashboard</Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-12 space-y-8">
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-border/60 bg-card/90 shadow-xl shadow-primary/5">
            <CardHeader>
              <CardTitle>Informações do projeto</CardTitle>
              <CardDescription>Defina título, tipo e meta para os agentes.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                action={async (formData) => {
                  setIsSubmitting(true);
                  await formAction(formData);
                  setIsSubmitting(false);
                }}
                className="space-y-6"
              >
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input id="title" name="title" placeholder="Ex: Guia completo de IA aplicada" required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea id="description" name="description" rows={3} placeholder="Detalhe o objetivo do projeto" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo *</Label>
                    <Select name="type" defaultValue="book">
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(typeCopy).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetPages">Páginas alvo *</Label>
                    <Input id="targetPages" name="targetPages" type="number" min={1} max={250} defaultValue={120} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="outline">Outline / capítulos *</Label>
                  <Textarea
                    id="outline"
                    name="outline"
                    rows={10}
                    value={outline}
                    onChange={(event) => setOutline(event.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">{outlineCount} capítulos definidos</p>
                </div>

                {state.status === "error" && (
                  <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    {state.message}
                  </div>
                )}

                {state.status === "success" && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-300">
                    <CheckCircle2 className="h-4 w-4" /> {state.message}
                  </div>
                )}

                <div className="flex gap-4">
                  <Button type="button" variant="outline" className="flex-1" asChild>
                    <Link href="/dashboard">Cancelar</Link>
                  </Button>
                  <Button type="submit" className="flex-1" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando projeto...
                      </>
                    ) : (
                      "Criar projeto"
                    )}
                  </Button>
                </div>

                {state.status === "success" && (
                  <Button asChild variant="secondary" className="w-full">
                    <Link href={`/project/${state.projectId}`}>Ir para o projeto</Link>
                  </Button>
                )}
              </form>
            </CardContent>
          </Card>

          <Card className="border border-border/60 bg-gradient-to-br from-primary/10 via-background to-background">
            <CardHeader>
              <CardTitle>Configuração dos agentes</CardTitle>
              <CardDescription>Modelos padrão ajustados para equilíbrio entre custo e qualidade.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {["Editor", "Pesquisador", "Escritor", "Revisor", "Artista"].map((agent) => (
                <div key={agent} className="rounded-xl border border-border/70 bg-card/80 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{agent}</p>
                      <p className="text-lg font-medium text-foreground">Modelos OpenRouter premium</p>
                    </div>
                    <Badge variant="outline" className="border-primary/40 text-primary">
                      Ajustável em breve
                    </Badge>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
                <p className="text-sm uppercase tracking-widest text-primary">Contexto global</p>
                <p className="text-base text-primary-foreground">
                  Cada capítulo gera um sumário armazenado no MongoDB e reutilizado pelos agentes subsequentes.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
