# Common Mistakes

Read at session start. Keep this file short and update it only for repeated or costly mistakes.

## Top Risks

1. Frontend API base mismatch
   - Frontend uses `apiUrl(path)` and Vite proxy behavior. Check `frontend/src/utils/api.ts` and `frontend/vite.config.ts` before changing request paths.

2. Auth token assumptions
   - Auth code mixes cookie-based notes with localStorage helpers. Before changing auth, inspect `frontend/src/utils/auth.ts`, `frontend/src/context/AuthContext.tsx`, and `backend/src/controllers/auth.controller.ts`.

3. Backend route prefix confusion
   - Frontend calls `/api/*`; backend routes mount under `backend/src/routes/index.ts` and `backend/src/index.ts`. Vite may strip `/api` in dev.

4. Generated backend files
   - Do not edit `backend/dist/**`. Source lives in `backend/src/**`.

5. Docs/context bloat
   - Do not load full README or long feature docs unless needed. Use `docs/INDEX.md` and Code Review Graph first.

## Update Rule

Add an item when a bug costs more than one focused debugging pass, reaches production risk, or repeats across sessions.
