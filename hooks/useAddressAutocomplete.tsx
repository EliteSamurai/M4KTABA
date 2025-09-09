"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { debounce } from "@/lib/debounce";
import {
  AddressSuggestion,
  fetchAddressSuggestions,
  applySuggestionToFields,
} from "@/lib/addressAutocomplete";

export function useAddressAutocomplete() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const controllerRef = useRef<AbortController | null>(null);

  const run = useMemo(
    () =>
      debounce(async (q: string) => {
        if (controllerRef.current) controllerRef.current.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setStatus("loading");
        try {
          const list = await fetchAddressSuggestions(q, {
            signal: controller.signal,
          });
          setSuggestions(list);
          setStatus("ready");
        } catch (e: any) {
          if (e?.name === "AbortError") return;
          setStatus("error");
        }
      }, 250),
    []
  );

  useEffect(() => {
    if (!query || query.trim().length < 3) {
      setSuggestions([]);
      setStatus("idle");
      return;
    }
    run(query);
  }, [query, run]);

  function apply(s: AddressSuggestion) {
    return applySuggestionToFields(s);
  }

  return { query, setQuery, suggestions, status, apply } as const;
}


