import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

const CART_STORAGE_KEY = 'padel-ventas-cart';

function loadCartFromStorage() {
  try {
    const saved = localStorage.getItem(CART_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

function saveCartToStorage(items) {
  try {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving cart:', e);
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(loadCartFromStorage);
  const [isOpen, setIsOpen] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  // Persist to localStorage
  useEffect(() => {
    saveCartToStorage(items);
  }, [items]);

  const addItem = useCallback((product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          name: product.name,
          brand: product.brand,
          price: product.isOffer ? (product.offerPriceRetail || product.priceRetail) : product.priceRetail,
          priceWholesale: product.isOffer ? (product.offerPriceWholesale || product.priceWholesale) : product.priceWholesale,
          image: product.images?.[0] || '',
          quantity,
        },
      ];
    });
  }, []);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const incrementItem = useCallback((productId) => {
    setItems((prev) =>
      prev.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  const decrementItem = useCallback((productId) => {
    setItems((prev) => {
      const item = prev.find((i) => i.productId === productId);
      if (item && item.quantity <= 1) {
        return prev.filter((i) => i.productId !== productId);
      }
      return prev.map((i) =>
        i.productId === productId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const loadFromDraft = useCallback((draftItems) => {
    setItems(draftItems);
  }, []);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const subtotalWholesale = items.reduce(
    (acc, item) => acc + (item.priceWholesale || item.price) * item.quantity,
    0
  );

  const discountAmount = (subtotal * discountPercentage) / 100;
  const discountAmountWholesale = (subtotalWholesale * discountPercentage) / 100;
  const total = subtotal - discountAmount;
  const totalWholesale = subtotalWholesale - discountAmountWholesale;

  const value = {
    items,
    isOpen,
    itemCount,
    subtotal,
    subtotalWholesale,
    discountPercentage,
    setDiscountPercentage,
    discountAmount,
    discountAmountWholesale,
    total,
    totalWholesale,
    addItem,
    removeItem,
    updateQuantity,
    incrementItem,
    decrementItem,
    clearCart,
    loadFromDraft,
    openCart,
    closeCart,
    toggleCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}

export default CartContext;
