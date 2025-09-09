"use client";

// Simple saved addresses facade storing to localStorage keyed by user id.

export type SavedAddress = {
  id: string;
  label: string;
  name: string;
  street1: string;
  street2?: string;
  city: string;
  zip: string;
  state: string;
  country: string;
};

const key = (userId: string) => `saved-addresses:${userId}`;

export function listSavedAddresses(userId: string): SavedAddress[] {
  try {
    const raw = window.localStorage.getItem(key(userId));
    return raw ? (JSON.parse(raw) as SavedAddress[]) : [];
  } catch {
    return [];
  }
}

export function saveAddress(userId: string, addr: SavedAddress) {
  const list = listSavedAddresses(userId);
  const next = [addr, ...list.filter((a) => a.id !== addr.id)];
  window.localStorage.setItem(key(userId), JSON.stringify(next));
}

export function removeAddress(userId: string, id: string) {
  const list = listSavedAddresses(userId);
  const next = list.filter((a) => a.id !== id);
  window.localStorage.setItem(key(userId), JSON.stringify(next));
}


