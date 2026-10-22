import type {
  ApiErrorPayload,
  Bootstrap,
  DailyRecordInput,
  DailySummary,
  DailyLedger,
  FarmAnalysis,
  FarmContext,
  FarmSettings,
  FarmSettingsInput,
  FinancialRecord,
  MonthClosing,
  ScenarioInput,
} from "@/core/types";
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fields: ApiErrorPayload["field_errors"] = [],
  ) {
    super(message);
    this.name = "ApiError";
  }
}
function query(values: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values))
    if (value !== null && value !== undefined && value !== "real")
      params.set(key, value);
  return params.toString();
}
async function response(
  path: string,
  options: RequestInit = {},
): Promise<Response> {
  let result: Response;
  try {
    result = await fetch(`${API_URL}/api/v1${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
      },
      cache: "no-store",
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") throw error;
    throw new ApiError(
      "Não foi possível conectar ao servidor local. Inicie o aplicativo e tente novamente.",
      0,
    );
  }
  if (!result.ok) {
    const payload: unknown = await result.json().catch(() => null);
    if (
      payload &&
      typeof payload === "object" &&
      "message" in payload &&
      typeof payload.message === "string"
    ) {
      const fields: ApiErrorPayload["field_errors"] =
        "field_errors" in payload && Array.isArray(payload.field_errors)
          ? payload.field_errors
          : [];
      throw new ApiError(
        [
          payload.message,
          ...(fields ?? [])
            .filter((item) => !item.field)
            .map((item) => item.message),
        ].join(" "),
        result.status,
        fields,
      );
    }
    throw new ApiError(
      "Não foi possível concluir esta operação. Atualize os dados e tente novamente.",
      result.status,
    );
  }
  return result;
}
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const result = await response(path, options);
  return result.status === 204
    ? (undefined as T)
    : (result.json() as Promise<T>);
}
async function download(path: string, name: string): Promise<void> {
  const result = await response(path);
  const url = URL.createObjectURL(await result.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export const api = {
  bootstrap: (signal?: AbortSignal) =>
    request<Bootstrap>("/bootstrap", { signal }),
  contexts: (signal?: AbortSignal) =>
    request<FarmContext[]>("/contexts", { signal }),
  records: (
    filters: { date?: string; month?: string; scenario_id?: string | null },
    signal?: AbortSignal,
  ) => request<FinancialRecord[]>(`/records?${query(filters)}`, { signal }),
  record: (id: number, contextId: string) =>
    request<FinancialRecord>(
      `/records/${id}?${query({ scenario_id: contextId })}`,
    ),
  create: (input: DailyRecordInput, requestKey: string) =>
    request<FinancialRecord>("/records", {
      method: "POST",
      headers: { "Idempotency-Key": requestKey },
      body: JSON.stringify(input),
    }),
  update: (record: FinancialRecord, input: DailyRecordInput) =>
    request<FinancialRecord>(`/records/${record.id}`, {
      method: "PUT",
      body: JSON.stringify({ ...input, version: record.version }),
    }),
  delete: (record: FinancialRecord) =>
    request<void>(
      `/records/${record.id}?${query({ version: String(record.version), scenario_id: record.scenario_id })}`,
      { method: "DELETE" },
    ),
  ledger: (date: string, contextId: string, signal?: AbortSignal) =>
    request<DailyLedger>(
      `/daily-ledger?${query({ date, scenario_id: contextId })}`,
      { signal },
    ),
  day: (date: string, contextId: string, signal?: AbortSignal) =>
    request<DailySummary>(
      `/daily-summary?${query({ date, scenario_id: contextId })}`,
      { signal },
    ),
  month: (month: string, contextId: string, signal?: AbortSignal) =>
    request<MonthClosing>(
      `/month-closing?${query({ month, scenario_id: contextId })}`,
      { signal },
    ),
  settings: (month: string, contextId: string) =>
    request<FarmSettings>(
      `/farm-settings?${query({ month, scenario_id: contextId })}`,
    ),
  saveSettings: (input: FarmSettingsInput) =>
    request<FarmSettings>("/farm-settings", {
      method: "PUT",
      body: JSON.stringify(input),
    }),
  analyze: (date: string, contextId: string, signal?: AbortSignal) =>
    request<FarmAnalysis>("/analysis/daily", {
      method: "POST",
      body: JSON.stringify({
        date,
        scenario_id: contextId === "real" ? null : contextId,
      }),
      signal,
    }),
  createScenario: (input: ScenarioInput, requestKey: string) =>
    request<FarmContext>("/scenarios", {
      method: "POST",
      headers: { "Idempotency-Key": requestKey },
      body: JSON.stringify(input),
    }),
  deleteScenario: (context: FarmContext, confirmation: string) =>
    request<void>(`/scenarios/${context.id}`, {
      method: "DELETE",
      body: JSON.stringify({ version: context.version, confirmation }),
    }),
  resetDemo: (context: FarmContext, confirmation: string) =>
    request<FarmContext>("/demo/reset", {
      method: "POST",
      body: JSON.stringify({ version: context.version, confirmation }),
    }),
  exportMonth: (month: string, contextId: string) =>
    download(
      `/export-month?${query({ month, scenario_id: contextId })}`,
      `pecunia_${month}_${contextId}.csv`,
    ),
  exportReport: (month: string, contextId: string) =>
    download(
      `/reports/month?${query({ month, scenario_id: contextId })}`,
      `relatorio_${month}_${contextId}.md`,
    ),
};
