import mongoose, { Schema, InferSchemaType, Model } from "mongoose";
import { connectToProductsDatabase } from "../products-db";

const OutlineSchema = new Schema(
  {
    order: { type: Number, default: 1 },
    title: { type: String, required: true },
    description: { type: String },
    estimatedWords: { type: Number },
    estimatedDuration: { type: Number },
  },
  { _id: false }
);

const CatalogProductSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true },
    summary: { type: String },
    description: { type: String },
    type: { type: String, enum: ["book", "course", "article"], default: "course" },
    audience: { type: String },
    level: { type: String },
    format: { type: String },
    price: { type: Number },
    targetPages: { type: Number, default: 80 },
    status: { type: String, enum: ["idea", "draft", "published"], default: "idea" },
    tags: { type: [String], default: [] },
    heroImage: { type: String },
    images: { type: [String], default: [] },
    copy: { type: Schema.Types.Mixed, default: {} },
    bonuses: { type: [Schema.Types.Mixed], default: [] },
    curriculum: { type: Schema.Types.Mixed, default: {} },
    detailedCurriculum: { type: Schema.Types.Mixed, default: {} },
    cta: { type: Schema.Types.Mixed, default: {} },
    pricing: { type: Schema.Types.Mixed, default: {} },
    metrics: { type: Schema.Types.Mixed, default: {} },
    guarantees: { type: [Schema.Types.Mixed], default: [] },
    testimonials: { type: [Schema.Types.Mixed], default: [] },
    faqs: { type: [Schema.Types.Mixed], default: [] },
    digitalAssets: { type: [Schema.Types.Mixed], default: [] },
    seo: { type: Schema.Types.Mixed, default: {} },
    impactCompanies: { type: [String], default: [] },
    impactEntrepreneurs: { type: [String], default: [] },
    impactIndividuals: { type: [String], default: [] },
    targetAudience: { type: [String], default: [] },
    categoryPrimary: { type: String },
    categorySecondary: { type: String },
    outline: { type: [OutlineSchema], default: [] },
    metadata: { type: Schema.Types.Mixed, default: {} },
    lastEditedBy: { type: String },
  },
  { timestamps: true, collection: "products" }
);

export type CatalogProductDocument = InferSchemaType<typeof CatalogProductSchema> & {
  _id: mongoose.Types.ObjectId;
};

export type CatalogProduct = Omit<CatalogProductDocument, "_id"> & {
  id: string;
};

let catalogProductModel: Model<CatalogProductDocument> | null = null;

export async function getCatalogProductModel() {
  if (catalogProductModel) {
    return catalogProductModel;
  }

  const db = await connectToProductsDatabase();
  catalogProductModel =
    db.models.CatalogProduct || db.model<CatalogProductDocument>("CatalogProduct", CatalogProductSchema);

  return catalogProductModel;
}
