"use client";

import { useEffect, useSyncExternalStore } from "react";

export type KnownFlag =
  | "checkout_state_machine"
  | "optimistic_qty"
  | "preflight_drift"
  | "address_autocomplete"
  | "saved_addresses"
  | "offline_queue"
  | "tokens_rhythm";

const defaultOnInDevTest = true;

function readEnvDefault(flag: KnownFlag): boolean {
  const env = (typeof process !== "undefined" && (process as any).env) || {};
  const key = `NEXT_PUBLIC_FLAG_${flag.toUpperCase()}`;
  if (env[key] != null) {
    const v = String(env[key]).toLowerCase();
    return v === "1" || v === "true";
  }
  // Default ON in dev/test, OFF in prod
  const isDevOrTest = env.NODE_ENV !== "production";
  return defaultOnInDevTest && isDevOrTest;
}

const storeKey = (flag: KnownFlag) => `flag:${flag}`;

export function isEnabled(flag: KnownFlag): boolean {
  try {
    if (typeof window !== "undefined") {
      const ls = window.localStorage.getItem(storeKey(flag));
      if (ls != null) return ls === "1" || ls === "true";
    }
  } catch {}
  return readEnvDefault(flag);
}

export function setFlag(flag: KnownFlag, value: boolean) {
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storeKey(flag), value ? "1" : "0");
      window.dispatchEvent(new Event("flags:change"));
    }
  } catch {}
}

function subscribe(callback: () => void) {
  const handler = () => callback();
  window.addEventListener("flags:change", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("flags:change", handler);
    window.removeEventListener("storage", handler);
  };
}

export function useFlag(flag: KnownFlag): boolean {
  const getSnapshot = () => isEnabled(flag);
  const getServerSnapshot = () => readEnvDefault(flag);
  return useSyncExternalStore(
    typeof window !== "undefined" ? subscribe : () => () => {},
    getSnapshot,
    getServerSnapshot
  );
}

// Server-friendly helpers for progressive rollout
export function getFlag(name: string, fallback: boolean = false): boolean {
  const env = (typeof process !== "undefined" && (process as any).env) || {};
  const key = `NEXT_PUBLIC_FLAG_${name.toUpperCase()}`;
  if (env[key] != null) {
    const v = String(env[key]).toLowerCase();
    return v === "1" || v === "true";
  }
  return fallback;
}

export function getNumberFlag(name: string, fallback: number): number {
  const env = (typeof process !== "undefined" && (process as any).env) || {};
  const key = `NEXT_PUBLIC_FLAG_${name.toUpperCase()}`;
  const raw = env[key];
  const n = raw != null ? Number(raw) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

export function bucketUserToVariant(uid: string, percent: number): "v1" | "v2" {
  let hash = 0;
  for (let i = 0; i < uid.length; i++) {
    hash = (hash * 31 + uid.charCodeAt(i)) >>> 0;
  }
  const bucket = hash % 100;
  return bucket < Math.max(0, Math.min(100, Math.floor(percent))) ? "v2" : "v1";
}
