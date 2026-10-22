"use client";
import Markdown from "react-markdown";
import {
  BrainCircuit,
  Download,
  CheckCircle2,
  Circle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DatePicker } from "@/components/date-picker";
import { Metric, Notice, Loading, SectionTitle } from "@/components/shared";
import { api } from "@/core/services/api";
import { useResource } from "@/core/use-cases/use-resource";
import { useFarmScope } from "@/core/use-cases/farm-scope";
import { currency, number, downloadText } from "@/lib/format";
export function Diagnosis() {
  const { day, setDay, contextId, revision } = useFarmScope();
  const result = useResource(
    `analysis:${contextId}:${day}`,
    (signal) => api.analyze(day, contextId, signal),
    revision,
  );
  const analysis = result.data;
  const statusClass =
    analysis?.status === "critical"
      ? "status-critical"
      : analysis?.status === "attention"
        ? "status-warning"
        : "status-healthy";
  return (
    <div className="space-y-7">
      <SectionTitle
        eyebrow="04 / SISTEMA ESPECIALISTA"
        title="Do número à explicação."
        description="Regras determinísticas, evidências verificáveis e indicadores calculados pelo servidor."
      >
        <DatePicker value={day} onChange={setDay} label="Data da análise" />
      </SectionTitle>
      <Notice>
        Vacas em lactação e preço do insumo vêm da configuração persistida do
        mês da data selecionada. Os lançamentos e o contexto definem os demais
        fatos.
      </Notice>
      {result.error && <Notice error>{result.error}</Notice>}
      {result.loading ? (
        <Loading />
      ) : (
        analysis && (
          <>
            <div
              className={`flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-6 ${statusClass}`}
            >
              <div className="flex items-center gap-4">
                <BrainCircuit size={28} />
                <div>
                  <p className="text-xs opacity-75">STATUS DO DIAGNÓSTICO</p>
                  <h3 className="mt-1 text-2xl font-semibold">
                    {analysis.status_label}
                  </h3>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm">
                  {analysis.trace.filter((item) => item.activated).length} de{" "}
                  {analysis.trace.length} regras ativadas
                </p>
                <p className="mt-1 text-xs opacity-70">
                  {analysis.context_name} · {analysis.period_label}
                </p>
              </div>
            </div>
            {analysis.facts.missing_data.length > 0 && (
              <Notice>
                <strong>Dados insuficientes para parte da análise:</strong>
                <ul className="mt-2 list-disc pl-4">
                  {analysis.facts.missing_data.map((message) => (
                    <li key={message}>{message}</li>
                  ))}
                </ul>
              </Notice>
            )}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Metric
                label="IOFC do lote no dia"
                value={currency(analysis.indicators.iofc)}
                hint="Receita do leite − alimentação"
                featured
              />
              <Metric
                label="IOFC por vaca no dia"
                value={currency(analysis.indicators.iofc_per_cow)}
                hint={
                  analysis.facts.milking_cows
                    ? `${analysis.facts.milking_cows} vacas configuradas`
                    : "Rebanho não configurado"
                }
              />
              <Metric
                label="Alimentação / receita do leite"
                value={
                  analysis.indicators.feed_cost_share === null
                    ? "Indisponível"
                    : `${number(analysis.indicators.feed_cost_share, 2)}%`
                }
              />
              <Metric
                label="Ponto de equilíbrio estático"
                value={
                  analysis.indicators.break_even_liters === null
                    ? "Indisponível"
                    : `${number(analysis.indicators.break_even_liters)} L`
                }
                hint="Definição operacional provisória"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="mini-stat">
                <span>Preço médio do leite</span>
                <strong>{currency(analysis.indicators.milk_price, 3)}</strong>
              </div>
              <div className="mini-stat">
                <span>Relação de troca · kg de insumo/L</span>
                <strong>{number(analysis.indicators.exchange_ratio)}</strong>
              </div>
              <div className="mini-stat">
                <span>Volume registrado · L/vaca</span>
                <strong>{number(analysis.indicators.liters_per_cow)}</strong>
              </div>
            </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Traço de inferência · COMO?
                </CardTitle>
                <p className="text-xs leading-5 text-muted-foreground">
                  Todas as regras são avaliadas. O maior nível de severidade
                  define o status. CF é peso heurístico, não probabilidade.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.trace.map((trace) => (
                  <details
                    key={trace.id}
                    className={`rule-row ${trace.activated ? "rule-active" : ""}`}
                  >
                    <summary className="flex cursor-pointer list-none items-center gap-3 p-4">
                      {trace.activated ? (
                        <CheckCircle2
                          size={17}
                          className="shrink-0 text-emerald-300"
                        />
                      ) : (
                        <Circle
                          size={17}
                          className="shrink-0 text-muted-foreground"
                        />
                      )}
                      <span className="text-xs text-muted-foreground">
                        {trace.id}
                      </span>
                      <span className="flex-1 text-sm">{trace.conclusion}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {trace.activated ? "Ativada" : "Não ativada"} · CF{" "}
                        {number(trace.cf, 2)}
                      </Badge>
                    </summary>
                    <div className="space-y-3 border-t border-border px-5 py-4 text-sm leading-6">
                      <p>
                        <strong>Condição:</strong> {trace.condition}
                      </p>
                      <ul className="list-disc pl-4">
                        {trace.evidence.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                      <p>
                        <strong>Por quê:</strong> {trace.rationale}
                      </p>
                      <p className="text-emerald-200">
                        <strong>Ação sugerida:</strong> {trace.recommendation}
                      </p>
                    </div>
                  </details>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldCheck size={18} className="text-emerald-300" />
                  Relatório executivo · POR QUÊ?
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    downloadText(
                      analysis.report_markdown,
                      `diagnostico_${analysis.date}_${contextId}.md`,
                    )
                  }
                >
                  <Download size={14} />
                  Baixar relatório
                </Button>
              </CardHeader>
              <CardContent>
                <article className="report">
                  <Markdown skipHtml>{analysis.report_markdown}</Markdown>
                </article>
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
}
