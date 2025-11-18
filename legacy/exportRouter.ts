/**
 * Export Router
 * Handles content export to various formats (PDF, DOCX, EPUB, HTML)
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getProjectById, getChaptersByProjectId } from "./db";

export const exportRouter = router({
  /**
   * Export project to Markdown
   */
  exportMarkdown: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      const chapters = await getChaptersByProjectId(input.projectId);
      const sortedChapters = chapters.sort((a, b) => a.order - b.order);
      
      let markdown = `# ${project.title}\n\n`;
      
      if (project.description) {
        markdown += `${project.description}\n\n`;
      }
      
      markdown += `---\n\n`;
      
      for (const chapter of sortedChapters) {
        if (chapter.finalContent) {
          markdown += `## ${chapter.title}\n\n`;
          markdown += `${chapter.finalContent}\n\n`;
          markdown += `---\n\n`;
        }
      }
      
      return {
        content: markdown,
        filename: `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`,
      };
    }),
  
  /**
   * Export project to HTML
   */
  exportHTML: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      const chapters = await getChaptersByProjectId(input.projectId);
      const sortedChapters = chapters.sort((a, b) => a.order - b.order);
      
      let html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title}</title>
  <style>
    body {
      font-family: Georgia, serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 40px 20px;
      color: #333;
    }
    h1 {
      font-size: 2.5em;
      margin-bottom: 0.5em;
      color: #1a1a1a;
    }
    h2 {
      font-size: 2em;
      margin-top: 2em;
      margin-bottom: 0.5em;
      color: #2a2a2a;
      border-bottom: 2px solid #ddd;
      padding-bottom: 0.3em;
    }
    p {
      margin-bottom: 1em;
      text-align: justify;
    }
    .description {
      font-style: italic;
      color: #666;
      margin-bottom: 2em;
    }
    .chapter {
      page-break-before: always;
    }
  </style>
</head>
<body>
  <h1>${project.title}</h1>
  ${project.description ? `<p class="description">${project.description}</p>` : ''}
  <hr>
`;
      
      for (const chapter of sortedChapters) {
        if (chapter.finalContent) {
          html += `  <div class="chapter">
    <h2>${chapter.title}</h2>
    ${chapter.finalContent.split('\n\n').map(p => `<p>${p}</p>`).join('\n    ')}
  </div>\n`;
        }
      }
      
      html += `</body>
</html>`;
      
      return {
        content: html,
        filename: `${project.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`,
      };
    }),
  
  /**
   * Get export status
   */
  getExportStatus: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input, ctx }) => {
      const project = await getProjectById(input.projectId);
      
      if (!project || project.userId !== ctx.user.id) {
        throw new Error("Project not found or access denied");
      }
      
      const chapters = await getChaptersByProjectId(input.projectId);
      const completedChapters = chapters.filter(ch => ch.status === "completed");
      
      const canExport = completedChapters.length > 0;
      const totalWords = completedChapters.reduce((sum, ch) => sum + (ch.wordCount || 0), 0);
      const estimatedPages = Math.ceil(totalWords / 500);
      
      return {
        canExport,
        completedChapters: completedChapters.length,
        totalChapters: chapters.length,
        totalWords,
        estimatedPages,
      };
    }),
});
