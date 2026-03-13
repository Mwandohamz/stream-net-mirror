

# Plan: pawaPay Mobile Money Payment Integration

## Security Architecture (Critical)

The pawaPay API token is a **secret** and must NEVER be exposed to the browser. All pawaPay API calls will go through **backend functions** (edge functions), not directly from the client. The user's prompt mentions `VITE_` prefixed vars for the token — we will NOT do that. Only the exchange rate API (public, no key) will be called from the client.

```text
Browser (React)                    Edge Functions                    pawaPay API
─────────────────                  ──────────────                    ──────────
FX rates ──→ open.er-api.com (public, direct)

Country select ──→ pawapay-proxy/active-conf ──→ GET /v2/active-conf
Phone input   ──→ pawapay-proxy/predict      ──→ POST /v2/predict-provider
Pay Now       ──→ pawapay-proxy/deposit       ──→ POST /v2/deposits
Poll status   ──→ pawapay-proxy/status        ──→ GET /v1/deposits/{id}
```

## What You Need to Provide

Before I build this, I need you to add **2 secrets**:

1. **`PAWAPAY_API_TOKEN`** — Your sandbox API token from the pawaPay dashboard
2. **`PAWAPAY_BASE_URL`** — Set to `https://api.sandbox.pawapay.io` (I'll prompt you to add these)

No exchange rate API key needed — the free tier of open.er-api.com works without one.

## Implementation

### 1. Edge Function: `pawapay-proxy`
Single edge function with path-based routing:
- `POST /active-conf` — proxies active configuration request
- `POST /predict` — proxies predict-provider request  
- `POST /deposit` — initiates deposit, also inserts/updates the `payments` table with `depositId` and status
- `POST /status` — checks deposit status, updates payment record on completion

### 2. Database Changes
Add columns to `payments` table:
- `deposit_id` (text, nullable) — pawaPay deposit UUID
- `currency` (text, default 'ZMW') — currency used
- `country` (text, default 'ZMB') — country code
- `failure_reason` (text, nullable)
- `provider_transaction_id` (text, nullable)

### 3. Client-Side Files

**`src/data/countries.ts`** — Static list of 13 supported countries with flag, ISO3, currency, prefix.

**`src/lib/currency.ts`** — Currency formatting helpers.

**`src/hooks/useExchangeRate.ts`** — Fetches ZMW→USD and ZMW→target rates from open.er-api.com (client-side, public API). Caches for 10 minutes.

**`src/hooks/useActiveConf.ts`** — Calls edge function to get available providers for selected country.

**`src/hooks/usePaymentStatus.ts`** — Polls edge function every 5 seconds for deposit status. Stops on COMPLETED/FAILED. 3-minute timeout.

**`src/components/PaymentModal.tsx`** — Multi-step modal replacing the current Payment page form:
- Step 1: Amount display (USD equivalent + local currency)
- Step 2: Country selection dropdown with flags
- Step 3: Provider selection cards (from active-conf, with logos)
- Step 4: Phone number input with country prefix + predict-provider validation
- Step 5: Processing/awaiting PIN screen with USSD instructions
- Step 6: Success or failure result

### 4. Payment Page Update
Replace the current mock payment flow in `Payment.tsx` with the new `<PaymentModal />`. Keep name + email collection on the page, then open the modal for the payment steps.

### 5. Files Summary

| Action | File |
|--------|------|
| Create | `supabase/functions/pawapay-proxy/index.ts` |
| Create | `src/data/countries.ts` |
| Create | `src/lib/currency.ts` |
| Create | `src/hooks/useExchangeRate.ts` |
| Create | `src/hooks/useActiveConf.ts` |
| Create | `src/hooks/usePaymentStatus.ts` |
| Create | `src/components/PaymentModal.tsx` |
| Modify | `src/pages/Payment.tsx` |
| Migration | Add columns to payments table |

### 6. Next Steps After Approval

I will first prompt you to add the two secrets (`PAWAPAY_API_TOKEN`, `PAWAPAY_BASE_URL`), then build everything once they're configured.

