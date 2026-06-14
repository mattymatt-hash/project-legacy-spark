// EasyPost REST client — fetch-based, no SDK. Workers-compatible.
// Docs: https://docs.easypost.com/docs/shipments
const API = "https://api.easypost.com/v2";

function getKey(): string {
  const key = process.env.EASYPOST_API_KEY;
  if (!key) throw new Error("EASYPOST_API_KEY is not set");
  return key;
}

function basicAuthHeader(key: string) {
  // EasyPost uses HTTP Basic with API key as username, blank password.
  const token = btoa(`${key}:`);
  return `Basic ${token}`;
}

export async function easypostRequest<T = unknown>(
  path: string,
  init: { method?: "GET" | "POST" | "DELETE"; body?: Record<string, unknown> } = {},
): Promise<T> {
  const method = init.method ?? "POST";
  const headers: Record<string, string> = {
    Authorization: basicAuthHeader(getKey()),
    "Content-Type": "application/json",
  };
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: init.body && method !== "GET" ? JSON.stringify(init.body) : undefined,
  });
  const text = await res.text();
  let json: unknown;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const err = (json as { error?: { message?: string } })?.error?.message ?? `EasyPost ${res.status}`;
    throw new Error(typeof err === "string" ? err : "EasyPost request failed");
  }
  return json as T;
}

export type EPAddress = {
  name?: string | null;
  street1: string;
  street2?: string | null;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string | null;
  email?: string | null;
};

export type EPRate = {
  id: string;
  carrier: string;
  service: string;
  rate: string; // dollars as string
  currency: string;
  delivery_days: number | null;
  est_delivery_days: number | null;
};

export type EPShipment = {
  id: string;
  rates: EPRate[];
  tracking_code?: string | null;
  postage_label?: { label_url: string } | null;
  tracker?: { id: string; public_url?: string; tracking_code?: string } | null;
};
