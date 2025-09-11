# Address Autocomplete (flag: address_autocomplete)

Purpose: Provider-agnostic facade for address suggestions. No PII is sent in function inputs; only the user-typed query. Integrate a real provider behind fetchAddressSuggestions.

Usage:

- Import fetchAddressSuggestions(query, { signal }) to get minimal suggestions.
- Call applySuggestionToFields(suggestion) to map to form fields (best-effort).
- Gate UI with useFlag("address_autocomplete").

Constraints:

- No network required in tests; function returns deterministic suggestions.
- Do not pass full address/PII to third parties by default; only the current query string.
- Prefer AbortController to cancel stale requests.
