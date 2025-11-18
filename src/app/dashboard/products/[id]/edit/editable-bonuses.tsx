"use client";

import { useState } from "react";
import { Plus, Trash2, Gift } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Bonus = {
  title: string;
  description: string;
  value?: number;
};

type Props = {
  initialBonuses?: any[];
};

export function EditableBonuses({ initialBonuses = [] }: Props) {
  const [bonuses, setBonuses] = useState<Bonus[]>(
    initialBonuses.map((b) => ({
      title: b.title || "",
      description: b.description || "",
      value: b.value || undefined,
    }))
  );

  const addBonus = () => {
    setBonuses([...bonuses, { title: "", description: "", value: undefined }]);
  };

  const removeBonus = (index: number) => {
    setBonuses(bonuses.filter((_, i) => i !== index));
  };

  const updateBonus = (index: number, field: keyof Bonus, value: string | number) => {
    const updated = [...bonuses];
    updated[index] = { ...updated[index], [field]: value };
    setBonuses(updated);
  };

  return (
    <Card className="border-2 border-amber-500/40 bg-gradient-to-br from-amber-50 via-orange-50/30 to-background dark:from-amber-950/20 dark:via-orange-950/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-amber-900 dark:text-amber-100">
              <Gift className="h-5 w-5 text-amber-600" />
              🎁 Bônus Inclusos
              <Badge className="bg-amber-600 text-white">{bonuses.length} bônus</Badge>
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              Presentes valiosos que aumentam a percepção de valor
            </CardDescription>
          </div>
          <Button
            type="button"
            onClick={addBonus}
            size="sm"
            className="gap-2 bg-amber-600 hover:bg-amber-700 text-white shadow-lg shadow-amber-500/30"
          >
            <Plus className="h-4 w-4" /> Adicionar Bônus
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {bonuses.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 p-8 text-center">
            <Gift className="mx-auto h-12 w-12 text-amber-400" />
            <p className="mt-3 font-medium text-amber-900 dark:text-amber-100">Nenhum bônus adicionado</p>
            <p className="mt-1 text-sm text-amber-600 dark:text-amber-400">
              Adicione bônus para aumentar o valor percebido
            </p>
            <Button
              type="button"
              onClick={addBonus}
              variant="outline"
              size="sm"
              className="mt-4 border-amber-400 text-amber-700 hover:bg-amber-100 dark:border-amber-600 dark:text-amber-300"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Primeiro Bônus
            </Button>
          </div>
        ) : (
          bonuses.map((bonus, index) => (
            <div
              key={index}
              className="group rounded-xl border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 p-4 shadow-md transition-all hover:shadow-xl"
            >
              <input type="hidden" name={`bonuses[${index}].title`} value={bonus.title} />
              <input type="hidden" name={`bonuses[${index}].description`} value={bonus.description} />
              <input type="hidden" name={`bonuses[${index}].value`} value={bonus.value || ""} />

              <div className="flex items-start gap-3">
                <Badge className="shrink-0 bg-amber-600 text-white">#{index + 1}</Badge>

                <div className="flex-1 space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Título do Bônus *
                    </Label>
                    <Input
                      value={bonus.title}
                      onChange={(e) => updateBonus(index, "title", e.target.value)}
                      placeholder="Ex: Pack 1000+ Prompts Profissionais"
                      required
                      className="border-amber-300 bg-white focus:ring-amber-500 dark:border-amber-600 dark:bg-amber-950/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Descrição
                    </Label>
                    <Textarea
                      value={bonus.description}
                      onChange={(e) => updateBonus(index, "description", e.target.value)}
                      rows={2}
                      placeholder="Descreva o bônus e seu valor..."
                      className="border-amber-300 bg-white focus:ring-amber-500 dark:border-amber-600 dark:bg-amber-950/40"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                      Valor (R$)
                    </Label>
                    <Input
                      type="number"
                      value={bonus.value || ""}
                      onChange={(e) => updateBonus(index, "value", parseInt(e.target.value) || 0)}
                      placeholder="497"
                      className="border-amber-300 bg-white focus:ring-amber-500 dark:border-amber-600 dark:bg-amber-950/40"
                    />
                  </div>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeBonus(index)}
                  className="shrink-0 text-red-600 opacity-0 transition-opacity hover:bg-red-100 hover:text-red-700 group-hover:opacity-100 dark:hover:bg-red-950"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}

        {bonuses.length > 0 && (
          <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/20 p-4">
            <span className="font-semibold text-amber-900 dark:text-amber-100">
              Valor Total dos Bônus:
            </span>
            <Badge className="text-lg bg-amber-600 text-white px-4 py-1">
              R$ {bonuses.reduce((acc, b) => acc + (b.value || 0), 0).toLocaleString()}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
