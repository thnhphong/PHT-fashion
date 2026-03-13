# Race Condition Prevention - Best Practices

## Overview

This document outlines best practices for preventing race conditions in the e-commerce application, particularly focusing on concurrent operations that could lead to inventory overselling, coupon abuse, payment fraud, and other critical issues.

## Table of Contents

1. [Inventory Management](#inventory-management)
2. [Coupon/Discount Validation](#coupondiscount-validation)
3. [Payment Processing](#payment-processing)
4. [Draft Order Management](#draft-order-management)
5. [Order Finalization](#order-finalization)
6. [General Principles](#general-principles)

---

## 1. Inventory Management

### Problem: Inventory Overselling

**Scenario**: Two users attempt to purchase the last item (1 in stock) simultaneously. Without proper locking, both transactions process, resulting in negative inventory.

### Current Implementation Issues

The current `reserveStockForItems` function uses `findOneAndUpdate` with stock checks, but concurrent requests can still cause race conditions:

```typescript
// Current implementation - VULNERABLE
const filter = { _id: item.productId, stock: { $gte: item.quantity } };
const update = { $inc: { stock: -item.quantity } };
return Product.findOneAndUpdate(filter, update, { new: true });
```

**Problem**: Between the filter check and the update, another request could also pass the check, leading to overselling.

### Best Practice Solution

#### Option 1: Optimistic Locking with Version Key

Enable MongoDB's version key (`__v`) and use it to detect concurrent modifications:

```typescript
// Enable versionKey in Product schema
const ProductSchema = new Schema<IProduct>({...}, {
  versionKey: true, // Enable __v field
});

// In reserveStockForItems
export const reserveStockForItems = async (
  items: CreateOrderItemInput[]
): Promise<ReservedStockResult> => {
  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      const normalizedItems = items.map((item) => ({
        ...item,
        productSize: normalizeSize(item.productSize),
      }));

      const uniqueProductIds = [...new Set(normalizedItems.map((item) => item.productId))];
      const products = await Product.find({ 
        _id: { $in: uniqueProductIds } 
      }).session(session).lean();

      if (products.length !== uniqueProductIds.length) {
        throw new Error('One or more products not found');
      }

      const productMap = new Map(products.map((p) => [p._id.toString(), p]));

      // Atomic stock reservation with retry logic
      const stockUpdates = await Promise.all(
        normalizedItems.map(async (item) => {
          const product = productMap.get(item.productId);
          const hasSizeMatch =
            Boolean(item.productSize) &&
            product?.sizes?.some((s) => s.size === item.productSize);

          const filter = hasSizeMatch
            ? {
                _id: item.productId,
                'sizes.size': item.productSize,
                'sizes.stock': { $gte: item.quantity },
                stock: { $gte: item.quantity },
              }
            : {
                _id: item.productId,
                stock: { $gte: item.quantity },
              };

          const update = hasSizeMatch
            ? {
                $inc: {
                  'sizes.$.stock': -item.quantity,
                  stock: -item.quantity,
                },
              }
            : { $inc: { stock: -item.quantity } };

          const result = await Product.findOneAndUpdate(
            filter,
            update,
            { new: true, session }
          );

          if (!result) {
            const product = productMap.get(item.productId);
            const sizeLabel = item.productSize ? ` in size ${item.productSize}` : '';
            throw new Error(
              `Insufficient stock for "${product?.name ?? item.productId}"${sizeLabel}`
            );
          }

          return result;
        })
      );

      return { normalizedItems, productMap };
    });
  } finally {
    session.endSession();
  }
};
```

#### Option 2: Distributed Locking (Redis)

For high-concurrency scenarios, use Redis distributed locks:

```typescript
import { getRedisClient } from '../utils/redis.util';
import { randomBytes } from 'crypto';

const LOCK_TTL_MS = 5000; // 5 seconds
const LOCK_PREFIX = 'stock_lock:';

async function acquireLock(productId: string): Promise<string | null> {
  const client = await getRedisClient();
  const lockKey = `${LOCK_PREFIX}${productId}`;
  const lockValue = randomBytes(16).toString('hex');
  
  const acquired = await client.set(
    lockKey,
    lockValue,
    'PX',
    LOCK_TTL_MS,
    'NX' // Only set if not exists
  );
  
  return acquired ? lockValue : null;
}

async function releaseLock(productId: string, lockValue: string): Promise<void> {
  const client = await getRedisClient();
  const lockKey = `${LOCK_PREFIX}${productId}`;
  
  // Lua script to ensure we only delete our own lock
  const script = `
    if redis.call("get", KEYS[1]) == ARGV[1] then
      return redis.call("del", KEYS[1])
    else
      return 0
    end
  `;
  
  await client.eval(script, 1, lockKey, lockValue);
}

export const reserveStockForItemsWithLock = async (
  items: CreateOrderItemInput[]
): Promise<ReservedStockResult> => {
  const normalizedItems = items.map((item) => ({
    ...item,
    productSize: normalizeSize(item.productSize),
  }));

  const uniqueProductIds = [...new Set(normalizedItems.map((item) => item.productId))];
  
  // Acquire locks for all products
  const locks = new Map<string, string>();
  
  try {
    for (const productId of uniqueProductIds) {
      const lockValue = await acquireLock(productId);
      if (!lockValue) {
        throw new Error(`Could not acquire lock for product ${productId}`);
      }
      locks.set(productId, lockValue);
    }

    // Now perform stock reservation within locks
    const products = await Product.find({ _id: { $in: uniqueProductIds } });
    // ... rest of the reservation logic
    
  } finally {
    // Release all locks
    for (const [productId, lockValue] of locks.entries()) {
      await releaseLock(productId, lockValue);
    }
  }
};
```

### Recommended Approach

**Use MongoDB Transactions** (Option 1) for most cases. It's simpler, built-in, and sufficient for moderate concurrency. Use Redis locks (Option 2) only if you experience high contention or need cross-service coordination.

---

## 2. Coupon/Discount Validation

### Problem: Coupon Abuse

**Scenario**: A single-use coupon is applied multiple times in rapid succession, allowing users to stack discounts or get items for free.

### Current Implementation Issues

The current coupon validation only checks if a coupon exists and is valid, but doesn't atomically decrement the `count` field:

```typescript
// Current implementation - VULNERABLE
export const getCouponByCode = async (code: string) => {
  return Coupon.findOne({ code: code.toUpperCase() }).lean();
};
```

**Problem**: Multiple requests can all validate the same coupon before any of them decrement the count.

### Best Practice Solution

#### Atomic Coupon Validation and Consumption

```typescript
export const validateAndConsumeCoupon = async (
  code: string,
  session?: mongoose.ClientSession
): Promise<ICoupon | null> => {
  const now = new Date();
  
  const filter = {
    code: code.toUpperCase(),
    expiration_date: { $gte: now },
    count: { $gt: 0 }, // Ensure count is greater than 0
  };

  const update = {
    $inc: { count: -1 }, // Atomically decrement count
  };

  const options: any = { new: true };
  if (session) {
    options.session = session;
  }

  const coupon = await Coupon.findOneAndUpdate(filter, update, options);

  if (!coupon) {
    return null; // Coupon not found, expired, or already exhausted
  }

  return coupon;
};
```

#### Usage in Order Creation

```typescript
export const createDraftOrder = async (payload: CreateOrderInput) => {
  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // Validate and consume coupon atomically
      let couponDiscount = 0;
      if (payload.couponCode) {
        const coupon = await validateAndConsumeCoupon(
          payload.couponCode,
          session
        );
        
        if (!coupon) {
          throw new Error('Invalid or expired coupon code');
        }
        
        couponDiscount = coupon.discount;
      }

      // Reserve stock within the same transaction
      const { normalizedItems, productMap } = await reserveStockForItems(
        payload.items,
        session
      );

      // Calculate totals with coupon discount
      const subtotal = draftItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
      );
      const discountAmount = couponDiscount > 0 
        ? Math.min(couponDiscount, subtotal) 
        : 0;
      const shippingCost = SHIPPING_COSTS[payload.shippingMethod] ?? 0;
      const tax = parseFloat(((subtotal - discountAmount) * TAX_RATE).toFixed(2));
      const totalAmount = parseFloat(
        (subtotal - discountAmount + shippingCost + tax).toFixed(2)
      );

      // ... rest of draft creation
    });
  } finally {
    session.endSession();
  }
};
```

#### Coupon Rollback on Order Cancellation

If an order is cancelled, restore the coupon count:

```typescript
export const restoreCouponCount = async (
  couponCode: string,
  session?: mongoose.ClientSession
): Promise<void> => {
  const filter = { code: couponCode.toUpperCase() };
  const update = { $inc: { count: 1 } };
  const options: any = {};
  
  if (session) {
    options.session = session;
  }

  await Coupon.findOneAndUpdate(filter, update, options);
};
```

---

## 3. Payment Processing

### Problem: Payment/Gift Card Fraud

**Scenario**: Multiple simultaneous requests allow spending a single-use gift card multiple times or exceeding credit limits.

### Best Practice Solution

#### Idempotent Payment Processing

Ensure payment callbacks are idempotent:

```typescript
export const payPalSuccess = async (req: Request, res: Response) => {
  console.log('[PayPal] Success callback. Query:', req.query);
  try {
    const { paymentId, PayerID, draftId } = req.query;
    if (!paymentId || !PayerID || !draftId) {
      return res.status(400).json({ message: 'Missing required PayPal parameters' });
    }

    // Check if payment already processed (idempotency check)
    const existingPending = await getPendingPaymentByDraftId(draftId as string);
    if (existingPending?.status === 'completed') {
      // Payment already processed, return success
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(
        `${frontendUrl}/checkout/success?orderId=${existingPending.orderId}`
      );
    }

    const payment = await executePayPalPayment(paymentId as string, PayerID as string);
    if (payment.state === 'approved') {
      // Use transaction to ensure atomicity
      const session = await mongoose.startSession();
      
      try {
        await session.withTransaction(async () => {
          // Check draft still exists and hasn't been finalized
          const draft = await getDraft(draftId as string);
          if (!draft) {
            throw new Error('Draft order not found or already finalized');
          }

          // Finalize order atomically
          const result = await finalizeDraftOrder(draftId as string, session);
          await updateOrderStatus(
            result.order._id.toString(),
            'processing',
            'paid',
            session
          );
          await completePendingPayment(
            draftId as string,
            result.order._id.toString(),
            session
          );
        });
      } finally {
        session.endSession();
      }

      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      return res.redirect(`${frontendUrl}/checkout/success?orderId=${result.order._id}`);
    }

    return res.status(400).json({ message: 'Payment not approved' });
  } catch (error) {
    console.error('[PayPal] Success error:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    return res.redirect(`${frontendUrl}/checkout?error=payment_failed`);
  }
};
```

#### Payment Idempotency Key

Use payment provider transaction IDs as idempotency keys:

```typescript
// Add to PendingPayment model
interface IPendingPayment {
  // ... existing fields
  paymentId?: string; // PayPal/VNPay transaction ID
  paymentIdempotencyKey?: string; // Unique key for idempotency
}

// Check idempotency before processing
export const checkPaymentIdempotency = async (
  paymentId: string,
  draftId: string
): Promise<boolean> => {
  const existing = await PendingPayment.findOne({
    paymentId,
    status: 'completed',
  });
  
  return !!existing;
};
```

---

## 4. Draft Order Management

### Problem: Duplicate Draft Creation

**Scenario**: Multiple simultaneous requests create duplicate draft orders for the same cart.

### Best Practice Solution

#### Idempotent Draft Creation

```typescript
export const createDraftOrder = async (payload: CreateOrderInput) => {
  const session = await mongoose.startSession();
  
  try {
    return await session.withTransaction(async () => {
      // Generate deterministic draft ID from cart contents + user ID
      // Or use a provided idempotency key
      const draftId = payload.idempotencyKey || randomUUID();
      
      // Check if draft already exists
      const existingDraft = await getDraft(draftId);
      if (existingDraft && existingDraft.customerId === payload.customerId) {
        // Return existing draft if it belongs to the same user
        return {
          draftId: existingDraft.draftId,
          expiresAt: existingDraft.expiresAt,
          totals: existingDraft.totals,
          draft: existingDraft,
          productNames: new Map(), // Can be fetched if needed
        };
      }

      // Validate and consume coupon atomically
      let couponDiscount = 0;
      if (payload.couponCode) {
        const coupon = await validateAndConsumeCoupon(
          payload.couponCode,
          session
        );
        if (!coupon) {
          throw new Error('Invalid or expired coupon code');
        }
        couponDiscount = coupon.discount;
      }

      // Reserve stock within transaction
      const { normalizedItems, productMap } = await reserveStockForItems(
        payload.items,
        session
      );
      // ... rest of draft creation logic
    });
  } finally {
    session.endSession();
  }
};
```

---

## 5. Order Finalization

### Problem: Duplicate Order Creation

**Scenario**: Payment callbacks (return URL + IPN) both try to finalize the same draft order.

### Current Implementation Issues

The current `finalizeDraftOrder` checks if draft exists but doesn't prevent concurrent finalization:

```typescript
// Current implementation - VULNERABLE
export const finalizeDraftOrder = async (draftId: string) => {
  const draft = await getDraft(draftId);
  if (!draft) throw new Error('Draft order not found or already finalized');
  const result = await createOrderFromDraft(draft);
  await deleteDraft(draftId);
  return result;
};
```

**Problem**: Two requests can both read the draft, both create orders, leading to duplicate orders.

### Best Practice Solution

#### Atomic Draft Finalization

```typescript
export const finalizeDraftOrder = async (
  draftId: string,
  session?: mongoose.ClientSession
) => {
  const client = await ensureRedisClient();
  const draftKey = getDraftKey(draftId);
  
  // Use Redis atomic operation to get and delete draft
  const payload = await client.get(draftKey);
  if (!payload) {
    throw new Error('Draft order not found or already finalized');
  }

  // Try to delete the draft atomically (only if it still exists)
  const deleted = await client.del(draftKey);
  if (!deleted) {
    // Another process already finalized this draft
    throw new Error('Draft order already finalized by another process');
  }

  try {
    const draft = JSON.parse(payload) as DraftOrderData;
    const result = await createOrderFromDraft(draft, session);
    return result;
  } catch (error) {
    // If order creation fails, restore the draft
    await client.set(draftKey, payload, { EX: resolveTtl(draft.paymentMethod) });
    throw error;
  }
};
```

#### Alternative: Database-Based Lock

```typescript
// Add a finalization lock collection
const FinalizationLockSchema = new Schema({
  draftId: { type: String, required: true, unique: true },
  lockedAt: { type: Date, default: Date.now, expires: 300 }, // 5 min TTL
});

const FinalizationLock = model('FinalizationLock', FinalizationLockSchema);

export const finalizeDraftOrderWithLock = async (
  draftId: string,
  session?: mongoose.ClientSession
) => {
  const lockSession = session || await mongoose.startSession();
  
  try {
    return await lockSession.withTransaction(async () => {
      // Try to acquire lock
      try {
        await FinalizationLock.create([{ draftId }], { session: lockSession });
      } catch (error) {
        // Lock already exists - another process is finalizing
        throw new Error('Draft order is being finalized by another process');
      }

      const draft = await getDraft(draftId);
      if (!draft) {
        throw new Error('Draft order not found');
      }

      const result = await createOrderFromDraft(draft, lockSession);
      await deleteDraft(draftId);
      
      // Lock will expire automatically via TTL
      return result;
    });
  } finally {
    if (!session) {
      lockSession.endSession();
    }
  }
};
```

---

## 6. General Principles

### 6.1 Always Use Transactions for Multi-Step Operations

Any operation that involves multiple database writes should be wrapped in a transaction:

```typescript
const session = await mongoose.startSession();
try {
  await session.withTransaction(async () => {
    // All database operations here
  });
} finally {
  session.endSession();
}
```

### 6.2 Use Atomic Database Operations

Prefer atomic operations over read-modify-write patterns:

```typescript
// ❌ BAD: Read-modify-write
const product = await Product.findById(productId);
product.stock -= quantity;
await product.save();

// ✅ GOOD: Atomic update
await Product.findOneAndUpdate(
  { _id: productId, stock: { $gte: quantity } },
  { $inc: { stock: -quantity } }
);
```

### 6.3 Implement Idempotency Checks

For external callbacks (payment providers), always check if the operation was already processed:

```typescript
// Check idempotency before processing
const existingOrder = await Order.findOne({ paymentId, status: 'paid' });
if (existingOrder) {
  return existingOrder; // Already processed
}
```

### 6.4 Use Optimistic Locking

Enable version keys in schemas and handle version conflicts:

```typescript
const ProductSchema = new Schema({...}, {
  versionKey: true, // Enables __v field
});

// Handle version conflicts
try {
  await product.save();
} catch (error) {
  if (error.name === 'VersionError') {
    // Handle concurrent modification
    throw new Error('Product was modified by another process');
  }
  throw error;
}
```

### 6.5 Implement Distributed Locks for Cross-Service Operations

When coordinating across services or Redis + MongoDB:

```typescript
// Use Redis for distributed locking
const lockKey = `lock:${resourceId}`;
const lockValue = randomBytes(16).toString('hex');
const acquired = await redis.set(lockKey, lockValue, 'PX', 5000, 'NX');

if (!acquired) {
  throw new Error('Resource is locked');
}

try {
  // Perform operation
} finally {
  // Release lock
  await releaseLock(lockKey, lockValue);
}
```

### 6.6 Validate State Before Operations

Always check current state before performing operations:

```typescript
// Check draft status before finalization
const draft = await getDraft(draftId);
if (!draft) {
  throw new Error('Draft not found');
}

// Check if already finalized
const existingOrder = await Order.findOne({ draftId });
if (existingOrder) {
  throw new Error('Draft already finalized');
}
```

### 6.7 Handle Race Conditions Gracefully

When race conditions are detected, provide clear error messages:

```typescript
try {
  await reserveStockForItems(items);
} catch (error) {
  if (error.message.includes('Insufficient stock')) {
    // User-friendly error
    throw new Error('Sorry, this item is out of stock');
  }
  throw error;
}
```

### 6.8 Monitor and Log Race Condition Attempts

Log race condition attempts for monitoring:

```typescript
try {
  await finalizeDraftOrder(draftId);
} catch (error) {
  if (error.message.includes('already finalized')) {
    logger.warn('Race condition detected in order finalization', {
      draftId,
      timestamp: new Date(),
    });
  }
  throw error;
}
```

---

## Implementation Checklist

- [ ] Enable MongoDB transactions for all multi-step operations
- [ ] Implement atomic coupon validation and consumption
- [ ] Add idempotency checks to payment callbacks
- [ ] Use atomic stock reservation with proper filters
- [ ] Implement draft finalization locks
- [ ] Add version keys to critical schemas (Product, Coupon, Order)
- [ ] Implement distributed locks for high-concurrency scenarios
- [ ] Add comprehensive error handling for race conditions
- [ ] Implement monitoring and logging for race condition attempts
- [ ] Add unit tests for concurrent operations
- [ ] Perform load testing to verify race condition prevention

---

## Testing Race Conditions

### Load Testing Script Example

```typescript
import axios from 'axios';

// Simulate 100 concurrent requests for the last item
const simulateRaceCondition = async () => {
  const productId = 'last-item-id';
  const requests = Array(100).fill(null).map(() =>
    axios.post('/api/orders/create-draft', {
      items: [{ productId, quantity: 1 }],
      // ... other order data
    })
  );

  const results = await Promise.allSettled(requests);
  
  const successful = results.filter(r => r.status === 'fulfilled').length;
  const failed = results.filter(r => r.status === 'rejected').length;
  
  console.log(`Successful: ${successful}, Failed: ${failed}`);
  
  // Verify only one order was created
  const orders = await Order.find({ 'items.productId': productId });
  console.log(`Total orders created: ${orders.length}`);
};
```

---

## References

- [MongoDB Transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [MongoDB Atomic Operations](https://www.mongodb.com/docs/manual/core/write-operations-atomicity/)
- [Redis Distributed Locks](https://redis.io/docs/manual/patterns/distributed-locks/)
- [Idempotency Patterns](https://stripe.com/docs/api/idempotent_requests)
