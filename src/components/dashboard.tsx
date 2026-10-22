"use client";
import { useState } from "react";
import { useFarmScope } from "@/core/use-cases/farm-scope";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Download,
  ArrowDownLeft,
  ArrowUpRight,
  Wallet,
  Milk,
  Landmark,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Notice, Metric, SectionTitle } from "@/components/shared";
import type { MonthClosing } from "@/core/types";
import { api } from "@/core/services/api";
import { currency, number, monthName } from "@/lib/format";
const COLORS = [
  "#79d8a5",
  "#75a9c1",
  "#d7b879",
  "#b395cd",
  "#8aa86a",
  "#cf9382",
  "#738a9f",
  "#bdc794",
];
const tooltip = {
  backgroundColor: "#17231f",
  border: "1px solid #304039",
  borderRadius: 12,
  color: "#e9f0eb",
  fontSize: 12,
};
export function Dashboard({ summary }: { summary: MonthClosing }) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const s = summary;
  const { contextId } = useFarmScope();
  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="03 / VISÃO EXECUTIVA"
        title="Os números que movem sua fazenda."
        description={`Fechamento de ${monthName(s.month)}. Receitas, custos e resultado conectados.`}
      >
        <Button
          variant="outline"
          className="gap-2"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await api.exportMonth(s.month, contextId);
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Falha na exportação.",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <Download size={15} />
          {busy ? "Exportando…" : "Exportar relatório CSV"}
        </Button>
      </SectionTitle>
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="outline">
          Diagnóstico do mês: {s.analysis.status_label}
        </Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            setBusy(true);
            setError(null);
            try {
              await api.exportReport(s.month, contextId);
            } catch (failure) {
              setError(
                failure instanceof Error
                  ? failure.message
                  : "Não foi possível exportar o relatório.",
              );
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy}
        >
          Baixar relatório executivo
        </Button>
      </div>
      {error && <Notice error>{error}</Notice>}
      <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-5">
        <Metric
          label="Faturamento bruto"
          value={currency(s.revenue)}
          icon={ArrowDownLeft}
          hint="Todas as receitas registradas"
        />
        <Metric
          label="Custos variáveis"
          value={currency(s.variable_cost)}
          icon={ArrowUpRight}
          hint="Insumos e operação"
        />
        <Metric
          label="Custos fixos mensais"
          value={currency(s.fixed_cost)}
          icon={Landmark}
          hint="Inclui depreciação"
        />
        <Metric
          label="Resultado gerencial"
          value={currency(s.net_result)}
          featured
          icon={Wallet}
          hint="Faturamento − COT"
        />
        <Metric
          label="Custo total por litro"
          value={
            s.cost_per_liter === null
              ? "Indisponível"
              : `${currency(s.cost_per_liter, 3)}/L`
          }
          icon={Milk}
          hint={`${number(s.milk_liters)} L registrados`}
        />
      </div>
      {(!s.settings_configured || s.requires_review) && (
        <Notice>
          A configuração deste mês está ausente ou exige revisão. Salve os
          valores na barra lateral para completar a análise.
        </Notice>
      )}
      {s.sales_without_volume > 0 && (
        <Notice>
          {s.sales_without_volume} receita(s) de leite sem volume informado.
          Corrija no histórico para habilitar custo e margem por litro.
        </Notice>
      )}
      {s.record_count === 0 && (
        <Notice>
          Não há lançamentos neste mês. O resultado considera somente os custos
          fixos configurados.
        </Notice>
      )}
      <div className="grid gap-5 xl:grid-cols-[1.45fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="text-sm">
                Evolução do resultado gerencial diário
              </CardTitle>
              <p className="mt-2 text-xs text-muted-foreground">
                Resultado do dia após custos variáveis e fixos rateados
              </p>
            </div>
            <TrendingUp size={17} className="text-emerald-400" />
          </CardHeader>
          <CardContent className="pr-5 pl-1">
            <div
              className="h-68"
              role="img"
              aria-label="Gráfico de evolução do resultado gerencial diário"
            >
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={s.days}
                  margin={{ top: 12, right: 12, left: 10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="profit-fill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#79d8a5" stopOpacity={0.2} />
                      <stop offset="100%" stopColor="#79d8a5" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#27362f"
                    strokeDasharray="3 6"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => String(value).slice(-2)}
                    tick={{ fill: "#82978c", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    minTickGap={18}
                  />
                  <YAxis
                    tick={{ fill: "#82978c", fontSize: 10 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${Number(value) / 1000}k`}
                  />
                  <Tooltip
                    contentStyle={tooltip}
                    formatter={(value) => [currency(Number(value)), "Lucro"]}
                    labelFormatter={(value) => `Dia ${String(value).slice(-2)}`}
                  />
                  <Area
                    type="monotone"
                    dataKey="net_result"
                    stroke="#79d8a5"
                    strokeWidth={2}
                    fill="url(#profit-fill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">
              Onde estão os seus custos?
            </CardTitle>
            <p className="mt-2 text-xs text-muted-foreground">
              Distribuição de gastos variáveis e fixos
            </p>
          </CardHeader>
          <CardContent>
            {s.expenses.length ? (
              <>
                <div className="relative h-48">
                  <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                      Custo total
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {currency(s.cot)}
                    </p>
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={s.expenses}
                        dataKey="amount"
                        nameKey="label"
                        innerRadius={66}
                        outerRadius={87}
                        paddingAngle={3}
                        stroke="none"
                      >
                        {s.expenses.map((g, i) => (
                          <Cell
                            key={g.label}
                            fill={COLORS[i % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={tooltip}
                        formatter={(value) => currency(Number(value))}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2">
                  {s.expenses.map((g, i) => (
                    <div
                      key={g.label}
                      className="flex min-w-0 items-center gap-2 text-[10px] text-muted-foreground"
                    >
                      <span
                        className="size-1.5 shrink-0 rounded-full"
                        style={{ background: COLORS[i % COLORS.length] }}
                      />
                      <span className="truncate">{g.label}</span>
                      <span className="ml-auto text-foreground">
                        {number(g.percentage, 1)}%
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="py-18 text-center text-sm text-muted-foreground">
                Sem custos registrados neste mês.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">
              DRE Pecuário · resumo mensal
            </CardTitle>
            <p className="mt-2 text-xs text-muted-foreground">
              COE: desembolsos operacionais · COT: COE + depreciação informada
            </p>
          </div>
          <Badge variant="outline" className="capitalize">
            {monthName(s.month)}
          </Badge>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Indicador financeiro</TableHead>
                <TableHead className="pr-6 text-right">Valor no mês</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {s.statement.map((row, i) => (
                <TableRow
                  key={row.indicator}
                  className={
                    i === s.statement.length - 1
                      ? "bg-emerald-400/5 text-emerald-200"
                      : ""
                  }
                >
                  <TableCell className="py-3 pl-6 text-sm">
                    {row.indicator}
                  </TableCell>
                  <TableCell className="pr-6 text-right font-medium tabular-nums">
                    {currency(row.amount)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 grid gap-4 px-6 sm:grid-cols-3">
            <div className="mini-stat">
              <span>COE</span>
              <strong>{currency(s.coe)}</strong>
            </div>
            <div className="mini-stat">
              <span>COT</span>
              <strong>{currency(s.cot)}</strong>
            </div>
            <div className="mini-stat">
              <span>Margem por litro</span>
              <strong>
                {s.margin_per_liter === null
                  ? "Indisponível"
                  : `${currency(s.margin_per_liter, 3)}/L`}
              </strong>
            </div>
          </div>
        </CardContent>
      </Card>
      <p className="text-[11px] leading-5 text-muted-foreground">
        Visão gerencial por data de lançamento. Custos fixos do mês completo são
        rateados pelos dias corridos, com centavos residuais distribuídos para
        reconciliar a DRE. Dias sem lançamentos têm movimento zero. Todos os
        custos são atribuídos ao leite; mão de obra familiar e custo de
        oportunidade não informados não são estimados.
      </p>
    </div>
  );
}
