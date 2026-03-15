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
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'pht_cart';
const GUEST_SESSION_KEY = 'pht_guest_session_at';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (!isAuthenticated()) {
      try {
        const sessionTime = localStorage.getItem(GUEST_SESSION_KEY);
        if (sessionTime) {
          const age = Date.now() - parseInt(sessionTime, 10);
          if (age > 24 * 60 * 60 * 1000) { // 24 hours
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
    }
    return [];
  });

  const [showCartPopup, setShowCartPopup] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Fetch cart from API on load or when authentication changes
  useEffect(() => {
    let isMounted = true;
    const fetchCart = async () => {
      if (isAuthenticated()) {
        try {
          const res = await fetch(apiUrl('/cart'), {
            headers: {
              Authorization: `Bearer ${getAccessToken()}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (isMounted && data.items) {
              // Transform API response to CartItem[]
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
          console.error('Failed to fetch cart:', err);
        }
      } else {
        // For guest, try to load from localStorage
        try {
          const sessionTime = localStorage.getItem(GUEST_SESSION_KEY);
          if (sessionTime) {
            const age = Date.now() - parseInt(sessionTime, 10);
            if (age > 24 * 60 * 60 * 1000) {
              localStorage.removeItem(CART_STORAGE_KEY);
              localStorage.removeItem('pht_favorites');
              localStorage.removeItem(GUEST_SESSION_KEY);
              if (isMounted) setCart([]);
              return;
            }
          }
          const saved = localStorage.getItem(CART_STORAGE_KEY);
          if (isMounted) {
            if (!saved) {
              setCart([]);
            } else {
              const parsed = JSON.parse(saved);
              setCart(parsed.map((item: any) => ({
                ...item,
                price: Number(item.price),
                quantity: Number(item.quantity),
              })));
            }
          }
        } catch {
          if (isMounted) setCart([]);
        }
      }
      if (isMounted) setIsInitialized(true);
    };

    fetchCart();

    const handleAuthChange = () => {
      fetchCart();
    };

    window.addEventListener('auth-token-set', handleAuthChange);
    return () => {
      isMounted = false;
      window.removeEventListener('auth-token-set', handleAuthChange);
    };
  }, []);

  // Persist to localStorage for guests
  useEffect(() => {
    if (isInitialized && !isAuthenticated()) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        // Set guest session timestamp if not exists
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

      if (isAuthenticated()) {
        try {
          const res = await fetch(apiUrl('/cart/items'), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: JSON.stringify({
              productId: product._id,
              size: sizeKey,
              quantity,
            }),
          });
          if (!res.ok) throw new Error('Failed to add to cart API');
        } catch (err) {
          console.error(err);
        }
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

    if (isAuthenticated()) {
      try {
        if (newQuantity === 0) {
          await fetch(apiUrl(`/cart/items/${id}`), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: JSON.stringify({ size }),
          });
        } else {
          await fetch(apiUrl(`/cart/items/${id}`), {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${getAccessToken()}`,
            },
            body: JSON.stringify({ size, quantity: newQuantity }),
          });
        }
      } catch (err) {
        console.error('Failed to update quantity API', err);
      }
    }

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

      if (isAuthenticated()) {
        try {
          const currentItem = cart.find(c => c._id === id && c.selectedSize === oldSize);
          if (currentItem) {
            await fetch(apiUrl(`/cart/items/${id}`), {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAccessToken()}`,
              },
              body: JSON.stringify({ size: oldSize }),
            });
            await fetch(apiUrl('/cart/items'), {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${getAccessToken()}`,
              },
              body: JSON.stringify({
                productId: id,
                size: newSize,
                quantity: currentItem.quantity,
              }),
            });
          }
        } catch (err) {
          console.error('Failed to update size API', err);
        }
      }

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
    [cart]
  );

  const removeFromCart = useCallback(async (id: string, size: string) => {
    if (isAuthenticated()) {
      try {
        await fetch(apiUrl(`/cart/items/${id}`), {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${getAccessToken()}`,
          },
          body: JSON.stringify({ size }),
        });
      } catch (err) {
        console.error('Failed to remove item API', err);
      }
    }

    setCart((prev) =>
      prev.filter((item) => !(item._id === id && item.selectedSize === size))
    );
  }, []);

  const clearCart = useCallback(async () => {
    if (isAuthenticated()) {
      try {
        await fetch(apiUrl('/cart'), {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${getAccessToken()}`,
          },
        });
      } catch (err) {
        console.error('Failed to clear cart API', err);
      }
    } else {
      localStorage.removeItem(CART_STORAGE_KEY);
      localStorage.removeItem(GUEST_SESSION_KEY);
    }
    setCart([]);
  }, []);

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
