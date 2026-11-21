/** Reads the real error message from a failed function call instead of the generic "non-2xx" text. */
export async function functionErrorMessage(error: unknown, fallback = "Something went wrong"): Promise<string> {
  const e = error as { message?: string; context?: Response } | null;
  try {
    if (e?.context && typeof e.context.json === "function") {
      const body = await e.context.clone().json();
      if (body?.error) return String(body.error);
      if (body?.message) return String(body.message);
    }
  } catch { /* body not JSON */ }
  return e?.message || fallback;
}
