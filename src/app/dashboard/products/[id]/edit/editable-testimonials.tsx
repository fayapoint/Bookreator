"use client";

import { useState } from "react";
import { Plus, Trash2, Star, Award } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Testimonial = {
  name: string;
  role?: string;
  company?: string;
  comment: string;
  impact?: string;
  rating?: number;
};

type Props = {
  initialTestimonials?: any[];
};

export function EditableTestimonials({ initialTestimonials = [] }: Props) {
  const [testimonials, setTestimonials] = useState<Testimonial[]>(
    initialTestimonials.map((t) => ({
      name: t.name || "",
      role: t.role || "",
      company: t.company || "",
      comment: t.comment || "",
      impact: t.impact || "",
      rating: t.rating || 5,
    }))
  );

  const addTestimonial = () => {
    setTestimonials([
      ...testimonials,
      { name: "", role: "", company: "", comment: "", impact: "", rating: 5 },
    ]);
  };

  const removeTestimonial = (index: number) => {
    setTestimonials(testimonials.filter((_, i) => i !== index));
  };

  const updateTestimonial = (index: number, field: keyof Testimonial, value: string | number) => {
    const updated = [...testimonials];
    updated[index] = { ...updated[index], [field]: value };
    setTestimonials(updated);
  };

  return (
    <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-50 via-green-50/30 to-background dark:from-emerald-950/20 dark:via-green-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100">
              <Award className="h-5 w-5 text-emerald-600" />
              ⭐ Depoimentos
              <Badge className="bg-emerald-600 text-white">{testimonials.length} depoimentos</Badge>
            </CardTitle>
            <CardDescription className="text-emerald-700 dark:text-emerald-300">
              Provas sociais que aumentam credibilidade
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addTestimonial}
            size="sm"
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/30"
          >
            <Plus className="h-4 w-4" /> Adicionar Depoimento
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {testimonials.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-950/20 p-8 text-center">
            <Star className="mx-auto h-12 w-12 text-emerald-400" />
            <p className="mt-3 font-medium text-emerald-900 dark:text-emerald-100">Nenhum depoimento adicionado</p>
            <p className="mt-1 text-sm text-emerald-600 dark:text-emerald-400">
              Adicione depoimentos para construir prova social
            </p>
            <Button
              type="button"
              onClick={addTestimonial}
              variant="outline"
              size="sm"
              className="mt-4 border-emerald-400 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-600 dark:text-emerald-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Primeiro Depoimento
            </Button>
          </div>
        ) : (
          testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="group rounded-xl border-2 border-emerald-300 dark:border-emerald-700 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/20 p-4 shadow-md transition-all hover:shadow-xl"
            >
              <input type="hidden" name={`testimonials[${index}].name`} value={testimonial.name} />
              <input type="hidden" name={`testimonials[${index}].role`} value={testimonial.role || ""} />
              <input type="hidden" name={`testimonials[${index}].company`} value={testimonial.company || ""} />
              <input type="hidden" name={`testimonials[${index}].comment`} value={testimonial.comment} />
              <input type="hidden" name={`testimonials[${index}].impact`} value={testimonial.impact || ""} />
              <input type="hidden" name={`testimonials[${index}].rating`} value={testimonial.rating || 5} />

              <div className="flex items-start gap-3">
                <Badge className="shrink-0 bg-emerald-600 text-white">#{index + 1}</Badge>

                <div className="flex-1 space-y-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        Nome *
                      </Label>
                      <Input
                        value={testimonial.name}
                        onChange={(e) => updateTestimonial(index, "name", e.target.value)}
                        placeholder="Carlos Eduardo Silva"
                        required
                        className="border-emerald-300 bg-white focus:ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        Cargo
                      </Label>
                      <Input
                        value={testimonial.role || ""}
                        onChange={(e) => updateTestimonial(index, "role", e.target.value)}
                        placeholder="Diretor de Marketing"
                        className="border-emerald-300 bg-white focus:ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/40"
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        Empresa
                      </Label>
                      <Input
                        value={testimonial.company || ""}
                        onChange={(e) => updateTestimonial(index, "company", e.target.value)}
                        placeholder="TechCorp Brasil"
                        className="border-emerald-300 bg-white focus:ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/40"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                        Avaliação
                      </Label>
                      <Select
                        value={String(testimonial.rating || 5)}
                        onValueChange={(value) => updateTestimonial(index, "rating", parseInt(value))}
                      >
                        <SelectTrigger className="border-emerald-300 bg-white dark:border-emerald-600 dark:bg-emerald-950/40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">⭐⭐⭐⭐⭐ (5 estrelas)</SelectItem>
                          <SelectItem value="4">⭐⭐⭐⭐ (4 estrelas)</SelectItem>
                          <SelectItem value="3">⭐⭐⭐ (3 estrelas)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      Depoimento *
                    </Label>
                    <Textarea
                      value={testimonial.comment}
                      onChange={(e) => updateTestimonial(index, "comment", e.target.value)}
                      rows={3}
                      placeholder="Este curso mudou minha carreira..."
                      required
                      className="border-emerald-300 bg-white focus:ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
                      Impacto Mensurável
                    </Label>
                    <Input
                      value={testimonial.impact || ""}
                      onChange={(e) => updateTestimonial(index, "impact", e.target.value)}
                      placeholder="Promovido e salário aumentou 45%"
                      className="border-emerald-300 bg-white focus:ring-emerald-500 dark:border-emerald-600 dark:bg-emerald-950/40"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTestimonial(index)}
                  className="shrink-0 text-red-600 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-700 group-hover:opacity-100 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
