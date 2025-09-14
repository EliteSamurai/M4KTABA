'use client';

// Minimal, provider-agnostic address autocomplete helper.
// API returns suggestions without PII; consumers pass only typed-in query.

export type AddressSuggestion = {
  id: string;
  text: string;
  data?: Record<string, unknown>;
};

export async function fetchAddressSuggestions(
  query: string,
  { signal }: { signal?: AbortSignal } = {}
): Promise<AddressSuggestion[]> {
  if (!query || query.trim().length < 3) return [];
  // Placeholder: in prod integrate with provider (e.g., Google, Mapbox, Loqate)
  // For now, return a deterministic mock-like shape based on query.
  // Check if request was aborted
  if (signal?.aborted) throw new Error('Request aborted');
  await Promise.resolve();
  return [
    { id: `s-${query}-1`, text: `${query} Street` },
    { id: `s-${query}-2`, text: `${query} Avenue` },
  ];
}

export function applySuggestionToFields(s: AddressSuggestion) {
  // Best-effort parse for mock data; real implementation would map provider data.
  return {
    street1: s.text,
  } as Partial<Record<string, string>>;
}
