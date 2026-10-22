"use client";
import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, RefreshCw } from "lucide-react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormControl,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/date-picker";
import { Notice } from "@/components/shared";
import {
  CATEGORIES,
  CATEGORY_LABELS,
  TYPE_LABELS,
  type FinancialRecord,
  type DailyRecordInput,
} from "@/core/types";
import { api, ApiError } from "@/core/services/api";
import { useDraftFlag, useFarmScope } from "@/core/use-cases/farm-scope";
import { currency } from "@/lib/format";

export const recordSchema = z
  .object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Escolha uma data válida."),
    type: z.enum(["income", "expense"]),
    category: z.enum(CATEGORIES),
    amount: z
      .number()
      .positive("Informe um valor maior que zero.")
      .max(9999999999.99, "Valor acima do limite."),
    milk_liters: z
      .number()
      .positive("Informe um volume maior que zero.")
      .max(999999999, "Volume acima do limite.")
      .nullable(),
    description: z
      .string()
      .max(1000, "A descrição deve ter até 1.000 caracteres."),
  })
  .superRefine((value, ctx) => {
    if (
      (value.type === "income") !==
      ["milk_sale", "other_income"].includes(value.category)
    )
      ctx.addIssue({
        code: "custom",
        path: ["category"],
        message: "A categoria não corresponde ao tipo.",
      });
    if (value.category === "milk_sale" && value.milk_liters === null)
      ctx.addIssue({
        code: "custom",
        path: ["milk_liters"],
        message: "Informe o volume comercializado na venda de leite.",
      });
  });
type Values = z.infer<typeof recordSchema>;
export function RecordForm({
  day,
  record,
  onSaved,
  onCancel,
  onDateChange,
}: {
  day: string;
  record?: FinancialRecord;
  onSaved: () => void;
  onCancel?: () => void;
  onDateChange?: (day: string) => void;
}) {
  const { contextId, navigate } = useFarmScope();
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [currentRecord, setCurrentRecord] = useState(record);
  const [latestRecord, setLatestRecord] = useState<FinancialRecord | null>(
    null,
  );
  const key = useRef({ payload: "", id: "" });
  const form = useForm<Values>({
    resolver: zodResolver(recordSchema),
    defaultValues: record
      ? {
          date: record.date,
          type: record.type,
          category: record.category,
          amount: record.amount,
          description: record.description,
          milk_liters: record.milk_liters,
        }
      : {
          date: day,
          type: "income",
          category: "milk_sale",
          amount: 0,
          description: "",
          milk_liters: null,
        },
  });
  const type = form.watch("type"),
    category = form.watch("category");
  const milk = type === "income" && category === "milk_sale";
  useDraftFlag(`record-${record?.id ?? "new"}`, form.formState.isDirty);
  useEffect(() => {
    if (!record) form.setValue("date", day);
  }, [day, record, form]);
  async function submit(values: Values) {
    setError(null);
    setInfo(null);
    setConflict(false);
    const payload: DailyRecordInput = {
      ...values,
      milk_liters: milk ? values.milk_liters : null,
      scenario_id: contextId === "real" ? null : contextId,
    };
    const serialized = JSON.stringify(payload);
    if (key.current.payload !== serialized)
      key.current = { payload: serialized, id: crypto.randomUUID() };
    try {
      if (currentRecord) await api.update(currentRecord, payload);
      else await api.create(payload, key.current.id);
      key.current = { payload: "", id: "" };
      form.reset({
        ...values,
        amount: record ? values.amount : 0,
        description: record ? values.description : "",
        milk_liters: record ? values.milk_liters : null,
      });
      onSaved();
    } catch (failure) {
      setError(
        failure instanceof Error
          ? failure.message
          : "Não foi possível salvar o lançamento.",
      );
      if (failure instanceof ApiError) {
        setConflict(failure.status === 409);
        for (const item of failure.fields ?? []) {
          if (
            [
              "date",
              "type",
              "category",
              "amount",
              "milk_liters",
              "description",
            ].includes(item.field)
          )
            form.setError(item.field as keyof Values, {
              message: item.message,
            });
        }
      }
    }
  }
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(submit)}
        className="space-y-5"
        aria-label={record ? "Editar lançamento" : "Novo lançamento"}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Data do lançamento</FormLabel>
                <DatePicker
                  value={field.value}
                  onChange={(value) => {
                    field.onChange(value);
                    onDateChange?.(value);
                  }}
                  label="Data do lançamento"
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    form.setValue(
                      "category",
                      value === "income" ? "milk_sale" : "feed",
                      { shouldDirty: true },
                    );
                    form.setValue("milk_liters", null);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(["income", "expense"] as const).map((kind) => (
                      <SelectItem value={kind} key={kind}>
                        {TYPE_LABELS[kind]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    if (value !== "milk_sale")
                      form.setValue("milk_liters", null);
                  }}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {CATEGORIES.filter(
                      (item) =>
                        (type === "income") ===
                        ["milk_sale", "other_income"].includes(item),
                    ).map((item) => (
                      <SelectItem value={item} key={item}>
                        {CATEGORY_LABELS[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max="9999999999.99"
                    {...field}
                    onChange={(event) =>
                      field.onChange(Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {milk && (
            <FormField
              control={form.control}
              name="milk_liters"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel>Volume comercializado (L) · obrigatório</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="0.001"
                      step="0.001"
                      value={field.value ?? ""}
                      placeholder="Ex.: 750,000"
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ""
                            ? null
                            : Number(event.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição · opcional</FormLabel>
              <FormControl>
                <Textarea
                  maxLength={1000}
                  placeholder="Descreva a movimentação da propriedade…"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {error && <Notice error>{error}</Notice>}
        {info && <Notice>{info}</Notice>}
        {conflict && currentRecord && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Suas alterações foram preservadas. Consulte o registro atual e
              revise antes de salvar novamente.
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                try {
                  setLatestRecord(
                    await api.record(currentRecord.id, contextId),
                  );
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Não foi possível atualizar a consulta.",
                  );
                }
              }}
            >
              <RefreshCw size={14} />
              Consultar versão atual
            </Button>
          </div>
        )}
        {latestRecord && (
          <Notice>
            <p>
              Valor salvo na outra janela: {currency(latestRecord.amount)}.
              Descrição: {latestRecord.description || "Sem descrição"}.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setCurrentRecord(latestRecord);
                setLatestRecord(null);
                setConflict(false);
                setError(null);
                setInfo(
                  "Versão atual carregada. Revise os campos preservados e salve quando estiver correto.",
                );
              }}
            >
              Usar esta versão e manter meus campos
            </Button>
          </Notice>
        )}
        <div className="flex flex-wrap gap-3">
          {record && onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(onCancel)}
              disabled={form.formState.isSubmitting}
            >
              Cancelar edição
            </Button>
          )}
          <Button
            type="submit"
            className="flex-1 gap-2"
            disabled={form.formState.isSubmitting}
          >
            <Save size={15} />
            {form.formState.isSubmitting
              ? "Salvando…"
              : record
                ? "Salvar alterações"
                : "Salvar registro no banco de dados"}
          </Button>
        </div>
        <p className="text-center text-[11px] text-muted-foreground">
          {contextId === "real"
            ? "Gravação no histórico real."
            : "Gravação apenas no cenário hipotético selecionado."}
        </p>
      </form>
    </Form>
  );
}
