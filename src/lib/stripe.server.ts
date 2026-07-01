// Stripe REST client — fetch-based, no SDK. Workers-compatible.
// Encodes form bodies (Stripe API uses application/x-www-form-urlencoded).

const API = "https://api.stripe.com/v1";

function getKey(): string {
  const key = process.env.STRIPE_SECRET_KEY || process.env.STRIPE_TEST_API_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return key;
}

/** Recursively encode an object/array into Stripe's bracketed form encoding. */
function encode(params: Record<string, unknown>, prefix = ""): string[] {
  const parts: string[] = [];
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null) continue;
    const key = prefix ? `${prefix}[${k}]` : k;
    if (Array.isArray(v)) {
      v.forEach((item, i) => {
        if (typeof item === "object" && item !== null) {
          parts.push(...encode(item as Record<string, unknown>, `${key}[${i}]`));
        } else {
          parts.push(`${encodeURIComponent(`${key}[${i}]`)}=${encodeURIComponent(String(item))}`);
        }
      });
    } else if (typeof v === "object") {
      parts.push(...encode(v as Record<string, unknown>, key));
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`);
    }
  }
  return parts;
}

export async function stripeRequest<T = unknown>(
  path: string,
  init: { method?: "GET" | "POST" | "DELETE"; body?: Record<string, unknown>; stripeAccount?: string; idempotencyKey?: string } = {},
): Promise<T> {
  const method = init.method ?? "POST";
  const headers: Record<string, string> = {
    Authorization: `Bearer ${getKey()}`,
  };
  if (init.stripeAccount) headers["Stripe-Account"] = init.stripeAccount;
  if (init.idempotencyKey) headers["Idempotency-Key"] = init.idempotencyKey;

  let url = `${API}${path}`;
  let body: string | undefined;
  if (init.body && method !== "GET") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    body = encode(init.body).join("&");
  } else if (init.body && method === "GET") {
    url += `?${encode(init.body).join("&")}`;
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let json: unknown;
  try { json = text ? JSON.parse(text) : {}; } catch { json = { raw: text }; }
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } })?.error?.message ?? `Stripe ${res.status}`;
    throw new Error(msg);
  }
  return json as T;
}

/** Verify Stripe webhook signature (v1 scheme). Returns parsed event or throws. */
export async function verifyStripeWebhook(payload: string, sigHeader: string, secret: string, toleranceSec = 300): Promise<unknown> {
  const parts = sigHeader.split(",").reduce<Record<string, string>>((acc, p) => {
    const [k, v] = p.split("=");
    if (k && v) (acc[k] ||= v);
    return acc;
  }, {});
  const ts = parts.t;
  const sigs = sigHeader.split(",").filter((p) => p.startsWith("v1=")).map((p) => p.slice(3));
  if (!ts || sigs.length === 0) throw new Error("Invalid signature header");

  const signed = `${ts}.${payload}`;
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(signed));
  const expected = Array.from(new Uint8Array(sigBuf)).map((b) => b.toString(16).padStart(2, "0")).join("");

  let match = false;
  for (const s of sigs) {
    if (s.length === expected.length) {
      let diff = 0;
      for (let i = 0; i < s.length; i++) diff |= s.charCodeAt(i) ^ expected.charCodeAt(i);
      if (diff === 0) match = true;
    }
  }
  if (!match) throw new Error("Signature mismatch");

  const age = Math.abs(Date.now() / 1000 - Number(ts));
  if (age > toleranceSec) throw new Error("Signature timestamp outside tolerance");

  return JSON.parse(payload);
}
