# API Design Patterns

Load for backend endpoint work.

## Flow

Use route -> middleware -> controller -> service -> model.

- Routes define paths and middleware only.
- Controllers parse request data, call services, and shape responses.
- Services own DB, Redis, payment, email, and business rules.
- Models define Mongoose schemas and interfaces.

## Validation

Use Zod schemas in `backend/src/validations/` and apply them through `validateRequest(schema)`.

## Errors

Prefer existing `ApiError` patterns where available. Keep controller errors consistent with neighboring controllers.

## Pagination

Use `backend/src/utils/pagination.ts` for list endpoints where possible.

## Endpoint Checklist

1. Add schema.
2. Add service method.
3. Add controller method.
4. Add route.
5. Mount route.
6. Build backend.
