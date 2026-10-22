"use client";
import { useEffect, useRef, useState } from "react";
interface ResourceState<T> {
  key: string;
  revision: number;
  data: T | null;
  loading: boolean;
  error: string | null;
}
export function useResource<T>(
  key: string,
  load: (signal: AbortSignal) => Promise<T>,
  revision: number,
  enabled = true,
) {
  const loader = useRef(load);
  useEffect(() => {
    loader.current = load;
  }, [load]);
  const [state, setState] = useState<ResourceState<T>>({
    key,
    revision,
    data: null,
    loading: true,
    error: null,
  });
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    setState((previous) => ({
      key,
      revision,
      data: previous.key === key ? previous.data : null,
      loading: true,
      error: null,
    }));
    loader
      .current(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({ key, revision, data, loading: false, error: null });
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted)
          setState({
            key,
            revision,
            data: null,
            loading: false,
            error:
              error instanceof Error
                ? error.message
                : "Não foi possível consultar os dados.",
          });
      });
    return () => controller.abort();
  }, [key, revision, enabled]);
  return state.key === key
    ? state.revision === revision
      ? state
      : { ...state, loading: true, error: null }
    : { key, revision, data: null, loading: true, error: null };
}
