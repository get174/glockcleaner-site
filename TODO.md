# GlockCleaner Site - Fix Production NetworkError Task

## Plan Steps (Approved)
1. ~~[DONE] Diagnose issue: Supabase env vars fallback to invalid placeholders in prod~~
2. ✅ Update `src/lib/supabase.ts`: Remove hard throw on missing env vars; add validation + safe fallback.
3. ✅ Update `src/contexts/AuthContext.tsx`: Add error handling for init.
4. ✅ Create `.env.example` with template vars.
5. [PENDING] Update `vite.config.ts`: Add env logging (optional).
6. ✅ Test: `npm run build` succeeded. Lint may still fail due to existing PayPal any-types.
7. ✅ Vercel setup notes: see `TODO.vercel.md` (Vite build-time env + PayPal API env).





