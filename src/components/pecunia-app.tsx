"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Leaf,
  LayoutDashboard,
  CalendarDays,
  BookOpen,
  BrainCircuit,
  Radio,
  RefreshCw,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  CheckCircle2,
  X,
  FlaskConical,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FixedCosts } from "@/components/fixed-costs";
import { Dashboard } from "@/components/dashboard";
import { Daily } from "@/components/daily";
import { History } from "@/components/history";
import { Diagnosis } from "@/components/diagnosis";
import { Scenarios } from "@/components/scenarios";
import { Loading, Notice } from "@/components/shared";
import { api } from "@/core/services/api";
import { useResource } from "@/core/use-cases/use-resource";
import { FarmScopeContext } from "@/core/use-cases/farm-scope";
import { localToday } from "@/lib/format";
const navigation = [
  { id: "daily", label: "Lançamentos", icon: BookOpen },
  { id: "history", label: "Calendário financeiro", icon: CalendarDays },
  { id: "dashboard", label: "Fechamento & DRE", icon: LayoutDashboard },
  { id: "diagnosis", label: "Análises & diagnósticos", icon: BrainCircuit },
  { id: "scenarios", label: "Simulações", icon: FlaskConical },
] as const;
export function PecuniaApp() {
  const [today] = useState(localToday);
  const [month, setMonth] = useState(today.slice(0, 7)),
    [day, setSelectedDay] = useState(today),
    [contextChoice, setContextChoice] = useState<string | null>(null);
  const [tab, setTab] = useState("dashboard"),
    [revision, setRevision] = useState(0),
    [sidebar, setSidebar] = useState(true),
    [notice, setNotice] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null),
    [navigationVersion, setNavigationVersion] = useState(0);
  const drafts = useRef(new Set<string>());
  const registerDraft = useCallback((id: string, dirty: boolean) => {
    if (dirty) drafts.current.add(id);
    else drafts.current.delete(id);
  }, []);
  const navigate = useCallback((action: () => void) => {
    if (drafts.current.size) setPendingAction(() => action);
    else action();
  }, []);
  useEffect(() => {
    setSidebar(window.matchMedia("(min-width: 768px)").matches);
  }, []);
  useEffect(() => {
    function handle(event: BeforeUnloadEvent) {
      if (drafts.current.size) {
        event.preventDefault();
        event.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handle);
    return () => window.removeEventListener("beforeunload", handle);
  }, []);
  const bootstrap = useResource(
    "bootstrap",
    (signal) => api.bootstrap(signal),
    revision,
  );
  useEffect(() => {
    if (contextChoice === null && bootstrap.data)
      setContextChoice(bootstrap.data.initial_context_id);
  }, [contextChoice, bootstrap.data]);
  const contextId =
    contextChoice ?? bootstrap.data?.initial_context_id ?? "real";
  const currentContext = bootstrap.data?.contexts.find(
    (context) => context.id === contextId,
  );
  const closing = useResource(
    `month:${contextId}:${month}`,
    (signal) => api.month(month, contextId, signal),
    revision,
    Boolean(bootstrap.data && currentContext),
  );
  const saved = useCallback(() => {
    setRevision((value) => value + 1);
    setNotice(
      "Alterações salvas. Os resultados do contexto foram atualizados.",
    );
  }, []);
  function selectContext(id: string) {
    navigate(() => {
      setContextChoice(id);
      setNotice(null);
    });
  }
  function selectMonth(value: string) {
    navigate(() => {
      setMonth(value);
      setSelectedDay(value === today.slice(0, 7) ? today : `${value}-01`);
    });
  }
  function setDay(value: string) {
    const apply = () => {
      setSelectedDay(value);
      setMonth(value.slice(0, 7));
    };
    if (value.slice(0, 7) !== month && drafts.current.has("farm-settings"))
      setPendingAction(() => apply);
    else apply();
  }
  const scope = {
    contextId,
    month,
    day,
    revision,
    setDay,
    saved,
    notify: setNotice,
    navigate,
    registerDraft,
  };
  return (
    <FarmScopeContext.Provider value={scope}>
      <div className="app-shell">
        <aside
          className={`sidebar ${sidebar ? "" : "sidebar-hidden"}`}
          aria-label="Configuração da propriedade"
        >
          <a href="/" className="brand">
            <div className="brand-icon">
              <Leaf size={24} strokeWidth={1.5} />
            </div>
            <div>
              <span className="text-xl font-semibold tracking-tight">
                pecunia<span className="text-emerald-300">.</span>
              </span>
              <span className="block text-[9px] tracking-[.29em] text-muted-foreground">
                AGROTECH
              </span>
            </div>
          </a>
          <div className="farm-profile">
            <p className="text-xs font-medium">Minha propriedade</p>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Pecuária leiteira · gestão local
            </p>
          </div>
          <div className="flex-1 px-5 py-6">
            {closing.data && currentContext ? (
              <FixedCosts
                key={`${contextId}-${month}-${navigationVersion}`}
                costs={closing.data.settings}
                onSaved={saved}
              />
            ) : (
              <p className="text-xs text-muted-foreground">
                {closing.error
                  ? "Não foi possível carregar a configuração."
                  : "Carregando a configuração…"}
              </p>
            )}
          </div>
          <div className="sidebar-footer">
            <div className="mb-3 flex items-center gap-2 text-xs text-emerald-200">
              <Radio size={13} />
              Operação local e offline
            </div>
            <p className="text-[10px] leading-5 text-muted-foreground">
              Banco no seu computador.
              <br />
              Dados reais e cenários independentes.
            </p>
            <div className="mt-4 border-t border-border pt-4 text-[9px] tracking-widest text-muted-foreground">
              HACKATHON UFJF 2026 · TEMA 3
            </div>
          </div>
        </aside>
        <div className={`main-shell ${sidebar ? "" : "main-expanded"}`}>
          <header className="topbar">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                aria-label={
                  sidebar ? "Recolher configurações" : "Abrir configurações"
                }
                onClick={() => setSidebar(!sidebar)}
              >
                {sidebar ? (
                  <PanelLeftClose size={18} />
                ) : (
                  <PanelLeftOpen size={18} />
                )}
              </Button>
              <span className="hidden text-xs text-muted-foreground sm:block">
                Minha propriedade
              </span>
              <ChevronRight className="hidden sm:block" size={13} />
              <span className="text-xs">Gestão financeira</span>
            </div>
            <Badge variant="outline" className="gap-2 text-[10px] font-normal">
              <span
                className={`size-1.5 rounded-full ${bootstrap.error || closing.error ? "bg-amber-300" : "bg-emerald-300"}`}
              />
              {bootstrap.error || closing.error
                ? "Servidor indisponível"
                : bootstrap.loading || closing.loading
                  ? "Consultando dados"
                  : "Banco local conectado"}
            </Badge>
          </header>
          <main className="main-content">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-5">
              <div>
                <p className="eyebrow">PECUNIA AGROTECH / TEMA 3</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-[-.04em] md:text-[2.2rem]">
                  Clareza para decidir. Controle para crescer.
                </h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  Gestão econômica, histórico confiável e diagnósticos
                  explicáveis.
                </p>
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <div className="space-y-2">
                  <Label
                    htmlFor="month-filter"
                    className="text-[10px] uppercase tracking-widest text-muted-foreground"
                  >
                    Período
                  </Label>
                  <Input
                    id="month-filter"
                    type="month"
                    min="1900-01"
                    max="2100-12"
                    value={month}
                    onChange={(event) => {
                      if (/^\d{4}-\d{2}$/.test(event.target.value))
                        selectMonth(event.target.value);
                    }}
                    className="w-43"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="Atualizar dados"
                  onClick={() => setRevision((value) => value + 1)}
                >
                  <RefreshCw
                    size={15}
                    className={closing.loading ? "animate-spin" : ""}
                  />
                </Button>
              </div>
            </div>
            {bootstrap.data && (
              <div
                className={`context-strip mb-6 ${currentContext?.simulation ? "simulation-context" : ""}`}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
                    Contexto dos resultados
                  </p>
                  <div className="mt-2">
                    <Select value={contextId} onValueChange={selectContext}>
                      <SelectTrigger
                        aria-label="Contexto dos resultados"
                        className="w-full max-w-85"
                      >
                        <SelectValue placeholder="Selecione o contexto" />
                      </SelectTrigger>
                      <SelectContent>
                        {bootstrap.data.contexts.map((context) => (
                          <SelectItem key={context.id} value={context.id}>
                            {context.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="text-right">
                  <Badge
                    variant="outline"
                    className={
                      currentContext?.simulation
                        ? "text-amber-100"
                        : "text-emerald-200"
                    }
                  >
                    {currentContext?.demo
                      ? "DEMONSTRAÇÃO ISOLADA"
                      : currentContext?.simulation
                        ? "CENÁRIO HIPOTÉTICO"
                        : "HISTÓRICO REAL"}
                  </Badge>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {currentContext?.simulation
                      ? "Não altera nem compõe o resultado real."
                      : "Somente os lançamentos reais são incluídos."}
                  </p>
                </div>
              </div>
            )}
            {notice && (
              <div
                role="status"
                className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-300/20 p-4 text-xs text-emerald-200"
              >
                <CheckCircle2 size={16} />
                <span className="flex-1">{notice}</span>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-6"
                  aria-label="Fechar aviso"
                  onClick={() => setNotice(null)}
                >
                  <X size={13} />
                </Button>
              </div>
            )}
            {!bootstrap.data ? (
              bootstrap.error ? (
                <div className="space-y-4">
                  <Notice error>{bootstrap.error}</Notice>
                  <Button onClick={() => setRevision((value) => value + 1)}>
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <Loading />
              )
            ) : !currentContext ? (
              bootstrap.loading ? (
                <Loading />
              ) : (
                <Notice error>
                  O contexto não está mais disponível. Selecione outro contexto
                  para continuar.
                </Notice>
              )
            ) : (
              <Tabs
                value={tab}
                onValueChange={(value) => navigate(() => setTab(value))}
                className="gap-7"
              >
                <TabsList className="nav-tabs" aria-label="Áreas da aplicação">
                  {navigation.map(({ id, label, icon: Icon }) => (
                    <TabsTrigger className="nav-trigger" key={id} value={id}>
                      <Icon size={15} />
                      {label}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <div key={`${contextId}-${navigationVersion}`}>
                  <TabsContent value="daily">
                    <Daily />
                  </TabsContent>
                  <TabsContent value="history">
                    <History
                      summary={closing.data}
                      periodError={closing.error}
                    />
                  </TabsContent>
                  <TabsContent value="dashboard">
                    {closing.loading ? (
                      <Loading />
                    ) : closing.error ? (
                      <Notice error>{closing.error}</Notice>
                    ) : (
                      closing.data && <Dashboard summary={closing.data} />
                    )}
                  </TabsContent>
                  <TabsContent value="diagnosis">
                    <Diagnosis />
                  </TabsContent>
                  <TabsContent value="scenarios">
                    <Scenarios
                      contexts={bootstrap.data.contexts}
                      onSelect={selectContext}
                      onChanged={(id) => {
                        if (id) setContextChoice(id);
                        setRevision((value) => value + 1);
                        setNotice(
                          "Operação concluída. Os contextos foram atualizados.",
                        );
                      }}
                    />
                  </TabsContent>
                </div>
              </Tabs>
            )}
            <footer className="mt-12 flex flex-wrap justify-between gap-3 border-t border-border py-6 text-[10px] text-muted-foreground">
              <span>Pecunia AgroTech · Hackathon UFJF 2026</span>
              <span>
                Dados locais · Regras transparentes · Decisões informadas
              </span>
            </footer>
          </main>
        </div>
        <Dialog
          open={pendingAction !== null}
          onOpenChange={(open) => {
            if (!open) setPendingAction(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Há alterações não salvas</DialogTitle>
              <DialogDescription>
                Ao continuar, os campos não salvos desta tela serão descartados.
                Você pode voltar para revisar e salvar antes de sair.
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setPendingAction(null)}>
                Continuar editando
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  drafts.current.clear();
                  pendingAction?.();
                  setPendingAction(null);
                  setNavigationVersion((value) => value + 1);
                }}
              >
                Descartar e continuar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </FarmScopeContext.Provider>
  );
}
