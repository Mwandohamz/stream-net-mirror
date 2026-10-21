import { handler } from "./index.ts";

Deno.test("authorized sync safely skips without FOOTBALL_DATA_API_KEY", async () => {
  const names = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY", "FIXTURES_SYNC_SECRET", "FOOTBALL_DATA_API_KEY"];
  const previous = names.map(name => Deno.env.get(name));
  try {
    Deno.env.set("SUPABASE_URL", "https://example.invalid");
    Deno.env.set("SUPABASE_ANON_KEY", "unit-test");
    Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "unit-test");
    Deno.env.set("FIXTURES_SYNC_SECRET", "unit-test-sync-secret");
    Deno.env.delete("FOOTBALL_DATA_API_KEY");
    const response = await handler(new Request("https://example.invalid", { method: "POST", headers: { "x-sync-secret": "unit-test-sync-secret" } }));
    const body = await response.json();
    if (response.status !== 200 || body.skipped !== true || body.reason !== "no_api_key") throw new Error("Missing-key no-op failed");
    const denied = await handler(new Request("https://example.invalid", { method: "POST" }));
    if (denied.status !== 401) throw new Error("Public invocation must be rejected");
    const wrong = await handler(new Request("https://example.invalid", { method: "POST", headers: { "x-sync-secret": "wrong" } }));
    if (wrong.status !== 401) throw new Error("Wrong shared secret must be rejected");
  } finally {
    names.forEach((name, index) => { const value = previous[index]; if (value === undefined) Deno.env.delete(name); else Deno.env.set(name, value); });
  }
});