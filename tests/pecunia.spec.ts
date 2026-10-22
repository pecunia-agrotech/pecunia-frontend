import { test, expect } from "@playwright/test";
const endpoint = `${(process.env.PECUNIA_TEST_API_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "")}/api/v1`;

test("isolated contexts, real CRUD, calendar, report and diagnosis", async ({
  page,
  request,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  const bootstrap = await (await request.get(`${endpoint}/bootstrap`)).json();
  const day: string = bootstrap.local_date;
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Os números que movem sua fazenda." }),
  ).toBeVisible();
  await expect(page.getByText("DEMONSTRAÇÃO ISOLADA")).toBeVisible();
  await page.getByRole("combobox", { name: "Contexto dos resultados" }).click();
  await page
    .getByRole("option", { name: "Histórico real", exact: true })
    .click();
  await expect(page.getByText("HISTÓRICO REAL", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Lançamentos", exact: true }).click();
  await page.getByLabel("Valor (R$)", { exact: true }).fill("123.45");
  await page
    .getByLabel("Volume comercializado (L) · obrigatório", { exact: true })
    .fill("45.500");
  const description = `QA descartável ${Date.now()}`;
  await page
    .getByLabel("Descrição · opcional", { exact: true })
    .fill(description);
  await page
    .getByRole("button", { name: "Salvar registro no banco de dados" })
    .click();
  await expect(
    page.getByText(
      "Alterações salvas. Os resultados do contexto foram atualizados.",
    ),
  ).toBeVisible();
  const records = await (
    await request.get(`${endpoint}/records?date=${day}`)
  ).json();
  const created = records.find(
    (record: { description: string }) => record.description === description,
  );
  expect(created.amount).toBe(123.45);
  await page.getByRole("tab", { name: "Calendário financeiro" }).click();
  await expect(page.getByText(description)).toBeVisible();
  await page
    .getByRole("button", { name: `Ações do registro ${created.id}` })
    .click();
  await page.getByRole("menuitem", { name: "Editar", exact: true }).click();
  const dialog = page.getByRole("dialog", {
    name: `Editar lançamento #${created.id}`,
  });
  await dialog.getByLabel("Valor (R$)", { exact: true }).fill("200");
  await dialog.getByRole("button", { name: "Salvar alterações" }).click();
  await expect(dialog).not.toBeVisible();
  await page
    .getByRole("button", { name: `Ações do registro ${created.id}` })
    .click();
  await page.getByRole("menuitem", { name: "Excluir", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Excluir registro", exact: true })
    .click();
  await expect(page.getByText(description)).not.toBeVisible();
  await page.getByRole("tab", { name: "Simulações", exact: true }).click();
  const scenarioName = `Cenário QA ${Date.now()}`;
  await page.getByLabel("Nome do cenário").fill(scenarioName);
  await page
    .getByRole("button", { name: "Criar cenário", exact: true })
    .click();
  await expect(page.getByText("CENÁRIO HIPOTÉTICO")).toBeVisible();
  await page.getByRole("tab", { name: "Análises & diagnósticos" }).click();
  await expect(page.getByText("Relatório executivo · POR QUÊ?")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Atenção", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Fechamento & DRE" }).click();
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar relatório CSV" }).click();
  expect((await download).suggestedFilename()).toMatch(/^pecunia_.*\.csv$/);
  const contexts = await (await request.get(`${endpoint}/contexts`)).json();
  const scenario = contexts.find(
    (context: { name: string }) => context.name === scenarioName,
  );
  await request.delete(`${endpoint}/scenarios/${scenario.id}`, {
    data: { version: scenario.version, confirmation: scenarioName },
  });
  expect(errors).toEqual([]);
});

test("mobile navigation, keyboard and no horizontal page overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  if (
    await page
      .getByRole("button", { name: "Recolher configurações" })
      .isVisible()
  )
    await page.getByRole("button", { name: "Recolher configurações" }).click();
  await expect(
    page.getByRole("heading", { name: "Os números que movem sua fazenda." }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
  await page.getByRole("tab", { name: "Calendário financeiro" }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("group", { name: "Calendário financeiro mensal" }),
  ).toBeVisible();
});
