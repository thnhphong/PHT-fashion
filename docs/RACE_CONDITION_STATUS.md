# Race Condition Mitigations - Current State

## Inventory
- Stock reservation runs inside a MongoDB transaction via `reserveStockForItems`, using `$gte` guards and size-aware `$inc` so concurrent decrements return `null` and throw an “Insufficient stock” error.
- Product schema uses `versionKey: '__v'` for optimistic locking; interface exposes `__v` to surface version conflicts.
- Restore on cancellation/expiry reincrements stock per item and size.

## Coupon
- Atomic consumption implemented in `validateAndConsumeCoupon` (`findOneAndUpdate` with `count > 0` and expiration filter, optional session). Schema now uses `versionKey: '__v'` and exposes `__v`.
- Coupons are validated and consumed during draft finalization inside the same transaction; rollback restores automatically.

## Order / Draft Finalization
- Draft finalization uses Redis `GETDEL` (`popDraft`) as a mutex so only one caller can consume a draft before persisting the order.
- Order schema uses `versionKey: '__v'` and exposes `__v`.
- On transaction failure, draft is restored with remaining TTL to allow retry.

## Payment
- PayPal/VNPay controllers enforce idempotency by checking completed `PendingPayment` via `paymentId`/transactionNo before finalizing.
- `finalizeDraftOrder` is shared by return+IPN paths; GETDEL prevents duplicate order creation.
- Pending payments are marked completed atomically and keyed by `draftId` (unique). ExpiresAt TTL plus lazy expiry guard stale sessions.

## Open Items / Recommendations
- PendingPayment schema currently disables `versionKey`; add it if optimistic locking for updates is desired (optional).
- Add regression tests/load tests for concurrent stock reservation, coupon consumption, and duplicate payment callbacks.
