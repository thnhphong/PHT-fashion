import Cart from '../models/Cart';
import { Types } from 'mongoose';

const populateCartItems = (query: any) =>
  query.populate({
    path: 'items.productId',
    select: 'name price img_url stock sizes categoryId supplierId',
    populate: [
      { path: 'categoryId', select: 'name' },
      { path: 'supplierId', select: 'name' },
    ],
  });

export const getCart = async (userId: string) => {
  let cart = await populateCartItems(
    Cart.findOne({ userId: new Types.ObjectId(userId) })
  );
  if (!cart) {
    cart = await Cart.create({ userId: new Types.ObjectId(userId), items: [] });
  }
  return cart;
};

export const addItem = async (
  userId: string,
  productId: string,
  size: string,
  quantity: number
) => {
  let cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  if (!cart) {
    cart = new Cart({ userId: new Types.ObjectId(userId), items: [] });
  }

  const existing = cart.items.find(
    (item) => item.productId.toString() === productId && item.size === size
  );

  if (existing) {
    existing.quantity += quantity;
  } else {
    cart.items.push({
      productId: new Types.ObjectId(productId),
      size,
      quantity,
      addedAt: new Date(),
    });
  }

  await cart.save();
  return populateCartItems(Cart.findById(cart._id));
};

export const updateItem = async (
  userId: string,
  productId: string,
  size: string,
  quantity: number
) => {
  const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  if (!cart) throw new Error('Cart not found');

  const item = cart.items.find(
    (item) => item.productId.toString() === productId && item.size === size
  );
  if (!item) throw new Error('Item not found in cart');

  item.quantity = quantity;
  await cart.save();
  return populateCartItems(Cart.findById(cart._id));
};

export const removeItem = async (
  userId: string,
  productId: string,
  size: string
) => {
  const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  if (!cart) throw new Error('Cart not found');

  cart.items = cart.items.filter(
    (item) => !(item.productId.toString() === productId && item.size === size)
  );

  await cart.save();
  return populateCartItems(Cart.findById(cart._id));
};

export const clearCart = async (userId: string) => {
  const cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  if (!cart) return null;

  cart.items = [];
  await cart.save();
  return cart;
};

export const mergeCart = async (
  userId: string,
  guestItems: { productId: string; size: string; quantity: number }[]
) => {
  let cart = await Cart.findOne({ userId: new Types.ObjectId(userId) });
  if (!cart) {
    cart = new Cart({ userId: new Types.ObjectId(userId), items: [] });
  }

  for (const guestItem of guestItems) {
    const existing = cart.items.find(
      (item) =>
        item.productId.toString() === guestItem.productId &&
        item.size === guestItem.size
    );

    if (existing) {
      existing.quantity = Math.max(existing.quantity, guestItem.quantity);
    } else {
      cart.items.push({
        productId: new Types.ObjectId(guestItem.productId),
        size: guestItem.size,
        quantity: guestItem.quantity,
        addedAt: new Date(),
      });
    }
  }

  await cart.save();
  return populateCartItems(Cart.findById(cart._id));
};
