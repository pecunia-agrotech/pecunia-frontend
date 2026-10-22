import type { LucideIcon } from "lucide-react";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
export function Metric({
  label,
  value,
  hint,
  icon: Icon,
  featured = false,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: LucideIcon;
  featured?: boolean;
}) {
  return (
    <Card className={cn("metric-card", featured && "metric-featured")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-muted-foreground">
            {label}
          </p>
          {Icon && <Icon className="shrink-0 text-emerald-400/70" size={17} />}
        </div>
        <p className="mt-4 text-[1.65rem] font-semibold tracking-tight tabular-nums xl:text-[1.85rem]">
          {value}
        </p>
        {hint && (
          <p className="mt-2 text-[11px] leading-4 text-muted-foreground">
            {hint}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
export function Notice({
  children,
  error = false,
}: {
  children: React.ReactNode;
  error?: boolean;
}) {
  return (
    <div
      role={error ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed",
        error
          ? "border-red-400/25 bg-red-400/5 text-red-200"
          : "border-emerald-400/15 bg-emerald-400/5 text-emerald-100/85",
      )}
    >
      <AlertCircle className="mt-0.5 shrink-0" size={16} />
      <div>{children}</div>
    </div>
  );
}
export function Loading() {
  return (
    <div
      role="status"
      className="flex items-center justify-center gap-3 p-16 text-sm text-muted-foreground"
    >
      <LoaderCircle size={20} className="animate-spin" />
      Consultando os dados locais…
    </div>
  );
}
export function SectionTitle({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
