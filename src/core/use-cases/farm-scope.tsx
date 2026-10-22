"use client";
import { createContext, useContext, useEffect } from "react";
export interface FarmScope {
  contextId: string;
  month: string;
  day: string;
  revision: number;
  setDay: (day: string) => void;
  saved: () => void;
  notify: (message: string) => void;
  navigate: (action: () => void) => void;
  registerDraft: (id: string, dirty: boolean) => void;
}
export const FarmScopeContext = createContext<FarmScope | null>(null);
export function useFarmScope(): FarmScope {
  const value = useContext(FarmScopeContext);
  if (!value)
    throw new Error("Não foi possível carregar o contexto da propriedade.");
  return value;
}
export function useDraftFlag(id: string, dirty: boolean) {
  const { registerDraft } = useFarmScope();
  useEffect(() => {
    registerDraft(id, dirty);
    return () => registerDraft(id, false);
  }, [id, dirty, registerDraft]);
}
