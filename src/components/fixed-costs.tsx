"use client";
import { useEffect, useRef, useState } from "react";
import { Save, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { FarmSettings } from "@/core/types";
import { api, ApiError } from "@/core/services/api";
import { currency, monthName } from "@/lib/format";
import { useDraftFlag, useFarmScope } from "@/core/use-cases/farm-scope";
const fields = [
  { key: "labor", label: "Mão de obra total" },
  { key: "utilities", label: "Energia, combustível e água" },
  { key: "maintenance", label: "Manutenção" },
  { key: "depreciation", label: "Provisão para depreciação" },
] as const;
function draftFor(settings: FarmSettings) {
  return {
    labor: settings.labor,
    utilities: settings.utilities,
    maintenance: settings.maintenance,
    depreciation: settings.depreciation,
    milking_cows:
      settings.milking_cows === null ? "" : String(settings.milking_cows),
    reference_feed_price:
      settings.reference_feed_price === null
        ? ""
        : String(settings.reference_feed_price),
  };
}
export function FixedCosts({
  costs,
  onSaved,
}: {
  costs: FarmSettings;
  onSaved: () => void;
}) {
  const { contextId } = useFarmScope();
  const [values, setValues] = useState(() => draftFor(costs)),
    [version, setVersion] = useState(costs.version);
  const [dirty, setDirty] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null),
    [conflict, setConflict] = useState(false);
  const [info, setInfo] = useState<string | null>(null);
  const synchronizedVersion = useRef(costs.version);
  useDraftFlag("farm-settings", dirty);
  useEffect(() => {
    if (!dirty && synchronizedVersion.current !== costs.version) {
      setValues(draftFor(costs));
      setVersion(costs.version);
      synchronizedVersion.current = costs.version;
    }
  }, [costs, dirty]);
  return (
    <form
      className="space-y-4"
      aria-label="Configuração da propriedade"
      onSubmit={async (event) => {
        event.preventDefault();
        if (busy) return;
        setBusy(true);
        setError(null);
        setInfo(null);
        try {
          await api.saveSettings({
            ...values,
            milking_cows: Number(values.milking_cows),
            reference_feed_price: Number(values.reference_feed_price),
            month: costs.month,
            version,
            scenario_id: contextId === "real" ? null : contextId,
          });
          setDirty(false);
          setConflict(false);
          onSaved();
        } catch (failure) {
          setError(
            failure instanceof Error
              ? failure.message
              : "Não foi possível salvar a configuração.",
          );
          setConflict(failure instanceof ApiError && failure.status === 409);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <SlidersHorizontal size={15} className="text-emerald-300" />
          Propriedade e custos
        </div>
        <p className="mt-2 text-xs capitalize text-muted-foreground">
          {monthName(costs.month)}
        </p>
      </div>
      {fields.map(({ key, label }) => (
        <div className="space-y-2" key={key}>
          <Label
            htmlFor={`setting-${key}`}
            className="text-xs text-muted-foreground"
          >
            {label} (R$)
          </Label>
          <Input
            id={`setting-${key}`}
            type="number"
            min="0"
            max="9999999999.99"
            step="0.01"
            required
            value={values[key]}
            onChange={(event) => {
              setDirty(true);
              setValues({ ...values, [key]: Number(event.target.value) });
            }}
          />
        </div>
      ))}
      <div className="space-y-2">
        <Label htmlFor="milking-cows" className="text-xs text-muted-foreground">
          Vacas em lactação
        </Label>
        <Input
          id="milking-cows"
          type="number"
          min="1"
          max="100000"
          step="1"
          required
          value={values.milking_cows}
          onChange={(event) => {
            setDirty(true);
            setValues({ ...values, milking_cows: event.target.value });
          }}
        />
      </div>
      <div className="space-y-2">
        <Label
          htmlFor="reference-feed-price"
          className="text-xs text-muted-foreground"
        >
          Insumo de referência (R$/kg)
        </Label>
        <Input
          id="reference-feed-price"
          type="number"
          min="0.001"
          max="9999999"
          step="0.001"
          required
          value={values.reference_feed_price}
          onChange={(event) => {
            setDirty(true);
            setValues({ ...values, reference_feed_price: event.target.value });
          }}
        />
      </div>
      <div className="rounded-xl border border-border bg-background/30 p-4">
        <p className="text-xs text-muted-foreground">Total mensal salvo</p>
        <p className="mt-1 text-xl font-semibold">
          {currency(costs.total_fixed_cost)}
        </p>
        <p className="mt-2 text-[11px] text-emerald-200">
          Referência diária ÷ 30: {currency(costs.reference_daily_allocation)}
        </p>
        {dirty && (
          <p className="mt-2 text-[11px] text-amber-200">
            Alterações ainda não salvas.
          </p>
        )}
      </div>
      {info && (
        <p role="status" className="text-xs leading-5 text-emerald-200">
          {info}
        </p>
      )}
      {error && (
        <p role="alert" className="text-xs leading-5 text-red-200">
          {error}
        </p>
      )}
      {conflict && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={async () => {
            try {
              const latest = await api.settings(costs.month, contextId);
              setVersion(latest.version);
              setConflict(false);
              setError(null);
              setInfo(
                `Configuração atual consultada: total salvo ${currency(latest.total_fixed_cost)}; ${latest.milking_cows ?? "nenhuma"} vacas configuradas. Seus campos foram mantidos; revise antes de salvar.`,
              );
            } catch (failure) {
              setError(
                failure instanceof Error
                  ? failure.message
                  : "Não foi possível consultar a configuração.",
              );
            }
          }}
        >
          Atualizar versão mantendo meus campos
        </Button>
      )}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        disabled={busy}
      >
        <Save size={14} />
        {busy ? "Salvando…" : "Salvar configuração"}
      </Button>
      {(!costs.configured || costs.requires_review) && (
        <p className="text-xs leading-5 text-amber-200">
          {costs.requires_review
            ? "Configuração migrada: revise custos, vacas e preço do insumo antes de analisar."
            : "Configure este mês para completar os indicadores."}
        </p>
      )}
      <p className="text-[10px] leading-5 text-muted-foreground">
        Configuração independente por mês e contexto. O resultado utiliza os
        dias reais do mês. Não duplique despesas já lançadas.
      </p>
    </form>
  );
}
