import connectDB from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { encryptPassword, decryptPassword } from "@/lib/encryption";
import {
  ShiprocketAuthResponse,
  ShiprocketError,
} from "./types";

export const SHIPROCKET_BASE_URL = "https://apiv2.shiprocket.in";
const REQUEST_TIMEOUT_MS = 10_000;
const TOKEN_REFRESH_BUFFER_MS = 6 * 60 * 60 * 1000; // refresh 6h before expiry
const TOKEN_LIFETIME_MS = 9 * 24 * 60 * 60 * 1000; // Shiprocket tokens last ~10 days

export interface ShiprocketConfig {
  enabled: boolean;
  email: string;
  password: string;
  pickupLocation: string;
  channelId?: string;
  webhookSecret: string;
  rateMode: "shiprocket" | "flat";
  defaultWeight: number;
  defaultLength: number;
  defaultBreadth: number;
  defaultHeight: number;
  defaultHsnCode: string;
  pickupPincode: string;
}

export async function getShiprocketConfig(): Promise<ShiprocketConfig> {
  await connectDB();
  const settings = await Settings.findOne();
  const sr = settings?.shiprocket;
  if (!sr) {
    throw new ShiprocketError(
      "NOT_CONFIGURED",
      "Shiprocket settings are not configured",
      400,
    );
  }
  if (!sr.enabled) {
    throw new ShiprocketError(
      "DISABLED",
      "Shiprocket integration is disabled in settings",
      400,
    );
  }
  if (!sr.email || !sr.password) {
    throw new ShiprocketError(
      "MISSING_CREDENTIALS",
      "Shiprocket email or password missing in settings",
      400,
    );
  }
  return {
    enabled: sr.enabled,
    email: sr.email,
    password: decryptPassword(sr.password),
    pickupLocation: sr.pickupLocation || "Primary",
    channelId: sr.channelId || undefined,
    webhookSecret: sr.webhookSecret ? decryptPassword(sr.webhookSecret) : "",
    rateMode: sr.rateMode || "flat",
    defaultWeight: sr.defaultWeight || 0.5,
    defaultLength: sr.defaultLength || 15,
    defaultBreadth: sr.defaultBreadth || 12,
    defaultHeight: sr.defaultHeight || 5,
    defaultHsnCode: sr.defaultHsnCode || "",
    pickupPincode: sr.pickupPincode || "",
  };
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs = REQUEST_TIMEOUT_MS,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function loginAndPersistToken(
  email: string,
  password: string,
): Promise<string> {
  const res = await fetchWithTimeout(
    `${SHIPROCKET_BASE_URL}/v1/external/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    throw new ShiprocketError(
      "AUTH_FAILED",
      `Shiprocket login failed (${res.status})`,
      res.status,
      detail,
    );
  }
  const data = (await res.json()) as ShiprocketAuthResponse;
  if (!data.token) {
    throw new ShiprocketError(
      "AUTH_NO_TOKEN",
      "Shiprocket login response missing token",
      500,
      data,
    );
  }
  const expiresAt = new Date(Date.now() + TOKEN_LIFETIME_MS);
  await Settings.findOneAndUpdate(
    {},
    {
      $set: {
        "shiprocket.apiToken": encryptPassword(data.token),
        "shiprocket.apiTokenExpiresAt": expiresAt,
      },
    },
    { upsert: true },
  );
  return data.token;
}

// In-process dedupe for concurrent refresh attempts. Survives within a single Node
// worker; cross-instance dedupe relies on the persisted token in Settings instead.
let inFlightLogin: Promise<string> | null = null;

export async function getAuthToken(forceRefresh = false): Promise<string> {
  await connectDB();
  const settings = await Settings.findOne();
  const sr = settings?.shiprocket;
  if (!sr || !sr.email || !sr.password) {
    throw new ShiprocketError(
      "MISSING_CREDENTIALS",
      "Shiprocket credentials missing",
      400,
    );
  }
  if (!forceRefresh && sr.apiToken && sr.apiTokenExpiresAt) {
    const expiresAt = new Date(sr.apiTokenExpiresAt).getTime();
    if (expiresAt - Date.now() > TOKEN_REFRESH_BUFFER_MS) {
      const decrypted = decryptPassword(sr.apiToken);
      if (decrypted) return decrypted;
    }
  }
  if (inFlightLogin) return inFlightLogin;
  inFlightLogin = loginAndPersistToken(
    sr.email,
    decryptPassword(sr.password),
  ).finally(() => {
    inFlightLogin = null;
  });
  return inFlightLogin;
}

export interface SrFetchOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  timeoutMs?: number;
  retryOn5xx?: boolean;
}

export async function srFetch<T = unknown>(
  path: string,
  opts: SrFetchOptions = {},
): Promise<T> {
  const url = `${SHIPROCKET_BASE_URL}${path}`;
  const { body, timeoutMs, retryOn5xx = true, headers, method, ...rest } = opts;

  let token = await getAuthToken();
  let attempt = 0;
  let triedRefresh = false;
  // up to 2 attempts on 5xx (200ms backoff)
  while (true) {
    attempt += 1;
    const init: RequestInit = {
      ...rest,
      method: method || (body !== undefined ? "POST" : "GET"),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(headers as Record<string, string>),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    };
    const started = Date.now();
    let res: Response;
    try {
      res = await fetchWithTimeout(url, init, timeoutMs);
    } catch (err: any) {
      if (err?.name === "AbortError") {
        throw new ShiprocketError(
          "TIMEOUT",
          `Shiprocket request timed out: ${path}`,
          504,
        );
      }
      throw new ShiprocketError(
        "NETWORK",
        `Shiprocket network error: ${err?.message || "unknown"}`,
        503,
      );
    }
    const durationMs = Date.now() - started;
    if (res.status === 401 && !triedRefresh) {
      triedRefresh = true;
      token = await getAuthToken(true);
      continue;
    }
    if (res.status >= 500 && retryOn5xx && attempt < 2) {
      await new Promise((r) => setTimeout(r, 200 * attempt));
      continue;
    }
    let parsed: unknown = undefined;
    const text = await res.text();
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    if (!res.ok) {
      console.error(
        `[shiprocket] ${init.method} ${path} -> ${res.status} (${durationMs}ms)`,
      );
      throw new ShiprocketError(
        "API_ERROR",
        `Shiprocket ${res.status} on ${path}`,
        res.status,
        parsed,
      );
    }
    console.log(
      `[shiprocket] ${init.method} ${path} -> ${res.status} (${durationMs}ms)`,
    );
    return parsed as T;
  }
}

// One-shot login with ad-hoc credentials (used by the admin "Test connection" button
// before the creds are saved to DB).
export async function loginWith(
  email: string,
  password: string,
): Promise<string> {
  const res = await fetchWithTimeout(
    `${SHIPROCKET_BASE_URL}/v1/external/auth/login`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    },
  );
  if (!res.ok) {
    let detail: unknown = undefined;
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    throw new ShiprocketError(
      "AUTH_FAILED",
      `Shiprocket login failed (${res.status})`,
      res.status,
      detail,
    );
  }
  const data = (await res.json()) as ShiprocketAuthResponse;
  if (!data.token) {
    throw new ShiprocketError(
      "AUTH_NO_TOKEN",
      "Shiprocket login response missing token",
      500,
    );
  }
  return data.token;
}
