"use client";

import { useActionState, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CopyPlus, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { type CatalogProduct } from "@/server/models/catalog-product";
import {
  cloneProductToProjectAction,
  createProductSuggestionAction,
  getProductSuggestionsAction,
  type AiSuggestionState,
  type CloneActionState,
  type EnhanceProductState,
  type SuggestionFormState,
  updateCatalogProductAction,
} from "./actions";
import ProductDetailPanel from "./product-detail-panel";
import { ProductSuggestionForm } from "./product-suggestion-form";

const suggestionInitialState: SuggestionFormState = { status: "idle" };
const cloneInitialState: CloneActionState = { status: "idle" };
const enhanceInitialState: EnhanceProductState = { status: "idle" };
const aiInitialState: AiSuggestionState = { status: "idle" };

type Props = {
  products: CatalogProduct[];
};

export function CatalogProductsSection({ products }: Props) {
  const searchParams = useSearchParams();
  const productIdFromUrl = searchParams?.get("productId") ?? null;

  const [selectedProductId, setSelectedProductId] = useState<string | null>(
    productIdFromUrl ?? products[0]?.id ?? null
  );
  const [suggestionState, suggestionAction] = useActionState(createProductSuggestionAction, suggestionInitialState);
  const [cloneState, cloneAction] = useActionState(cloneProductToProjectAction, cloneInitialState);
  const [enhanceState, enhanceAction] = useActionState(updateCatalogProductAction, enhanceInitialState);
  const [aiState, aiAction] = useActionState(getProductSuggestionsAction, aiInitialState);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return products[0];
    return products.find((product) => product.id === selectedProductId) || products[0];
  }, [products, selectedProductId]);

  return (
    <section className="space-y-8 rounded-3xl border border-border/60 bg-card/80 p-8 shadow-lg shadow-primary/10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.4em] text-primary">Catálogo de produtos</p>
          <h3 className="text-3xl font-semibold text-foreground">Cursos prontos para clonar</h3>
          <p className="text-muted-foreground">
            Escolha um produto existente para gerar um projeto ou cadastre novas ideias para abastecer o funil.
          </p>
        </div>
        <Badge variant="outline" className="border-primary/40 text-primary">
          {products.length} produtos disponíveis
        </Badge>
      </div>

      <div className="grid gap-8 xl:grid-cols-[0.5fr_1fr]">
        <ProductListPanel products={products} selectedId={selectedProduct?.id} onSelect={setSelectedProductId} />
        <ProductDetailPanel
          product={selectedProduct}
          cloneAction={cloneAction}
          cloneState={cloneState}
          enhanceAction={enhanceAction}
          enhanceState={enhanceState}
          aiAction={aiAction}
          aiState={aiState}
        />
      </div>

      <ProductSuggestionForm suggestionAction={suggestionAction} suggestionState={suggestionState} />

      <Separator className="opacity-30" />
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 text-primary" />
        Cada produto clonado cria um projeto completo com outline, descrição e objetivos já configurados.
      </div>
    </section>
  );
}

type ProductListProps = {
  products: CatalogProduct[];
  selectedId?: string;
  onSelect: (id: string) => void;
};

function ProductListPanel({ products, selectedId, onSelect }: ProductListProps) {
  return (
    <Card className="border-border/60 bg-background/85">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <CopyPlus className="h-5 w-5 text-primary" /> Catálogo ativo
        </CardTitle>
        <CardDescription>Selecione um produto para explorar</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-8 text-center text-sm text-muted-foreground">
            Nenhum produto cadastrado ainda. Utilize o formulário de sugestões para adicionar propostas.
          </div>
        ) : (
          products.map((product) => {
            const isActive = product.id === selectedId;
            return (
              <button
                type="button"
                key={product.id}
                onClick={() => onSelect(product.id)}
                className={`w-full rounded-2xl border px-4 py-3 text-left transition-all ${
                  isActive ? "border-primary/60 bg-primary/5" : "border-border/60 hover:border-primary/30"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-foreground">
                      {product.copy?.headline || product.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {product.summary || product.copy?.shortDescription || "Produto sem resumo."}
                    </p>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {product.type}
                  </Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span>
                    Atualizado {new Date(product.updatedAt ?? product.createdAt ?? Date.now()).toLocaleDateString("pt-BR")}
                  </span>
                  {product.lastEditedBy && (
                    <Badge className="bg-secondary/30 text-secondary-foreground" variant="outline">
                      Último editor: {product.lastEditedBy}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{product.outline?.length || 0} capítulos</span>
                  <span>Meta {product.targetPages || product.outline?.length * 8 || 0} páginas</span>
                </div>
              </button>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
