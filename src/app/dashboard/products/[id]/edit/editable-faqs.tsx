"use client";

import { useState } from "react";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type FAQ = {
  question: string;
  answer: string;
};

type Props = {
  initialFaqs?: any[];
};

export function EditableFAQs({ initialFaqs = [] }: Props) {
  const [faqs, setFaqs] = useState<FAQ[]>(
    initialFaqs.map((f) => ({
      question: f.question || "",
      answer: f.answer || "",
    }))
  );

  const addFAQ = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const removeFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFAQ = (index: number, field: keyof FAQ, value: string) => {
    const updated = [...faqs];
    updated[index] = { ...updated[index], [field]: value };
    setFaqs(updated);
  };

  return (
    <Card className="border-2 border-violet-500/40 bg-gradient-to-br from-violet-50 via-purple-50/30 to-background dark:from-violet-950/20 dark:via-purple-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-violet-900 dark:text-violet-100">
              <HelpCircle className="h-5 w-5 text-violet-600" />
              ❓ Perguntas Frequentes
              <Badge className="bg-violet-600 text-white">{faqs.length} perguntas</Badge>
            </CardTitle>
            <CardDescription className="text-violet-700 dark:text-violet-300">
              Antecipe e responda objeções comuns
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addFAQ}
            size="sm"
            className="gap-2 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/30"
          >
            <Plus className="h-4 w-4" /> Adicionar FAQ
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {faqs.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-violet-300 dark:border-violet-700 bg-violet-50/50 dark:bg-violet-950/20 p-8 text-center">
            <HelpCircle className="mx-auto h-12 w-12 text-violet-400" />
            <p className="mt-3 font-medium text-violet-900 dark:text-violet-100">Nenhuma pergunta adicionada</p>
            <p className="mt-1 text-sm text-violet-600 dark:text-violet-400">
              Adicione FAQs para responder objeções
            </p>
            <Button
              type="button"
              onClick={addFAQ}
              variant="outline"
              size="sm"
              className="mt-4 border-violet-400 text-violet-700 hover:bg-violet-100 dark:border-violet-600 dark:text-violet-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Primeira Pergunta
            </Button>
          </div>
        ) : (
          faqs.map((faq, index) => (
            <div
              key={index}
              className="group rounded-xl border-2 border-violet-300 dark:border-violet-700 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/20 p-4 shadow-md transition-all hover:shadow-xl"
            >
              <input type="hidden" name={`faqs[${index}].question`} value={faq.question} />
              <input type="hidden" name={`faqs[${index}].answer`} value={faq.answer} />

              <div className="flex items-start gap-3">
                <Badge className="shrink-0 bg-violet-600 text-white">#{index + 1}</Badge>

                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                      Pergunta *
                    </Label>
                    <Input
                      value={faq.question}
                      onChange={(e) => updateFAQ(index, "question", e.target.value)}
                      placeholder="Preciso saber programar?"
                      required
                      className="border-violet-300 bg-white focus:ring-violet-500 dark:border-violet-600 dark:bg-violet-950/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                      Resposta *
                    </Label>
                    <Textarea
                      value={faq.answer}
                      onChange={(e) => updateFAQ(index, "answer", e.target.value)}
                      rows={3}
                      placeholder="Não! O curso é para todos os níveis..."
                      required
                      className="border-violet-300 bg-white focus:ring-violet-500 dark:border-violet-600 dark:bg-violet-950/40"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFAQ(index)}
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
