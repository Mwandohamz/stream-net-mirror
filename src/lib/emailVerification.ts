export function verificationDestination(next: string | null): string {
  return next && /^\/(?!\/)/.test(next) && !next.includes("\\") ? next : "/dashboard";
}

export function emailVerificationUrl(origin: string, next: string | null): string {
  const destination = verificationDestination(next);
  return `${origin}/verify${destination === "/dashboard" ? "" : `?next=${encodeURIComponent(destination)}`}`;
}