import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCatalogProductById } from "@/server/services/catalog-products";
import { ProductEditForm } from "./product-edit-form";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProductEditPage({ params }: Props) {
  const { id } = await params;
  
  try {
    const product = await getCatalogProductById(id);
    
    if (!product) {
      notFound();
    }

    return (
      <div className="min-h-screen bg-background">
        <div className="border-b border-border/60 bg-card">
          <div className="container mx-auto flex items-center justify-between px-4 py-4">
            <div className="flex items-center gap-4">
              <Link href="/dashboard">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Editar Produto</h1>
                <p className="text-sm text-muted-foreground">{product.title}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <ProductEditForm product={product} />
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading product:", error);
    redirect("/dashboard");
  }
}
