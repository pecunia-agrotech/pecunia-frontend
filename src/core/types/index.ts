import type { components } from "./api.generated";
type Schemas = components["schemas"];
export type FinancialRecord = Schemas["FinancialRecordDTO"];
export type DailyRecordInput = Schemas["DailyRecordInputDTO"];
export type RecordUpdate = Schemas["FinancialRecordUpdateDTO"];
export type FarmSettings = Schemas["FarmSettingsDTO"];
export type FarmSettingsInput = Schemas["FarmSettingsInputDTO"];
export type DailyLedger = Schemas["DailyLedgerDTO"];
export type DailySummary = Schemas["DailySummaryDTO"];
export type DayMovement = Schemas["DayMovementDTO"];
export type MonthClosing = Schemas["MonthClosingDTO"];
export type FarmAnalysis = Schemas["AnalysisResponseDTO"];
export type RuleTrace = Schemas["RuleTraceDTO"];
export type FarmContext = Schemas["ContextDTO"];
export type Bootstrap = Schemas["BootstrapDTO"];
export type ScenarioInput = Schemas["ScenarioInputDTO"];
export type ApiErrorPayload = Schemas["ErrorResponseDTO"];
export type Category = FinancialRecord["category"];
export type RecordType = FinancialRecord["type"];
export type Status = FarmAnalysis["status"];
export const CATEGORIES = [
  "milk_sale",
  "other_income",
  "feed",
  "veterinary",
  "fuel",
  "other_expense",
] as const satisfies readonly Category[];
export const CATEGORY_LABELS: Record<Category, string> = {
  milk_sale: "Venda de leite",
  other_income: "Outras receitas",
  feed: "Insumos/Alimentação",
  veterinary: "Sanidade/Veterinária",
  fuel: "Combustível",
  other_expense: "Outros",
};
export const TYPE_LABELS: Record<RecordType, string> = {
  income: "Receita",
  expense: "Despesa",
};
export const STATUS_LABELS: Record<Status, string> = {
  healthy: "Saudável",
  attention: "Atenção",
  critical: "Crítico",
};
