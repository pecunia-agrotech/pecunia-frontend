"use client";
import { useState } from "react";
import { useFarmScope } from "@/core/use-cases/farm-scope";
import { CalendarOverview } from "@/components/calendar-overview";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  CalendarRange,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { DatePicker } from "@/components/date-picker";
import { RecordForm } from "@/components/record-form";
import { Metric, Notice, Loading, SectionTitle } from "@/components/shared";
import { api, ApiError } from "@/core/services/api";
import {
  CATEGORY_LABELS,
  TYPE_LABELS,
  type FinancialRecord,
  type MonthClosing,
} from "@/core/types";
import { useResource } from "@/core/use-cases/use-resource";
import { currency, number, shortDate } from "@/lib/format";
export function History({
  summary,
  periodError,
}: {
  summary: MonthClosing | null;
  periodError: string | null;
}) {
  const { day, setDay, contextId, revision, saved, navigate } = useFarmScope();
  const onSaved = saved;
  const [edit, setEdit] = useState<FinancialRecord | null>(null);
  const [remove, setRemove] = useState<FinancialRecord | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deletionConflict, setDeletionConflict] = useState(false);
  const result = useResource(
    `history:${contextId}:${day}`,
    (signal) => api.ledger(day, contextId, signal),
    revision,
  );
  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="02 / HISTÓRICO"
        title="Volte à data. Ajuste o resultado."
        description="Consulte qualquer dia e mantenha os registros da fazenda consistentes."
      >
        <DatePicker
          value={day}
          onChange={setDay}
          label="Data de consulta e edição"
        />
      </SectionTitle>
      {periodError && <Notice error>{periodError}</Notice>}
      {summary && (
        <CalendarOverview
          summary={summary}
          selectedDate={day}
          onSelect={setDay}
        />
      )}
      {result.error && <Notice error>{result.error}</Notice>}
      {result.loading ? (
        <Loading />
      ) : (
        result.data && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Metric
                label="Receitas da data"
                value={currency(result.data.summary.revenue)}
                icon={ArrowDownLeft}
              />
              <Metric
                label="Despesas variáveis"
                value={currency(result.data.summary.variable_cost)}
                icon={ArrowUpRight}
              />
              <Metric
                label="Resultado gerencial do dia"
                value={currency(result.data.summary.net_result)}
                hint={`Rateio fixo: ${currency(result.data.summary.fixed_allocation)}`}
                featured
                icon={Wallet}
              />
            </div>
            <Card>
              <div className="flex items-center justify-between border-b border-border px-5 py-4">
                <h3 className="font-medium">Lançamentos de {shortDate(day)}</h3>
                <Badge variant="outline">
                  {result.data.records.length} registros
                </Badge>
              </div>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-5">Registro</TableHead>
                      <TableHead>Categoria / descrição</TableHead>
                      <TableHead>Litros</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead className="w-16">
                        <span className="sr-only">Ações</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.data.records.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="pl-5">
                          <span className="text-xs text-muted-foreground">
                            #{record.id}
                          </span>
                          <div
                            className={
                              record.type === "income"
                                ? "mt-1 text-xs text-emerald-300"
                                : "mt-1 text-xs text-amber-200"
                            }
                          >
                            {TYPE_LABELS[record.type]}
                          </div>
                        </TableCell>
                        <TableCell>
                          <p className="text-sm">
                            {CATEGORY_LABELS[record.category]}
                            {record.simulation && (
                              <Badge
                                variant="outline"
                                className="ml-2 text-[9px]"
                              >
                                HIPOTÉTICO
                              </Badge>
                            )}
                          </p>
                          <p className="mt-1 max-w-sm truncate text-xs text-muted-foreground">
                            {record.description || "Sem descrição"}
                            {record.requires_volume && (
                              <span className="block text-amber-200">
                                Volume pendente: complete ao editar.
                              </span>
                            )}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs tabular-nums">
                          {record.milk_liters === null
                            ? "—"
                            : number(record.milk_liters)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {currency(record.amount)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                aria-label={`Ações do registro ${record.id}`}
                              >
                                <MoreHorizontal size={17} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={() => setEdit(record)}
                              >
                                <Pencil />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-300"
                                onSelect={() => {
                                  setRemove(record);
                                  setError(null);
                                  setDeletionConflict(false);
                                }}
                              >
                                <Trash2 />
                                Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {result.data.records.length === 0 && (
                  <div className="p-14 text-center">
                    <CalendarRange
                      className="mx-auto mb-4 text-emerald-400/60"
                      size={28}
                    />
                    <p className="text-sm">Nenhuma movimentação nesta data.</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Escolha outro dia ou crie um registro na aba Caixa diário.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )
      )}
      <Dialog
        open={edit !== null}
        onOpenChange={(open) => {
          if (!open) navigate(() => setEdit(null));
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar lançamento #{edit?.id}</DialogTitle>
            <DialogDescription>
              Ao salvar, o caixa, os gráficos e a DRE serão recalculados.
            </DialogDescription>
          </DialogHeader>
          {edit && (
            <RecordForm
              key={`${edit.id}-${edit.version}`}
              record={edit}
              day={day}
              onCancel={() => setEdit(null)}
              onSaved={() => {
                setEdit(null);
                onSaved();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={remove !== null}
        onOpenChange={(open) => {
          if (!busy && !open) setRemove(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir lançamento #{remove?.id}?</DialogTitle>
            <DialogDescription>
              O registro de {remove ? CATEGORY_LABELS[remove.category] : ""} no
              valor de {currency(remove?.amount ?? null)} será removido do banco
              local e dos totais.
            </DialogDescription>
          </DialogHeader>
          {error && <Notice error>{error}</Notice>}
          {deletionConflict && remove && (
            <Button
              variant="outline"
              onClick={async () => {
                try {
                  setRemove(await api.record(remove.id, contextId));
                  setDeletionConflict(false);
                  setError(
                    "Consulta atualizada. Revise o valor e confirme novamente se desejar excluir.",
                  );
                } catch (failure) {
                  setError(
                    failure instanceof Error
                      ? failure.message
                      : "Não foi possível atualizar o registro.",
                  );
                }
              }}
            >
              Consultar versão atual antes de excluir
            </Button>
          )}
          <div className="mt-3 flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setRemove(null)}
              disabled={busy}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                if (!remove) return;
                setBusy(true);
                try {
                  await api.delete(remove);
                  setRemove(null);
                  onSaved();
                } catch (err) {
                  setDeletionConflict(
                    err instanceof ApiError && err.status === 409,
                  );
                  setError(
                    err instanceof Error ? err.message : "Erro ao excluir.",
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Excluindo…" : "Excluir registro"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
