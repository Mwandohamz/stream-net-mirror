export function verificationDestination(next: string | null): string {
  return next && /^\/(?!\/)/.test(next) && !next.includes("\\") ? next : "/dashboard";
}

export function emailVerificationUrl(origin: string, next: string | null): string {
  const destination = verificationDestination(next);
  // Email links always land on the official site, including from preview/native.
  void origin;
  return `https://streamnetmirror.app/verify${destination === "/dashboard" ? "" : `?next=${encodeURIComponent(destination)}`}`;
}