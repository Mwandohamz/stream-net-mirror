# Architecture rules

- Signup and all verification resends share `src/lib/emailVerification.ts` to land on the public `/verify` route and preserve safe internal checkout destinations on success.