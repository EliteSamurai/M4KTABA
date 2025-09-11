# Saved Addresses (flag: saved_addresses)

Purpose: Minimal localStorage-backed persistence for user saved addresses. Intended as a facade that can later be swapped with a backend.

Usage:
- listSavedAddresses(userId): SavedAddress[]
- saveAddress(userId, address): void
- removeAddress(userId, id): void

Constraints:
- No PII leaves the browser in this module. Integrate a server route if syncing is required later.
- Use only when `useFlag("saved_addresses")` is true.
