// src/context/CartContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  img_url: string;
  selectedSize: string;
  quantity: number;
  stock: number;       // available stock for selected size
  supplier?: string;   // optional – from supplierId.name
}

interface CartContextType {
  cart: CartItem[];
  showCartPopup: boolean;
  setShowCartPopup: (show: boolean) => void;
  addToCart: (product: any, selectedSize: string, quantity: number) => void;
  updateQuantity: (id: string, size: string, newQuantity: number) => void;
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
      if (!product?._id || !selectedSize) return;

      const sizeInfo = product.sizes?.find((s: any) => s.size === selectedSize);
      if (!sizeInfo || sizeInfo.stock < quantity) {
        alert(`Not enough stock for size ${selectedSize}`);
        return;
      }

      setCart((prev) => {
        const existing = prev.find(
          (item) => item._id === product._id && item.selectedSize === selectedSize
        );

        if (existing) {
          return prev.map((item) =>
            item._id === product._id && item.selectedSize === selectedSize
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
            selectedSize,
            quantity,
            stock: sizeInfo.stock,
            supplier: product.supplierId?.name,
          },
        ];
      });

      setShowCartPopup(true);
    },
    []
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