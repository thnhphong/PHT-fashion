import { Request, Response } from 'express';
import {
  placeOrder,
  getOrderById,
  getOrdersByCustomer,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
} from '../services/order.service';
import { OrderStatus, PaymentStatus } from '../models/Order';

// POST /api/orders  — authenticated customer
export const createOrder = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.sub;
    if (!customerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { items, shippingAddress, shippingMethod, paymentMethod, couponCode } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }

    const result = await placeOrder({
      customerId,
      items,
      shippingAddress,
      shippingMethod,
      paymentMethod,
      couponCode,
    });

    return res.status(201).json({
      message: 'Order placed successfully',
      order: result.order,
      items: result.orderItems,
    });
  } catch (error) {
    if (error instanceof Error) {
      // Business logic errors (stock, not found, etc.)
      return res.status(400).json({ message: error.message });
    }
    console.error('Create order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/orders/my  — authenticated customer — own orders
export const getMyOrders = async (req: Request, res: Response) => {
  try {
    const customerId = req.user?.sub;
    if (!customerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const orders = await getOrdersByCustomer(customerId);
    return res.status(200).json(orders);
  } catch (error) {
    console.error('Get my orders error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/orders/:id  — authenticated customer (own order) or admin
export const getOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.role === 'admin' ? undefined : req.user?.sub;

    const order = await getOrderById(id as string, customerId as string);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error('Get order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/orders/:id/cancel  — authenticated customer (own order)
export const cancelMyOrder = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const customerId = req.user?.sub;
    if (!customerId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const order = await cancelOrder(id as string, customerId as string);
    return res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Cancel order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// ─── Admin-only below ────────────────────────────────────────────────────────

// GET /api/admin/orders
export const adminGetAllOrders = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const status = req.query.status as OrderStatus | undefined;

    const result = await getAllOrders(page, limit, status);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Admin get orders error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// GET /api/admin/orders/:id
export const adminGetOrder = async (req: Request, res: Response) => {
  try {
    const order = await getOrderById(req.params.id as string); // no customerId filter for admin
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    return res.status(200).json(order);
  } catch (error) {
    console.error('Admin get order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// PATCH /api/admin/orders/:id/status
export const adminUpdateOrderStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, paymentStatus } = req.body;

    const validStatuses: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await updateOrderStatus(id as string, status as OrderStatus, paymentStatus as PaymentStatus);
    return res.status(200).json({ message: 'Order status updated', order });
  } catch (error) {
    if (error instanceof Error && error.message === 'Order not found') {
      return res.status(404).json({ message: 'Order not found' });
    }
    console.error('Admin update status error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// POST /api/admin/orders/:id/cancel
export const adminCancelOrder = async (req: Request, res: Response) => {
  try {
    const order = await cancelOrder(req.params.id as string); // no customerId restriction for admin
    return res.status(200).json({ message: 'Order cancelled successfully', order });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Admin cancel order error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};