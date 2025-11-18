"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Moon, Sparkles, Sun, Wand2 } from "lucide-react";
import { useTheme } from "next-themes";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import type { SuggestionFormState } from "./actions";

const outlinePlaceholder = `Módulo 1: Fundamentos
Módulo 2: Pesquisa aplicada
Módulo 3: Escrita orientada por IA
Módulo 4: Revisão contextual
Módulo 5: Assets e entrega final`;

type Props = {
  suggestionState: SuggestionFormState;
  suggestionAction: (formData: FormData) => void;
};

export function ProductSuggestionForm({ suggestionState, suggestionAction }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewSummary, setPreviewSummary] = useState("");
  const [previewAudience, setPreviewAudience] = useState("");
  const [previewTags, setPreviewTags] = useState<string[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const currentTheme = !mounted || !theme ? "dark" : theme;

  return (
    <Card className="border-primary/40 bg-gradient-to-b from-primary/10 via-background to-background">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Wand2 className="h-5 w-5 text-primary" /> Nova sugestão de produto
            </CardTitle>
            <CardDescription>Descreva ideias de cursos/livros para alimentar os agentes.</CardDescription>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="border-primary/40 text-primary">
              Funil ativo
            </Badge>
            <div className="hidden text-[11px] text-muted-foreground sm:block">Visual</div>
            <div className="inline-flex rounded-full border border-border/60 bg-background/80 p-1 text-[11px] shadow-sm">
              <button
                type="button"
                onClick={() => setTheme("light")}
                className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors ${
                  currentTheme === "light"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Sun className="h-3 w-3" />
                <span>Claro</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("dark")}
                className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors ${
                  currentTheme === "dark"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Moon className="h-3 w-3" />
                <span>Escuro</span>
              </button>
              <button
                type="button"
                onClick={() => setTheme("neon")}
                className={`flex items-center gap-1 rounded-full px-2 py-1 transition-colors ${
                  currentTheme === "neon"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <Sparkles className="h-3 w-3" />
                <span>Neon</span>
              </button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={suggestionAction} className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="space-y-2 lg:col-span-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                name="title"
                placeholder="Ex: Jornada IA para Educadores"
                required
                onChange={(event) => setPreviewTitle(event.target.value)}
              />
            </div>
            <div className="space-y-2 lg:col-span-1">
              <Label htmlFor="summary">Resumo curto</Label>
              <Input
                id="summary"
                name="summary"
                placeholder="Pitch rápido para lembrar do produto"
                onChange={(event) => setPreviewSummary(event.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição detalhada</Label>
              <Textarea
                id="description"
                name="description"
                rows={4}
                placeholder="Explique objetivos, transformações e o que torna esse curso/livro único"
              />
            </div>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="audience">Público ideal</Label>
                <Textarea
                  id="audience"
                  name="audience"
                  rows={3}
                  placeholder="Quem você quer atingir? Ex: professores do ensino médio, creators iniciantes, líderes de produto"
                  onChange={(event) => setPreviewAudience(event.target.value)}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="level">Nível</Label>
                  <Input id="level" name="level" placeholder="Iniciante, Intermediário ou Avançado" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="format">Formato</Label>
                  <Input id="format" name="format" placeholder="Ao vivo, gravado, cohort, mentoria, ebook" />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Tipo de produto *</Label>
              <Select name="type" defaultValue="course">
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="course">Curso</SelectItem>
                  <SelectItem value="book">Livro</SelectItem>
                  <SelectItem value="article">Artigo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="targetPages">Páginas / Duração</Label>
              <Input id="targetPages" name="targetPages" type="number" min={10} max={500} defaultValue={120} />
              <p className="text-xs text-muted-foreground">Uma estimativa ajuda os agentes a planejarem carga de trabalho.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
              <Input
                id="tags"
                name="tags"
                placeholder="educação, IA, docentes"
                onChange={(event) => {
                  const raw = event.target.value || "";
                  const tags = raw
                    .split(",")
                    .map((tag) => tag.trim())
                    .filter(Boolean);
                  setPreviewTags(tags);
                }}
              />
              <p className="text-xs text-muted-foreground">Usaremos essas tags para organizar o funil e os testes.</p>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="space-y-2">
              <Label htmlFor="outline">Outline *</Label>
              <Textarea id="outline" name="outline" rows={7} defaultValue={outlinePlaceholder} />
              <p className="text-xs text-muted-foreground">Um capítulo por linha. Usaremos isso para alimentar os agentes.</p>
            </div>
            <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/10 p-4 lg:p-5">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                Prévia do pitch
              </p>
              <div className="space-y-1.5">
                <h4 className="text-base font-semibold text-foreground">
                  {previewTitle || "Título ainda em branco"}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {previewSummary || "Use o resumo curto para explicar o resultado em uma frase."}
                </p>
              </div>
              {previewAudience && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Público ideal</p>
                  <p className="text-xs text-foreground">{previewAudience}</p>
                </div>
              )}
              {previewTags.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {previewTags.map((tag) => (
                      <Badge key={tag} variant="outline" className="border-border/60 text-[11px]">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="mt-2 text-[11px] text-muted-foreground">
                Essa é a visão rápida que os agentes terão ao priorizar esse produto no funil.
              </p>
            </div>
          </div>

          {suggestionState.status === "error" && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
              {suggestionState.message}
            </div>
          )}
          {suggestionState.status === "success" && (
            <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 p-3 text-sm text-emerald-300">
              {suggestionState.message}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" className="flex-1">
              Registrar sugestão
            </Button>
            <Button type="button" variant="outline" className="flex-1" asChild>
              <Link href="/project/new">Criar manualmente</Link>
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
