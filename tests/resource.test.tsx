import { it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useResource } from "@/core/use-cases/use-resource";
it("does not allow a delayed previous context to replace current results", async () => {
  let resolveOld: (value: string) => void = () => {};
  const old = new Promise<string>((resolve) => {
    resolveOld = resolve;
  });
  const loadOld = vi.fn(() => old),
    loadNew = vi.fn(async () => "Resultado real");
  function Consumer({ scope }: { scope: string }) {
    const result = useResource(scope, scope === "old" ? loadOld : loadNew, 0);
    return <p>{result.data ?? "Carregando"}</p>;
  }
  const { rerender } = render(<Consumer scope="old" />);
  rerender(<Consumer scope="real" />);
  expect(await screen.findByText("Resultado real")).toBeVisible();
  await act(async () => resolveOld("Cenário antigo"));
  expect(screen.getByText("Resultado real")).toBeVisible();
  expect(screen.queryByText("Cenário antigo")).not.toBeInTheDocument();
});
