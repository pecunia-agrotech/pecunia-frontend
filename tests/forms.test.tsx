import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { RecordForm, recordSchema } from "@/components/record-form";
import { FixedCosts } from "@/components/fixed-costs";
import { FarmScopeContext, type FarmScope } from "@/core/use-cases/farm-scope";
import { api, ApiError } from "@/core/services/api";
import type { FinancialRecord, MonthClosing } from "@/core/types";
import monthFixture from "./fixtures/month.json";
const savedRecord: FinancialRecord = {
  id: 10,
  date: "2026-10-21",
  type: "income",
  category: "milk_sale",
  amount: 1000,
  description: "Leite original",
  milk_liters: 400,
  version: 1,
  scenario_id: null,
  simulation: false,
  source_category: null,
  requires_volume: false,
};
function wrapper(children: ReactNode, contextId = "real") {
  const scope: FarmScope = {
    contextId,
    month: "2026-10",
    day: "2026-10-21",
    revision: 0,
    setDay: vi.fn(),
    saved: vi.fn(),
    notify: vi.fn(),
    navigate: (action) => action(),
    registerDraft: vi.fn(),
  };
  return (
    <FarmScopeContext.Provider value={scope}>
      {children}
    </FarmScopeContext.Provider>
  );
}
async function fillNewRecord() {
  fireEvent.change(screen.getByLabelText("Valor (R$)"), {
    target: { value: "1000" },
  });
  fireEvent.change(
    screen.getByLabelText("Volume comercializado (L) · obrigatório"),
    { target: { value: "400" } },
  );
}
describe("financial record form", () => {
  it("requires milk volume and exposes the field error accessibly", async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(api, "create").mockResolvedValue(savedRecord);
    render(wrapper(<RecordForm day="2026-10-21" onSaved={vi.fn()} />));
    fireEvent.change(screen.getByLabelText("Valor (R$)"), {
      target: { value: "1000" },
    });
    await user.click(
      screen.getByRole("button", { name: "Salvar registro no banco de dados" }),
    );
    expect(
      await screen.findByText(
        "Informe o volume comercializado na venda de leite.",
      ),
    ).toBeVisible();
    expect(
      screen.getByLabelText("Volume comercializado (L) · obrigatório"),
    ).toHaveAttribute("aria-invalid", "true");
    expect(create).not.toHaveBeenCalled();
  });
  it("shows only expense categories and clears the milk volume", async () => {
    const user = userEvent.setup();
    render(wrapper(<RecordForm day="2026-10-21" onSaved={vi.fn()} />));
    await user.click(screen.getByRole("combobox", { name: "Tipo" }));
    await user.click(screen.getByRole("option", { name: "Despesa" }));
    expect(
      screen.queryByLabelText("Volume comercializado (L) · obrigatório"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "Categoria" }));
    expect(
      screen.queryByRole("option", { name: "Venda de leite" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Insumos/Alimentação" }),
    ).toBeVisible();
  });
  it("creates in the selected scenario and uses an idempotency key", async () => {
    const user = userEvent.setup();
    const create = vi.spyOn(api, "create").mockResolvedValue(savedRecord);
    const onSaved = vi.fn();
    render(
      wrapper(
        <RecordForm day="2026-10-21" onSaved={onSaved} />,
        "scenario-test",
      ),
    );
    await fillNewRecord();
    await user.click(
      screen.getByRole("button", { name: "Salvar registro no banco de dados" }),
    );
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        scenario_id: "scenario-test",
        milk_liters: 400,
      }),
      expect.any(String),
    );
  });
  it("preserves typed values when the server rejects a write", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "create").mockRejectedValue(
      new ApiError("Banco local indisponível.", 503),
    );
    render(wrapper(<RecordForm day="2026-10-21" onSaved={vi.fn()} />));
    await fillNewRecord();
    await user.click(
      screen.getByRole("button", { name: "Salvar registro no banco de dados" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Banco local indisponível.",
    );
    expect(screen.getByLabelText("Valor (R$)")).toHaveValue(1000);
  });
  it("resolves a conflict only after consulting and explicitly accepting a version", async () => {
    const user = userEvent.setup();
    const update = vi
      .spyOn(api, "update")
      .mockRejectedValueOnce(new ApiError("Registro alterado.", 409))
      .mockResolvedValueOnce({ ...savedRecord, version: 3, amount: 1200 });
    vi.spyOn(api, "record").mockResolvedValue({
      ...savedRecord,
      version: 2,
      amount: 1100,
    });
    render(
      wrapper(
        <RecordForm day="2026-10-21" record={savedRecord} onSaved={vi.fn()} />,
      ),
    );
    fireEvent.change(screen.getByLabelText("Valor (R$)"), {
      target: { value: "1200" },
    });
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await user.click(
      await screen.findByRole("button", { name: "Consultar versão atual" }),
    );
    await user.click(
      await screen.findByRole("button", {
        name: "Usar esta versão e manter meus campos",
      }),
    );
    expect(screen.getByLabelText("Valor (R$)")).toHaveValue(1200);
    await user.click(screen.getByRole("button", { name: "Salvar alterações" }));
    await waitFor(() =>
      expect(update).toHaveBeenLastCalledWith(
        expect.objectContaining({ version: 2 }),
        expect.objectContaining({ amount: 1200 }),
      ),
    );
  });
  it("cancels editing without reporting a successful write", async () => {
    const user = userEvent.setup();
    const onSaved = vi.fn(),
      onCancel = vi.fn();
    render(
      wrapper(
        <RecordForm
          day="2026-10-21"
          record={savedRecord}
          onSaved={onSaved}
          onCancel={onCancel}
        />,
      ),
    );
    await user.click(screen.getByRole("button", { name: "Cancelar edição" }));
    expect(onCancel).toHaveBeenCalledOnce();
    expect(onSaved).not.toHaveBeenCalled();
  });
  it("validates categories and zero values in its schema", () => {
    expect(
      recordSchema.safeParse({
        date: "2026-10-21",
        type: "income",
        category: "feed",
        amount: 0,
        description: "",
        milk_liters: null,
      }).success,
    ).toBe(false);
    expect(
      recordSchema.safeParse({
        date: "2026-10-21",
        type: "income",
        category: "other_income",
        amount: 100,
        description: "",
        milk_liters: null,
      }).success,
    ).toBe(true);
  });
});
describe("monthly property configuration", () => {
  it("displays server totals without recalculating draft inputs", async () => {
    const user = userEvent.setup();
    const settings = (monthFixture as MonthClosing).settings;
    render(wrapper(<FixedCosts costs={settings} onSaved={vi.fn()} />));
    fireEvent.change(screen.getByLabelText("Mão de obra total (R$)"), {
      target: { value: "9999" },
    });
    expect(screen.getByText("Alterações ainda não salvas.")).toBeVisible();
    expect(screen.getByText("R$ 5.650,00", { exact: false })).toBeVisible();
    const save = vi
      .spyOn(api, "saveSettings")
      .mockResolvedValue({ ...settings, version: 2 });
    await user.click(
      screen.getByRole("button", { name: "Salvar configuração" }),
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith(
        expect.objectContaining({
          labor: 9999,
          milking_cows: 30,
          reference_feed_price: 1.25,
          version: 1,
        }),
      ),
    );
  });
});
