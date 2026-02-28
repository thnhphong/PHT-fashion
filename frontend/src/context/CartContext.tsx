// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { ONE_SIZE_VALUE, formatSizeLabel } from '../utils/sizeUtils';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  img_url: string;
  selectedSize: string;
  quantity: number;
  stock: number;       // available stock for selected size
  supplier?: string;   // optional – from supplierId.name
  // optional size metadata for editing size inside cart
  sizes?: { size: string; stock: number }[];
}

interface CartContextType {
  cart: CartItem[];
  showCartPopup: boolean;
  setShowCartPopup: (show: boolean) => void;
  addToCart: (product: any, selectedSize: string, quantity: number) => void;
  updateQuantity: (id: string, size: string, newQuantity: number) => void;
  updateItemSize: (id: string, oldSize: string, newSize: string) => void;
  removeFromCart: (id: string, size: string) => void;
  getCartItemQuantity: (id: string, size: string) => number;
  getCartTotal: () => number;
  getTotalItems: () => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = sessionStorage.getItem('cart');
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      return parsed.map((item: any) => ({
        ...item,
        price: Number(item.price),
        quantity: Number(item.quantity),
      }));
    } catch {
      return [];
    }
  });

  const [showCartPopup, setShowCartPopup] = useState(false);

  // Persist to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart:', err);
    }
  }, [cart]);

  const addToCart = useCallback(
    (product: any, selectedSize: string, quantity: number = 1) => {
      if (!product?._id) return;

      const sizeKey = selectedSize || ONE_SIZE_VALUE;
      const sizeInfo = product.sizes?.find((s: any) => s.size === sizeKey);
      const availableStock = sizeInfo?.stock ?? Number(product.stock ?? 0);

      if (availableStock < quantity) {
        alert(`Not enough stock for size ${formatSizeLabel(sizeKey)}`);
        return;
      }

      setCart((prev) => {
        const existing = prev.find(
          (item) => item._id === product._id && item.selectedSize === sizeKey
        );

        if (existing) {
          return prev.map((item) =>
            item._id === product._id && item.selectedSize === sizeKey
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }

        return [
          ...prev,
          {
            _id: product._id,
            name: product.name,
            price: product.price,
            img_url: product.img_url,
            selectedSize: sizeKey,
            quantity,
            stock: availableStock,
            supplier: product.supplierId?.name,
            sizes: Array.isArray(product.sizes)
              ? product.sizes.map((s: any) => ({
                  size: s.size,
                  stock: Number(s.stock ?? 0),
                }))
              : undefined,
          },
        ];
      });

      setShowCartPopup(true);
    },
    [setShowCartPopup]
  );

  const updateQuantity = useCallback((id: string, size: string, newQuantity: number) => {
    if (newQuantity < 0) return;

    setCart((prev) =>
      prev
        .map((item) =>
          item._id === id && item.selectedSize === size
            ? { ...item, quantity: newQuantity }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  }, []);

  const updateItemSize = useCallback(
    (id: string, oldSize: string, newSize: string) => {
      if (!newSize || oldSize === newSize) return;

      setCart((prev) => {
        const index = prev.findIndex(
          (item) => item._id === id && item.selectedSize === oldSize
        );
        if (index === -1) return prev;

        const currentItem = prev[index];

        // Find stock for the new size, falling back to current stock
        const sizeInfo =
          currentItem.sizes?.find((s) => s.size === newSize) ?? null;
        const availableStock =
          sizeInfo && typeof sizeInfo.stock === 'number'
            ? sizeInfo.stock
            : currentItem.stock;

        const adjustedQuantity = Math.max(
          1,
          Math.min(currentItem.quantity, availableStock)
        );

        const existingWithNewSizeIndex = prev.findIndex(
          (item, idx) =>
            idx !== index && item._id === id && item.selectedSize === newSize
        );

        const next = [...prev];

        if (existingWithNewSizeIndex !== -1) {
          // Merge into existing line with new size
          const existingItem = next[existingWithNewSizeIndex];
          const mergedQuantity = Math.min(
            existingItem.quantity + adjustedQuantity,
            availableStock
          );
          next[existingWithNewSizeIndex] = {
            ...existingItem,
            quantity: mergedQuantity,
            stock: availableStock,
          };
          // Remove old-size line
          next.splice(index, 1);
          return next;
        }

        // Just update the existing line with the new size
        next[index] = {
          ...currentItem,
          selectedSize: newSize,
          quantity: adjustedQuantity,
          stock: availableStock,
        };

        return next;
      });
    },
    []
  );

  const removeFromCart = useCallback((id: string, size: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item._id === id && item.selectedSize === size))
    );
  }, []);

  const getTotalItems = useCallback(
    () => cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  const getCartTotal = useCallback(
    () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [cart]
  );

  const getCartItemQuantity = useCallback(
    (id: string, size: string) =>
      cart.find((item) => item._id === id && item.selectedSize === size)?.quantity ?? 0,
    [cart]
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const value: CartContextType = {
    cart,
    showCartPopup,
    setShowCartPopup,
    addToCart,
    updateQuantity,
    updateItemSize,
    removeFromCart,
    getCartItemQuantity,
    getCartTotal,
    getTotalItems,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};