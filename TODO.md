# GlockCleaner Site - Fix Production NetworkError Task

## Plan Steps (Approved)
1. ~~[DONE] Diagnose issue: Supabase env vars fallback to invalid placeholders in prod~~
2. ✅ Update `src/lib/supabase.ts`: Remove fallbacks, add validation/logging.
3. ✅ Update `src/contexts/AuthContext.tsx`: Add error handling for init.
4. ✅ Create `.env.example` with template vars.
5. ✅ Update `vite.config.ts`: Add env logging.
6. [PENDING] Test: Run `npm run build && npm run preview` then check browser console/network tab on /login.
7. [PENDING] Deploy instructions & prod env setup.
8. [PENDING] attempt_completion

**Next: User test step 6, then provide prod hosting details for final steps.**


