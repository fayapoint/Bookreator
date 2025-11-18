import mongoose, { Schema, InferSchemaType } from "mongoose";

const AgentLogSchema = new Schema(
  {
    projectId: { type: Schema.Types.ObjectId, ref: "Project", required: true, index: true },
    chapterId: { type: Schema.Types.ObjectId, ref: "Chapter" },
    agentType: { type: String, enum: ["editor", "researcher", "writer", "reviewer", "artist"], required: true },
    model: { type: String, required: true },
    inputTokens: { type: Number, default: 0 },
    outputTokens: { type: Number, default: 0 },
    duration: { type: Number, default: 0 },
    status: { type: String, enum: ["success", "error"], default: "success" },
    errorMessage: String,
  },
  { timestamps: true }
);

export type AgentLogDocument = InferSchemaType<typeof AgentLogSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type AgentLog = Omit<AgentLogDocument, "_id" | "projectId" | "chapterId"> & {
  id: string;
  projectId: string;
  chapterId?: string;
};

export const AgentLogModel =
  mongoose.models.AgentLog || mongoose.model<AgentLogDocument>("AgentLog", AgentLogSchema);
