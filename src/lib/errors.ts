// Friendly error mapping used by the global QueryClient handlers, route
// boundaries, and anywhere else we surface an error to the user. Given any
// unknown value we thrown/caught we return a short, human sentence that
// includes the underlying reason when it is safe to do so.

import { ZodError } from "zod";

export type FriendlyError = {
  message: string;
  /** Loose category so callers can decide whether to retry, sign in again, etc. */
  kind: "network" | "auth" | "permission" | "notFound" | "conflict" | "validation" | "server" | "unknown";
};

const NETWORK_HINTS = ["failed to fetch", "networkerror", "load failed", "network request failed", "err_network"];

function fromZod(err: ZodError): FriendlyError {
  const first = err.issues[0];
  const field = first?.path?.length ? ` (${first.path.join(".")})` : "";
  return { kind: "validation", message: `Please check your input${field}: ${first?.message ?? "invalid value"}.` };
}

function fromPostgres(code: string, message: string): FriendlyError | null {
  switch (code) {
    case "42501":
      return { kind: "permission", message: "You don't have permission to do that." };
    case "PGRST301":
      return { kind: "auth", message: "Your session expired. Please sign in again." };
    case "PGRST116":
      return { kind: "notFound", message: "We couldn't find what you were looking for." };
    case "23505":
      return { kind: "conflict", message: "That already exists. Try a different value." };
    case "23503":
      return { kind: "conflict", message: "This item is still in use elsewhere and can't be changed." };
    case "23514":
      return { kind: "validation", message: `That value isn't allowed: ${message}` };
    case "22P02":
      return { kind: "validation", message: "One of the values has the wrong format." };
    default:
      return null;
  }
}

function fromStatus(status: number, fallback: string): FriendlyError {
  if (status === 401) return { kind: "auth", message: "Please sign in to continue." };
  if (status === 403) return { kind: "permission", message: "You don't have permission to do that." };
  if (status === 404) return { kind: "notFound", message: "We couldn't find that." };
  if (status === 409) return { kind: "conflict", message: "That conflicts with something that already exists." };
  if (status === 422 || status === 400) return { kind: "validation", message: fallback || "Please check your input and try again." };
  if (status === 429) return { kind: "server", message: "Too many requests — please slow down and try again." };
  if (status >= 500) return { kind: "server", message: "The server had a problem. Please try again in a moment." };
  return { kind: "unknown", message: fallback || "Something went wrong. Please try again." };
}

export function toFriendlyError(err: unknown): FriendlyError {
  if (!err) return { kind: "unknown", message: "Something went wrong. Please try again." };

  if (err instanceof ZodError) return fromZod(err);

  if (typeof err === "string") {
    const msg = err.trim();
    return { kind: "unknown", message: msg || "Something went wrong. Please try again." };
  }

  const anyErr = err as {
    name?: string;
    message?: string;
    code?: string;
    status?: number;
    statusCode?: number;
    hint?: string;
    details?: string;
    cause?: unknown;
  };

  const rawMsg = (anyErr.message ?? "").toString();
  const lower = rawMsg.toLowerCase();

  // Network / offline
  if (anyErr.name === "TypeError" && NETWORK_HINTS.some((h) => lower.includes(h))) {
    return { kind: "network", message: "You appear to be offline. Check your connection and try again." };
  }
  if (typeof navigator !== "undefined" && navigator && "onLine" in navigator && !navigator.onLine) {
    return { kind: "network", message: "You appear to be offline. Check your connection and try again." };
  }
  if (anyErr.name === "AbortError") {
    return { kind: "network", message: "The request timed out. Please try again." };
  }

  // Supabase auth errors
  if (lower.includes("invalid login credentials")) {
    return { kind: "auth", message: "That email and password don't match." };
  }
  if (lower.includes("email not confirmed")) {
    return { kind: "auth", message: "Please confirm your email address, then try again." };
  }
  if (lower === "unauthorized" || lower.includes("no authorization header") || lower.includes("jwt")) {
    return { kind: "auth", message: "Please sign in to continue." };
  }

  // Postgres error codes (PostgREST surfaces them as `code`)
  if (anyErr.code) {
    const mapped = fromPostgres(anyErr.code, rawMsg);
    if (mapped) return mapped;
  }

  // HTTP status
  const status = anyErr.status ?? anyErr.statusCode;
  if (typeof status === "number") return fromStatus(status, rawMsg);

  if (rawMsg) return { kind: "unknown", message: rawMsg };
  return { kind: "unknown", message: "Something went wrong. Please try again." };
}

export function friendlyMessage(err: unknown): string {
  return toFriendlyError(err).message;
}
