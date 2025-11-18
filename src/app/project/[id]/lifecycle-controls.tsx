"use client";

import { useState, useTransition } from "react";
import { CirclePause, CirclePlay, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  cancelProjectAction,
  deleteProjectAction,
  pauseProjectAction,
  resumeProjectAction,
  runPendingChaptersAction,
  type LifecycleActionResult,
} from "@/app/dashboard/project-lifecycle-actions";

const statusCopy: Record<string, { label: string; tone: string }> = {
  planning: { label: "Planejamento", tone: "text-slate-200" },
  in_progress: { label: "Em execução", tone: "text-sky-200" },
  paused: { label: "Pausado", tone: "text-amber-200" },
  cancelled: { label: "Cancelado", tone: "text-rose-200" },
  completed: { label: "Concluído", tone: "text-emerald-200" },
};

type ControlKey = "run" | "pause" | "resume" | "cancel" | "delete";

const controls: Record<ControlKey, {
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: "outline" | "secondary" | "destructive";
  confirm?: boolean;
  tooltip?: string;
}> = {
  run: {
    label: "Gerar capítulos",
    icon: CirclePlay,
    tooltip: "Executa os agentes para capítulos pendentes",
  },
  pause: {
    label: "Pausar produção",
    icon: CirclePause,
    variant: "outline",
    tooltip: "Interrompe os agentes imediatamente",
  },
  resume: {
    label: "Retomar",
    icon: CirclePlay,
    tooltip: "Continua após ajustes ou reavaliação",
  },
  cancel: {
    label: "Cancelar",
    icon: ShieldAlert,
    variant: "outline",
    confirm: true,
    tooltip: "Encerra o projeto e evita custos adicionais",
  },
  delete: {
    label: "Excluir",
    icon: Trash2,
    variant: "destructive",
    confirm: true,
    tooltip: "Remove histórico e capítulos deste projeto",
  },
};

type Props = {
  projectId: string;
  status: string;
};

const actionHandlers: Record<ControlKey, (projectId: string) => Promise<LifecycleActionResult>> = {
  run: runPendingChaptersAction,
  pause: pauseProjectAction,
  resume: resumeProjectAction,
  cancel: cancelProjectAction,
  delete: deleteProjectAction,
};

export function ProjectLifecycleControls({ projectId, status }: Props) {
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<LifecycleActionResult | null>(null);
  const [activeKey, setActiveKey] = useState<ControlKey | null>(null);

  const availableKeys: ControlKey[] = [];
  if (!["cancelled", "completed"].includes(status)) {
    availableKeys.push("run");
  }
  if (status === "in_progress") {
    availableKeys.push("pause");
  }
  if (status === "paused") {
    availableKeys.push("resume");
  }
  if (!["cancelled", "completed"].includes(status)) {
    availableKeys.push("cancel");
  }
  availableKeys.push("delete");

  const handleClick = (key: ControlKey) => {
    if (isPending) return;
    const control = controls[key];
    if (control.confirm && !window.confirm(`Confirmar ${control.label.toLowerCase()}?`)) {
      return;
    }

    setActiveKey(key);
    startTransition(async () => {
      const toastId = `${projectId}-${key}`;
      try {
        toast.loading(`${control.label}...`, { id: toastId });
        const result = await actionHandlers[key](projectId);
        setFeedback(result);
        toast.dismiss(toastId);
        if (result.status === "success") {
          toast.success(result.message);
        } else {
          toast.error(result.message || "Falha ao atualizar projeto");
        }
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(error instanceof Error ? error.message : "Falha ao executar ação");
      } finally {
        setActiveKey(null);
      }
    });
  };

  const currentStatus = statusCopy[status] || statusCopy.planning;

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Status atual</p>
          <Badge variant="outline" className={`mt-1 border-border/60 ${currentStatus.tone}`}>
            {currentStatus.label}
          </Badge>
        </div>
        {feedback ? (
          <span
            className={`text-xs font-medium ${
              feedback.status === "success" ? "text-emerald-300" : "text-destructive"
            }`}
          >
            {feedback.message}
          </span>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        {availableKeys.map((key) => {
          const control = controls[key];
          const Icon = control.icon;
          return (
            <Button
              key={key}
              size="sm"
              variant={control.variant ?? "secondary"}
              disabled={isPending}
              onClick={() => handleClick(key)}
              className="gap-2"
              title={control.tooltip}
            >
              <Icon className="h-4 w-4" />
              {activeKey === key && isPending ? "Aguarde..." : control.label}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
