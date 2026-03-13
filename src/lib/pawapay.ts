import { supabase } from "@/integrations/supabase/client";

const PROXY_URL_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pawapay-proxy`;

async function proxyCall(action: string, body: Record<string, any> = {}) {
  const res = await fetch(PROXY_URL_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
    body: JSON.stringify({ action, ...body }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`pawapay proxy error (${res.status}): ${text}`);
  }
  return res.json();
}

export async function getActiveConf(countryIso3: string) {
  return proxyCall("active-conf", { country: countryIso3 });
}

export async function predictProvider(phoneNumber: string) {
  return proxyCall("predict", { phoneNumber });
}

export interface DepositRequest {
  depositId: string;
  amount: string;
  currency: string;
  phoneNumber: string;
  provider: string;
  // metadata for DB
  name: string;
  email: string;
  country: string;
}

export async function initiateDeposit(req: DepositRequest) {
  return proxyCall("deposit", req);
}

export async function checkDepositStatus(depositId: string) {
  return proxyCall("status", { depositId });
}
