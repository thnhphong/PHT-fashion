# Frontend Patterns

Load for React page, component, or state work.

## Routing

Routes are registered from `frontend/src/App.tsx`. Public pages use shared layout components. Admin pages live under `frontend/src/pages/admin/`.

## API Calls

Use `apiUrl(path)` from `frontend/src/utils/api.ts` unless a nearby file already uses a different established helper. Preserve auth header behavior from existing code.

## State

Use existing contexts for cross-page state:

- Cart: `CartContext`
- Favorites: `FavoriteContext`
- Auth: `AuthContext`
- Chat: `ChatContext`

Keep page-local state inside pages/components when it does not need global sharing.

## UI

Use TailwindCSS v4 conventions already in the file. Icons come from `lucide-react` where possible. Shared primitives live in `frontend/src/components/ui/`.

## Validation

Run:

```bash
pnpm --filter frontend run build
pnpm --filter frontend run lint
```
