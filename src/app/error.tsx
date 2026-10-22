"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="grid min-h-screen place-items-center p-8">
      <div>
        <h1 className="text-2xl font-semibold">
          Não foi possível carregar esta tela.
        </h1>
        <p className="mt-3 text-muted-foreground">
          Seus registros permanecem no banco local.
        </p>
        <button
          onClick={reset}
          className="mt-5 rounded-lg bg-emerald-300 px-5 py-3 text-emerald-950"
        >
          Tentar novamente
        </button>
      </div>
    </main>
  );
}
