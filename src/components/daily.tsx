"use client";
import { useFarmScope } from "@/core/use-cases/farm-scope";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Scale,
  Wallet,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RecordForm } from "@/components/record-form";
import { DatePicker } from "@/components/date-picker";
import { Metric, Notice, Loading, SectionTitle } from "@/components/shared";
import { api } from "@/core/services/api";
import { useResource } from "@/core/use-cases/use-resource";
import { currency, shortDate } from "@/lib/format";
export function Daily() {
  const { day, setDay, contextId, revision, saved } = useFarmScope();
  const onSaved = saved;
  const summary = useResource(
    `day:${contextId}:${day}`,
    (signal) => api.day(day, contextId, signal),
    revision,
  );
  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="01 / CAIXA DIÁRIO"
        title="Sua rotina financeira, organizada."
        description="Registre as movimentações e acompanhe o resultado da data escolhida."
      >
        <DatePicker value={day} onChange={setDay} label="Data do caixa" />
      </SectionTitle>
      {summary.error && <Notice error>{summary.error}</Notice>}
      {summary.loading ? (
        <Loading />
      ) : (
        summary.data && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="Receita do dia"
                value={currency(summary.data.revenue)}
                icon={ArrowDownLeft}
              />
              <Metric
                label="Despesas variáveis lançadas"
                value={currency(summary.data.variable_cost)}
                icon={ArrowUpRight}
              />
              <Metric
                label="Rateio do custo fixo diário"
                value={currency(summary.data.fixed_allocation)}
                hint={`${summary.data.days_in_month} dias no mês`}
                icon={Scale}
              />
              <Metric
                label="Resultado gerencial do dia"
                value={currency(summary.data.net_result)}
                featured
                icon={Wallet}
              />
            </div>
            {(!summary.data.settings_configured ||
              summary.data.requires_review) && (
              <Notice>
                A configuração do mês desta data está ausente ou exige revisão.
                Selecione o mês no topo e salve os custos na lateral.
              </Notice>
            )}
          </>
        )
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1.35fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardList size={18} className="text-emerald-400" />
              Novo lançamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RecordForm day={day} onDateChange={setDay} onSaved={onSaved} />
          </CardContent>
        </Card>
        <div className="space-y-5">
          <Card className="guide-card">
            <CardContent className="p-7">
              <div className="mb-6 flex size-11 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-300/5">
                <ShieldCheck className="text-emerald-300" size={22} />
              </div>
              <p className="eyebrow">UM BOM RESULTADO COMEÇA NO REGISTRO</p>
              <h3 className="mt-3 text-xl font-semibold leading-snug">
                Mais clareza hoje.
                <br />
                Melhores decisões amanhã.
              </h3>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Lance a venda de leite com seu volume, classifique os gastos e
                mantenha os custos fixos atualizados. O sistema conecta cada
                movimentação ao seu resultado.
              </p>
              <div className="mt-7 space-y-3 border-t border-white/10 pt-5 text-xs text-muted-foreground">
                <p>01. Receita de leite e litros vendidos</p>
                <p>02. Custos variáveis por categoria</p>
                <p>03. Fixos e depreciação do mês</p>
              </div>
            </CardContent>
          </Card>
          <p className="px-2 text-xs leading-5 text-muted-foreground">
            Caixa selecionado: {shortDate(day)}. O resultado exibido é gerencial
            e inclui depreciação, que não representa saída de dinheiro.
          </p>
        </div>
      </div>
    </div>
  );
}
