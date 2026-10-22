"use client";
import { useState, useRef } from "react";
import {
  FlaskConical,
  Plus,
  RotateCcw,
  Trash2,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Notice, SectionTitle } from "@/components/shared";
import type { FarmContext } from "@/core/types";
import { api } from "@/core/services/api";
import { useDraftFlag, useFarmScope } from "@/core/use-cases/farm-scope";
import { monthName } from "@/lib/format";
export function Scenarios({
  contexts,
  onSelect,
  onChanged,
}: {
  contexts: FarmContext[];
  onSelect: (id: string) => void;
  onChanged: (id?: string) => void;
}) {
  const requestKey = useRef({ payload: "", key: "" });
  const { contextId, month } = useFarmScope();
  const [name, setName] = useState(""),
    [copySource, setCopySource] = useState(true),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<string | null>(null);
  useDraftFlag("scenario-form", name.trim().length > 0);
  const [operationContext, setOperationContext] = useState<FarmContext | null>(
    null,
  );
  const [operationConflict, setOperationConflict] = useState(false);
  const [remove, setRemove] = useState<FarmContext | null>(null),
    [reset, setReset] = useState(false),
    [confirmation, setConfirmation] = useState("");
  const demo = contexts.find((context) => context.demo);
  const current = contexts.find((context) => context.id === contextId);
  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="05 / CENÁRIOS"
        title="Teste decisões sem alterar o histórico."
        description="Cada cenário tem seus próprios lançamentos e configurações. Os resultados nunca são somados aos dados reais."
      />
      <Notice>
        Contexto ativo: <strong>{current?.name}</strong>. A cópia cria dados
        hipotéticos independentes apenas para {monthName(month)}. Não existe
        promoção automática de simulações para o histórico real.
      </Notice>
      {error && <Notice error>{error}</Notice>}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical size={18} />
            Criar cenário hipotético
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              if (busy) return;
              setBusy(true);
              setError(null);
              try {
                const input = {
                  name: name.trim(),
                  month,
                  copy_source: copySource,
                  source_scenario_id: contextId === "real" ? null : contextId,
                };
                const payload = JSON.stringify(input);
                if (requestKey.current.payload !== payload)
                  requestKey.current = { payload, key: crypto.randomUUID() };
                const context = await api.createScenario(
                  input,
                  requestKey.current.key,
                );
                requestKey.current = { payload: "", key: "" };
                setName("");
                onChanged(context.id);
              } catch (failure) {
                setError(
                  failure instanceof Error
                    ? failure.message
                    : "Não foi possível criar o cenário.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="scenario-name">Nome do cenário</Label>
              <Input
                id="scenario-name"
                minLength={3}
                maxLength={80}
                required
                placeholder="Ex.: comparação de custos de alimentação"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1 accent-emerald-300"
                checked={copySource}
                onChange={(event) => setCopySource(event.target.checked)}
              />
              <span>
                Copiar os lançamentos e a configuração do mês selecionado do
                contexto atual. Desmarque para criar um cenário vazio.
              </span>
            </label>
            <Button disabled={busy} className="gap-2">
              <Plus size={16} />
              {busy ? "Criando…" : "Criar cenário"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        {contexts.map((context) => (
          <Card
            key={context.id}
            className={context.id === contextId ? "border-emerald-300/50" : ""}
          >
            <CardContent className="space-y-4 p-5">
              <div className="flex justify-between gap-3">
                <h3 className="font-medium">{context.name}</h3>
                <Badge variant="outline">
                  {context.demo
                    ? "Demonstração"
                    : context.simulation
                      ? "Hipotético"
                      : "Real"}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {context.record_count} registros ·{" "}
                {context.id === contextId
                  ? "contexto ativo"
                  : "contexto independente"}
              </p>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onSelect(context.id)}
                  disabled={context.id === contextId}
                >
                  <ArrowRight size={14} />
                  Usar contexto
                </Button>
                {context.simulation && !context.demo && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-200"
                    onClick={() => {
                      setRemove(context);
                      setOperationContext(context);
                      setOperationConflict(false);
                      setConfirmation("");
                      setError(null);
                    }}
                  >
                    <Trash2 size={14} />
                    Excluir cenário
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <h3 className="font-medium">Ambiente de demonstração</h3>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              Recria 30 dias fictícios somente na demonstração. O histórico real
              e os demais cenários são preservados. Um backup local é criado
              antes da restauração.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setReset(true);
              setOperationContext(demo ?? null);
              setOperationConflict(false);
              setConfirmation("");
              setError(null);
            }}
          >
            <RotateCcw size={14} />
            Restaurar demonstração
          </Button>
        </CardContent>
      </Card>
      <Dialog
        open={!!remove || reset}
        onOpenChange={(open) => {
          if (!open && !busy) {
            setRemove(null);
            setReset(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {reset
                ? "Restaurar somente a demonstração?"
                : `Excluir o cenário “${remove?.name}”?`}
            </DialogTitle>
            <DialogDescription>
              {reset
                ? "Os lançamentos e configurações da demonstração serão substituídos. Os dados reais e outros cenários não serão alterados."
                : "Todos os lançamentos e configurações deste cenário hipotético serão removidos. O histórico real será preservado."}
            </DialogDescription>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Registros abrangidos:{" "}
            {(remove ?? operationContext)?.record_count ?? 0}.
          </p>
          <Label htmlFor="scenario-confirmation">
            Digite{" "}
            {reset ? "RESTAURAR DEMONSTRAÇÃO" : `o nome exato: ${remove?.name}`}
          </Label>
          <Input
            id="scenario-confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            autoComplete="off"
          />
          {error && <Notice error>{error}</Notice>}
          {operationConflict && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  const latest = await api.contexts();
                  const context = latest.find(
                    (item) => item.id === (reset ? "demo" : remove?.id),
                  );
                  if (!context) {
                    setError(
                      "O cenário já não está disponível. Feche esta janela e atualize a página.",
                    );
                    return;
                  }
                  setOperationContext(context);
                  if (remove) setRemove(context);
                  setOperationConflict(false);
                  setConfirmation("");
                  setError(
                    "Dados atualizados. Confira a quantidade de registros e digite a confirmação novamente.",
                  );
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Não foi possível atualizar os dados.",
                  );
                }
              }}
            >
              Atualizar dados antes de confirmar
            </Button>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setRemove(null);
                setReset(false);
              }}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={
                busy ||
                confirmation !==
                  (reset ? "RESTAURAR DEMONSTRAÇÃO" : remove?.name)
              }
              onClick={async () => {
                setBusy(true);
                setError(null);
                try {
                  if (reset && demo) {
                    await api.resetDemo(operationContext ?? demo, confirmation);
                    setReset(false);
                    onChanged();
                  } else if (remove) {
                    await api.deleteScenario(remove, confirmation);
                    const wasActive = remove.id === contextId;
                    setRemove(null);
                    onChanged(wasActive ? "real" : undefined);
                  }
                } catch (failure) {
                  setOperationConflict(true);
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Não foi possível concluir a operação. Atualize os dados.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy
                ? "Processando…"
                : reset
                  ? "Confirmar restauração"
                  : "Excluir cenário"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
