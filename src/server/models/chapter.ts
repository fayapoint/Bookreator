import mongoose, { Schema, InferSchemaType } from "mongoose";

const ChapterSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    chapterId: { type: String, required: true },
    order: { type: Number, required: true },
    title: { type: String, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "researching",
        "writing",
        "reviewing",
        "generating_images",
        "paused",
        "cancelled",
        "completed",
      ],
      default: "pending",
    },
    researchContent: String,
    draftContent: String,
    reviewedContent: String,
    finalContent: String,
    researchSources: { type: Array, default: [] },
    images: { type: Array, default: [] },
    wordCount: { type: Number, default: 0 },
    contextSummary: String,
    keyPoints: { type: Array, default: [] },
    connections: { type: Array, default: [] },
  },
  { timestamps: true }
);

export type ChapterDocument = InferSchemaType<typeof ChapterSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type Chapter = Omit<ChapterDocument, "_id" | "projectId"> & {
  id: string;
  projectId: string;
};

export const ChapterModel =
  mongoose.models.Chapter || mongoose.model<ChapterDocument>("Chapter", ChapterSchema);
