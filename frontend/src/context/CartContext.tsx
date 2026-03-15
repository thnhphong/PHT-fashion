import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { ONE_SIZE_VALUE, formatSizeLabel } from '../utils/sizeUtils';
import { apiUrl } from '../utils/api';
import { isAuthenticated, getAccessToken } from '../utils/auth';

export interface CartItem {
  _id: string;
  name: string;
  price: number;
  img_url: string;
  selectedSize: string;
  quantity: number;
  stock: number;
  supplier?: string;
  categoryName: string;
  sizes?: { size: string; stock: number }[];
}

interface CartContextType {
  cart: CartItem[];
  showCartPopup: boolean;
  setShowCartPopup: (show: boolean) => void;
  addToCart: (product: any, selectedSize: string, quantity?: number) => Promise<void>;
  updateQuantity: (id: string, size: string, newQuantity: number) => Promise<void>;
  updateItemSize: (id: string, oldSize: string, newSize: string) => Promise<void>;
  removeFromCart: (id: string, size: string) => Promise<void>;
  getCartItemQuantity: (id: string, size: string) => number;
  getCartTotal: () => number;
  getTotalItems: () => number;
  clearCart: () => Promise<void>;
  mergeGuestCart: () => Promise<void>;
  syncCartToDbOnLogout: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'pht_cart';
const GUEST_SESSION_KEY = 'pht_guest_session_at';

const mergeCartItems = (api: CartItem[], local: CartItem[]): CartItem[] => {
  const byKey = new Map<string, CartItem>();
  for (const item of api) {
    byKey.set(`${item._id}:${item.selectedSize}`, item);
  }
  for (const item of local) {
    const key = `${item._id}:${item.selectedSize}`;
    const existing = byKey.get(key);
    if (existing) {
      byKey.set(key, { ...existing, quantity: Math.max(existing.quantity, item.quantity) });
    } else {
      byKey.set(key, item);
    }
  }
  return Array.from(byKey.values());
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const sessionTime = localStorage.getItem(GUEST_SESSION_KEY);
      if (sessionTime) {
        const age = Date.now() - parseInt(sessionTime, 10);
        if (age > 24 * 60 * 60 * 1000) {
          localStorage.removeItem(CART_STORAGE_KEY);
          localStorage.removeItem('pht_favorites');
          localStorage.removeItem(GUEST_SESSION_KEY);
          return [];
        }
      }
      const saved = localStorage.getItem(CART_STORAGE_KEY);
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
  const [isInitialized, setIsInitialized] = useState(false);

  // On load: fetch from DB when logged in (merge with localStorage), else load from localStorage
  useEffect(() => {
    let isMounted = true;
    const fetchCart = async () => {
      if (isAuthenticated()) {
        try {
          const res = await fetch(apiUrl('/cart'), {
            headers: { Authorization: `Bearer ${getAccessToken()}` },
          });
          if (res.ok) {
            const data = await res.json();
            const apiItems = (data.items ?? []).map((item: any) => ({
              _id: item.productId._id,
              name: item.productId.name,
              price: item.productId.price,
              img_url: item.productId.img_url || item.productId.images?.[0] || '',
              selectedSize: item.size,
              quantity: item.quantity,
              stock: item.productId.stock || 0,
              supplier: item.productId.supplierId?.name,
              categoryName: item.productId.categoryId?.name,
              sizes: item.productId.sizes,
            }));
            const saved = localStorage.getItem(CART_STORAGE_KEY);
            const localItems = saved ? JSON.parse(saved) : [];
            const merged = mergeCartItems(apiItems, localItems);
            if (isMounted) setCart(merged);
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(merged));
          }
        } catch (err) {
          console.error('Failed to fetch cart:', err);
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (isMounted && saved) {
            const parsed = JSON.parse(saved).map((item: any) => ({
              ...item,
              price: Number(item.price),
              quantity: Number(item.quantity),
            }));
            setCart(parsed);
          }
        }
      } else {
        const sessionTime = localStorage.getItem(GUEST_SESSION_KEY);
        if (sessionTime) {
          const age = Date.now() - parseInt(sessionTime, 10);
          if (age > 24 * 60 * 60 * 1000) {
            localStorage.removeItem(CART_STORAGE_KEY);
            localStorage.removeItem('pht_favorites');
            localStorage.removeItem(GUEST_SESSION_KEY);
            if (isMounted) setCart([]);
            setIsInitialized(true);
            return;
          }
        }
        const saved = localStorage.getItem(CART_STORAGE_KEY);
        if (isMounted) {
          setCart(saved ? JSON.parse(saved).map((item: any) => ({
            ...item,
            price: Number(item.price),
            quantity: Number(item.quantity),
          })) : []);
        }
      }
      if (isMounted) setIsInitialized(true);
    };

    fetchCart();
    window.addEventListener('auth-token-set', fetchCart);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-token-set', fetchCart);
    };
  }, []);

  // Persist to localStorage for both guest and logged-in (browsing uses localStorage only)
  useEffect(() => {
    if (isInitialized) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        if (!localStorage.getItem(GUEST_SESSION_KEY) && cart.length > 0) {
          localStorage.setItem(GUEST_SESSION_KEY, Date.now().toString());
        }
      } catch (err) {
        console.error('Failed to save cart:', err);
      }
    }
  }, [cart, isInitialized]);

  const addToCart = useCallback(
    async (product: any, selectedSize: string, quantity: number = 1) => {
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
            img_url: product.img_url || product.images?.[0] || '',
            selectedSize: sizeKey,
            quantity,
            stock: availableStock,
            supplier: product.supplierId?.name,
            categoryName: product.categoryId?.name,
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

  const updateQuantity = useCallback(async (id: string, size: string, newQuantity: number) => {
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
    async (id: string, oldSize: string, newSize: string) => {
      if (!newSize || oldSize === newSize) return;

      setCart((prev) => {
        const index = prev.findIndex(
          (item) => item._id === id && item.selectedSize === oldSize
        );
        if (index === -1) return prev;

        const currentItem = prev[index];
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
          next.splice(index, 1);
          return next;
        }

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

  const removeFromCart = useCallback(async (id: string, size: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item._id === id && item.selectedSize === size))
    );
  }, []);

  const clearCart = useCallback(async () => {
    if (isAuthenticated()) {
      try {
        await fetch(apiUrl('/cart'), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${getAccessToken()}` },
        });
      } catch (err) {
        console.error('Failed to clear cart API', err);
      }
    }
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(GUEST_SESSION_KEY);
    setCart([]);
  }, []);

  const syncCartToDbOnLogout = useCallback(async () => {
    if (!isAuthenticated()) return;
    const token = getAccessToken();
    if (!token) return;
    try {
      const items = cart.map((item) => ({
        productId: item._id,
        size: item.selectedSize,
        quantity: item.quantity,
      }));
      if (items.length === 0) {
        await fetch(apiUrl('/cart'), {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await fetch(apiUrl('/cart/merge'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ items }),
        });
      }
    } catch (err) {
      console.error('Failed to sync cart on logout', err);
    }
  }, [cart]);

  const mergeGuestCart = useCallback(async () => {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    if (!saved) return;
    try {
      const guestCart = JSON.parse(saved);
      if (guestCart.length === 0) return;

      const items = guestCart.map((item: any) => ({
        productId: item._id,
        size: item.selectedSize,
        quantity: item.quantity,
      }));

      const res = await fetch(apiUrl('/cart/merge'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ items }),
      });

      if (res.ok) {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem(GUEST_SESSION_KEY);

        // Refresh cart from API after merge
        const updatedRes = await fetch(apiUrl('/cart'), {
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });
        if (updatedRes.ok) {
          const data = await updatedRes.json();
          const apiCart = data.items.map((item: any) => ({
            _id: item.productId._id,
            name: item.productId.name,
            price: item.productId.price,
            img_url: item.productId.img_url || item.productId.images?.[0] || '',
            selectedSize: item.size,
            quantity: item.quantity,
            stock: item.productId.stock || 0,
            supplier: item.productId.supplierId?.name,
            categoryName: item.productId.categoryId?.name,
            sizes: item.productId.sizes,
          }));
          setCart(apiCart);
        }
      }
    } catch (err) {
      console.error('Failed to merge guest cart', err);
    }
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
    mergeGuestCart,
    syncCartToDbOnLogout,
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
