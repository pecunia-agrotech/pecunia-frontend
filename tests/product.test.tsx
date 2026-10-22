import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { CalendarOverview } from "@/components/calendar-overview";
import { Dashboard } from "@/components/dashboard";
import { Diagnosis } from "@/components/diagnosis";
import { PecuniaApp } from "@/components/pecunia-app";
import { Scenarios } from "@/components/scenarios";
import { FarmScopeContext, type FarmScope } from "@/core/use-cases/farm-scope";
import { api } from "@/core/services/api";
import type { Bootstrap, FarmAnalysis, MonthClosing } from "@/core/types";
import monthData from "./fixtures/month.json";
import emptyData from "./fixtures/empty-month.json";
import bootstrapData from "./fixtures/bootstrap.json";
import analysisData from "./fixtures/analysis.json";
const month = monthData as MonthClosing,
  empty = emptyData as MonthClosing,
  bootstrap = bootstrapData as Bootstrap,
  analysis = analysisData as FarmAnalysis;
function wrapper(children: ReactNode) {
  const scope: FarmScope = {
    contextId: "demo",
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
describe("calendar, reports and diagnoses", () => {
  it("renders the full month and announces daily values", async () => {
    const select = vi.fn();
    const user = userEvent.setup();
    render(
      <CalendarOverview
        summary={month}
        selectedDate="2026-10-21"
        onSelect={select}
      />,
    );
    const button = screen.getByRole("button", { name: /21\/10\/2026:/ });
    expect(button).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: /15\/10\/2026:/ }));
    expect(select).toHaveBeenCalledWith("2026-10-15");
    expect(screen.getAllByRole("button")).toHaveLength(31);
  });
  it("shows an empty month and unavailable indicators instead of zero cost per liter", () => {
    render(wrapper(<Dashboard summary={empty} />));
    expect(screen.getByText(/Não há lançamentos neste mês/)).toBeVisible();
    expect(screen.getAllByText("Indisponível").length).toBeGreaterThan(0);
  });
  it("reports export failures rather than claiming a download succeeded", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "exportMonth").mockRejectedValue(
      new Error("Não foi possível exportar."),
    );
    render(wrapper(<Dashboard summary={month} />));
    await user.click(
      screen.getByRole("button", { name: "Exportar relatório CSV" }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Não foi possível exportar.",
    );
  });
  it("uses the backend diagnosis and renders no injected HTML", async () => {
    vi.spyOn(api, "analyze").mockResolvedValue({
      ...analysis,
      report_markdown: "<script>alert(1)</script>\n# Relatório seguro",
    });
    const { container } = render(wrapper(<Diagnosis />));
    expect(await screen.findByText("Relatório seguro")).toBeVisible();
    expect(container.querySelector("script")).toBeNull();
    expect(
      screen.getByText(analysis.status_label, { exact: true }),
    ).toBeVisible();
    expect(api.analyze).toHaveBeenCalledWith(
      "2026-10-21",
      "demo",
      expect.any(AbortSignal),
    );
  });
  it("requires explicit confirmation to restore the demo", async () => {
    const user = userEvent.setup();
    vi.spyOn(api, "resetDemo").mockResolvedValue(
      bootstrap.contexts.find((item) => item.demo)!,
    );
    render(
      wrapper(
        <Scenarios
          contexts={bootstrap.contexts}
          onSelect={vi.fn()}
          onChanged={vi.fn()}
        />,
      ),
    );
    await user.click(
      screen.getByRole("button", { name: "Restaurar demonstração" }),
    );
    const confirm = screen.getByRole("button", {
      name: "Confirmar restauração",
    });
    expect(confirm).toBeDisabled();
    await user.type(
      screen.getByLabelText("Digite RESTAURAR DEMONSTRAÇÃO"),
      "RESTAURAR DEMONSTRAÇÃO",
    );
    expect(confirm).toBeEnabled();
    await user.click(confirm);
    await waitFor(() => expect(api.resetDemo).toHaveBeenCalledOnce());
  });
});
describe("application integration states", () => {
  function mockBackend() {
    vi.spyOn(api, "bootstrap").mockResolvedValue(bootstrap);
    vi.spyOn(api, "month").mockImplementation(async (_month, id) =>
      id === "real" ? empty : month,
    );
  }
  it("labels hypothetical data and scopes all requests after switching to real history", async () => {
    mockBackend();
    const user = userEvent.setup();
    render(<PecuniaApp />);
    expect(await screen.findByText("DEMONSTRAÇÃO ISOLADA")).toBeVisible();
    await user.click(
      screen.getByRole("combobox", { name: "Contexto dos resultados" }),
    );
    await user.click(screen.getByRole("option", { name: "Histórico real" }));
    expect(
      await screen.findByText("HISTÓRICO REAL", { exact: true }),
    ).toBeVisible();
    await waitFor(() =>
      expect(api.month).toHaveBeenCalledWith(
        expect.any(String),
        "real",
        expect.any(AbortSignal),
      ),
    );
  });
  it("protects an unsaved configuration before changing screens", async () => {
    mockBackend();
    const user = userEvent.setup();
    render(<PecuniaApp />);
    await screen.findByText("DEMONSTRAÇÃO ISOLADA");
    fireEvent.change(screen.getByLabelText("Mão de obra total (R$)"), {
      target: { value: "7000" },
    });
    await user.click(screen.getByRole("tab", { name: "Lançamentos" }));
    expect(
      await screen.findByRole("dialog", { name: "Há alterações não salvas" }),
    ).toBeVisible();
    await user.click(
      screen.getByRole("button", { name: "Continuar editando" }),
    );
    expect(screen.getByLabelText("Mão de obra total (R$)")).toHaveValue(7000);
  });
  it("shows a disconnected state when bootstrap fails", async () => {
    vi.spyOn(api, "bootstrap").mockRejectedValue(
      new Error("Servidor local desconectado."),
    );
    vi.spyOn(api, "month").mockResolvedValue(empty);
    render(<PecuniaApp />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Servidor local desconectado.",
    );
    expect(screen.queryByText("Banco local conectado")).not.toBeInTheDocument();
  });
});

it("creates an independent scenario for the selected month", async () => {
  const user = userEvent.setup();
  const create = vi.spyOn(api, "createScenario").mockResolvedValue({
    id: "new-scenario",
    name: "Novo cenário",
    simulation: true,
    demo: false,
    version: 1,
    record_count: 0,
  });
  const changed = vi.fn();
  render(
    wrapper(
      <Scenarios
        contexts={bootstrap.contexts}
        onSelect={vi.fn()}
        onChanged={changed}
      />,
    ),
  );
  await user.type(screen.getByLabelText("Nome do cenário"), "Novo cenário");
  await user.click(screen.getByRole("button", { name: "Criar cenário" }));
  await waitFor(() => expect(changed).toHaveBeenCalledWith("new-scenario"));
  expect(create).toHaveBeenCalledWith(
    {
      name: "Novo cenário",
      month: "2026-10",
      copy_source: true,
      source_scenario_id: "demo",
    },
    expect.any(String),
  );
});

it("keeps deletion disabled until the scenario name is confirmed", async () => {
  const user = userEvent.setup();
  const branch = {
    id: "branch",
    name: "Comparação hipotética",
    simulation: true,
    demo: false,
    version: 2,
    record_count: 5,
  };
  const remove = vi.spyOn(api, "deleteScenario").mockResolvedValue(undefined);
  render(
    wrapper(
      <Scenarios
        contexts={[...bootstrap.contexts, branch]}
        onSelect={vi.fn()}
        onChanged={vi.fn()}
      />,
    ),
  );
  await user.click(screen.getByRole("button", { name: "Excluir cenário" }));
  const button = screen.getByRole("button", { name: "Excluir cenário" });
  expect(button).toBeDisabled();
  await user.type(
    screen.getByLabelText("Digite o nome exato: Comparação hipotética"),
    "Comparação hipotética",
  );
  await user.click(button);
  await waitFor(() =>
    expect(remove).toHaveBeenCalledWith(branch, "Comparação hipotética"),
  );
});
