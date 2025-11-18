import { NextResponse } from "next/server";

import { getCurrentUserId } from "@/server/current-user";
import { getChaptersByProject, getProjectById } from "@/server/services/projects";

function slugify(title: string) {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const userId = getCurrentUserId();
  const { id } = await params;
  const project = await getProjectById(userId, id);

  if (!project) {
    return new NextResponse("Projeto não encontrado", { status: 404 });
  }

  const chapters = await getChaptersByProject(project.id);
  const sorted = [...chapters].sort((a, b) => (a.order || 0) - (b.order || 0));

  const lines: string[] = [];

  lines.push(`# ${project.title}`);
  if (project.description) {
    lines.push("", project.description);
  }

  lines.push("", `Tipo: ${project.type}`, `Meta: ${project.targetPages} páginas`, "");
  lines.push("---", "");

  for (const chapter of sorted) {
    lines.push(`## ${chapter.order}. ${chapter.title}`);
    lines.push("");
    const text = chapter.reviewedContent || chapter.finalContent || chapter.draftContent;
    if (text) {
      lines.push(String(text).trim(), "");
    } else {
      lines.push("(Capítulo sem conteúdo gerado)", "");
    }
  }

  const body = lines.join("\n");
  const filename = `${slugify(project.title) || "projeto"}.md`;

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
