"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowRight, CirclePause, CirclePlay, ShieldAlert, Trash2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { getProjectsByUser } from "@/server/services/projects";
import {
  cancelProjectAction,
  deleteProjectAction,
  pauseProjectAction,
  resumeProjectAction,
  runPendingChaptersAction,
  type LifecycleActionResult,
} from "./project-lifecycle-actions";
import { toast } from "sonner";

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
  cancelled: {
    label: "Cancelado",
    badgeClass: "bg-rose-500/10 text-rose-200 border-rose-500/30",
  },
};

const lifecycleHandlers = {
  run: runPendingChaptersAction,
  pause: pauseProjectAction,
  resume: resumeProjectAction,
  cancel: cancelProjectAction,
  delete: deleteProjectAction,
};

type ProjectCardProps = {
  project: Awaited<ReturnType<typeof getProjectsByUser>>[number];
};

type LifecycleActionKey = keyof typeof lifecycleHandlers;

type ControlConfig = {
  key: LifecycleActionKey;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: "default" | "outline" | "destructive";
  confirm?: boolean;
};

function ProjectProgress({ total, current }: { total: number; current: number }) {
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

export function ProjectCard({ project }: ProjectCardProps) {
  const [feedback, setFeedback] = useState<LifecycleActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<LifecycleActionKey | null>(null);

  const projectStatus = statusCopy[project.status] || statusCopy.planning;
  const total = project.totalChapters || project.outline?.length || 0;
  const current = project.currentChapter || 0;

  const availableControls: ControlConfig[] = [];

  if (!["cancelled", "completed"].includes(project.status)) {
    availableControls.push({
      key: "run",
      label: project.status === "planning" ? "Iniciar produção" : "Gerar capítulos",
      icon: CirclePlay,
    });
  }

  if (project.status === "in_progress") {
    availableControls.push({ key: "pause", label: "Pausar", icon: CirclePause, variant: "outline" });
  }

  if (project.status === "paused") {
    availableControls.push({ key: "resume", label: "Continuar", icon: CirclePlay });
  }

  if (!["cancelled", "completed"].includes(project.status)) {
    availableControls.push({ key: "cancel", label: "Cancelar", icon: ShieldAlert, variant: "outline", confirm: true });
  }

  availableControls.push({ key: "delete", label: "Excluir", icon: Trash2, variant: "destructive", confirm: true });

  const handleLifecycle = (config: ControlConfig) => {
    if (isPending) return;
    if (config.confirm && !window.confirm(`Confirmar ${config.label.toLowerCase()}?`)) {
      return;
    }

    setActiveAction(config.key);
    startTransition(async () => {
      try {
        toast.loading(`${config.label}...`, { id: `${project.id}-${config.key}` });
        const result = await lifecycleHandlers[config.key](project.id);
        setFeedback(result);
        toast.dismiss(`${project.id}-${config.key}`);
        if (result.status === "success") {
          toast.success(result.message);
        } else {
          toast.error(result.message || "Falha ao atualizar projeto");
        }
      } catch (error) {
        toast.dismiss(`${project.id}-${config.key}`);
        toast.error(error instanceof Error ? error.message : "Falha ao executar ação");
      } finally {
        setActiveAction(null);
      }
    });
  };

  return (
    <Card className="h-full border-border/70 bg-card/90">
      <CardHeader className="space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="capitalize">
            {project.type}
          </Badge>
          <Badge className={cn("text-xs", projectStatus.badgeClass)}>{projectStatus.label}</Badge>
        </div>
        <div>
          <CardTitle>{project.title}</CardTitle>
          <CardDescription>{project.description || "Sem descrição"}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProjectProgress total={total} current={current} />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Meta: {project.targetPages} páginas</span>
          <span>Atualizado {new Date(project.updatedAt ?? Date.now()).toLocaleDateString("pt-BR")}</span>
        </div>
        {feedback ? (
          <div
            className={cn(
              "rounded-lg border px-3 py-2 text-xs",
              feedback.status === "success"
                ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-200"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            )}
            aria-live="polite"
          >
            {feedback.message}
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-col gap-3 border-t border-border/60 pt-4">
        <div className="flex flex-wrap gap-2">
          {availableControls.map((control) => (
            <Button
              key={control.key}
              variant={control.variant ?? "default"}
              size="sm"
              className="gap-2"
              disabled={isPending}
              onClick={() => handleLifecycle(control)}
            >
              <control.icon className="h-4 w-4" />
              {activeAction === control.key && isPending ? "Aguarde..." : control.label}
            </Button>
          ))}
        </div>
        <div className="flex w-full justify-between text-xs text-muted-foreground">
          <span>Visão detalhada</span>
          <Button variant="ghost" size="sm" asChild className="gap-1 text-primary">
            <Link href={`/project/${project.id}`}>
              Abrir projeto <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
