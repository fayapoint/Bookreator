"use client";

import { useTransition } from "react";
import { RotateCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { ChapterActionResult } from "./chapter-actions";
import { regenerateChapterAction } from "./chapter-actions";

type Props = {
  projectId: string;
  chapterId: string;
};

export function ChapterRefazerButton({ projectId, chapterId }: Props) {
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    if (isPending) return;
    const toastId = `${projectId}-${chapterId}-refazer`;
    startTransition(async () => {
      try {
        toast.loading("Regenerando capítulo...", { id: toastId });
        const result: ChapterActionResult = await regenerateChapterAction(projectId, chapterId);
        toast.dismiss(toastId);
        if (result.status === "success") {
          toast.success(result.message);
        } else {
          toast.error(result.message || "Falha ao regenerar capítulo");
        }
      } catch (error) {
        toast.dismiss(toastId);
        toast.error(error instanceof Error ? error.message : "Falha ao regenerar capítulo");
      }
    });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="gap-2"
      onClick={handleClick}
      disabled={isPending}
    >
      <RotateCw className="h-3.5 w-3.5" />
      {isPending ? "Aguarde..." : "Refazer capítulo"}
    </Button>
  );
}
