# face-verification (Deprecated)

This Supabase Edge Function is **deprecated**. Face verification is now handled by the **Human API** (`https://human-api-blond.vercel.app`).

- The Next.js app calls the Human API directly via `src/shared/lib/api-client/face-verification.ts`.
- Registered face data is stored in Supabase (e.g. `face_photo_url`); the Human API fetches it using the user ID.

This function is kept for reference only. It is excluded from the Next.js TypeScript build via `tsconfig.json` (`exclude: ["supabase"]`).
