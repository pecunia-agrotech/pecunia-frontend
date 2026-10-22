"use client";
import type { MonthClosing } from "@/core/types";
import { currency, monthName, shortDate } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
export function CalendarOverview({
  summary,
  selectedDate,
  onSelect,
}: {
  summary: MonthClosing;
  selectedDate: string;
  onSelect: (day: string) => void;
}) {
  const weekday = (new Date(`${summary.month}-01T12:00:00`).getDay() + 6) % 7;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base capitalize">
          Calendário financeiro · {monthName(summary.month)}
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Selecione um dia para consultar ou editar os movimentos. Valores do
          contexto atual.
        </p>
      </CardHeader>
      <CardContent>
        <div
          className="grid grid-cols-7 gap-1 md:gap-2"
          role="group"
          aria-label="Calendário financeiro mensal"
        >
          {["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"].map((label) => (
            <span
              className="pb-2 text-center text-[10px] text-muted-foreground"
              key={label}
            >
              {label}
            </span>
          ))}
          {Array.from({ length: weekday }, (_, index) => (
            <span aria-hidden key={`blank-${index}`} />
          ))}
          {summary.days.map((day) => (
            <button
              type="button"
              key={day.date}
              aria-pressed={selectedDate === day.date}
              aria-label={`${shortDate(day.date)}: ${day.record_count} lançamentos, receitas ${currency(day.revenue)}, despesas ${currency(day.expense)}, resultado ${currency(day.net_result)}`}
              className={cn(
                "min-w-0 rounded-lg border border-border p-2 text-left transition-colors hover:border-emerald-300/60 focus-visible:outline-2 focus-visible:outline-emerald-300",
                selectedDate === day.date
                  ? "border-emerald-300 bg-emerald-300/10"
                  : "bg-background/20",
              )}
              onClick={() => onSelect(day.date)}
            >
              <span className="flex items-center justify-between gap-1 text-xs">
                <strong>{day.date.slice(-2)}</strong>
                {day.record_count > 0 && (
                  <span
                    className="size-1.5 rounded-full bg-emerald-300"
                    aria-hidden
                  />
                )}
              </span>
              <span className="mt-1 block text-[8px] text-muted-foreground md:hidden">
                {day.record_count} mov.
              </span>
              <span className="mt-2 hidden text-[9px] leading-4 md:block">
                <span className="block truncate text-emerald-200">
                  + {currency(day.revenue)}
                </span>
                <span className="block truncate text-amber-100">
                  − {currency(day.expense)}
                </span>
                <span className="block truncate text-muted-foreground">
                  {day.record_count} movimentos
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Resultado acumulado até a data selecionada:{" "}
          <strong className="text-foreground">
            {currency(
              summary.days.find((day) => day.date === selectedDate)
                ?.accumulated_result ?? null,
            )}
          </strong>
          . Dias sem movimentos preservam o rateio fixo configurado.
        </p>
      </CardContent>
    </Card>
  );
}
