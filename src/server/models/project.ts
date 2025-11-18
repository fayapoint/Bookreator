import mongoose, { Schema, InferSchemaType } from "mongoose";

const ProjectSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["book", "course", "article"], default: "book" },
    targetPages: { type: Number, default: 50 },
    status: {
      type: String,
      enum: ["planning", "in_progress", "paused", "cancelled", "completed"],
      default: "planning",
    },
    globalSummary: { type: String },
    outline: { type: Array, default: [] },
    agentConfig: {
      editor: { model: { type: String, default: "openrouter/anthropic/claude-3.5-sonnet" } },
      researcher: { model: { type: String, default: "openrouter/openai/gpt-4o-mini" } },
      writer: { model: { type: String, default: "openrouter/openai/gpt-4o" } },
      reviewer: { model: { type: String, default: "openrouter/anthropic/claude-3-haiku" } },
      artist: { model: { type: String, default: "fal-ai/image-creation" } },
    },
    currentChapter: { type: Number, default: 0 },
    totalChapters: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type ProjectDocument = InferSchemaType<typeof ProjectSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type Project = Omit<ProjectDocument, "_id"> & { id: string };

export const ProjectModel =
  mongoose.models.Project || mongoose.model<ProjectDocument>("Project", ProjectSchema);
