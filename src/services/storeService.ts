import { Shop, Product, Order, Review, OrderStatus, CartItem, PaymentMethod } from '../types';

const API_BASE = '/api';

// BroadcastChannel for cross-tab real-time sync
const broadcast = typeof window !== 'undefined' && 'BroadcastChannel' in window
  ? new BroadcastChannel('shop_platform_sync_channel')
  : null;

type ListenerCallback = (data: { type: string; payload?: unknown }) => void;
const listeners: Set<ListenerCallback> = new Set();

export function subscribeToStoreEvents(cb: ListenerCallback) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function notifySubscribers(type: string, payload?: unknown) {
  listeners.forEach((cb) => cb({ type, payload }));
  if (broadcast) {
    try {
      broadcast.postMessage({ type, payload });
    } catch {
      // ignore
    }
  }
}

if (broadcast) {
  broadcast.onmessage = (event) => {
    listeners.forEach((cb) => cb(event.data));
  };
}

const LOCAL_SHOPS_KEY = 'qrorder_local_shops';

function getLocalShops(): Shop[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_SHOPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalShop(shop: Shop) {
  if (typeof window === 'undefined') return;
  try {
    const existing = getLocalShops();
    const filtered = existing.filter((s) => s.id !== shop.id);
    localStorage.setItem(LOCAL_SHOPS_KEY, JSON.stringify([shop, ...filtered]));
  } catch {
    // ignore
  }
}

export const StoreService = {
  // Check MongoDB health
  async checkMongoHealth(): Promise<{ connected: boolean; database: string }> {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) return await res.json();
      return { connected: false, database: 'MongoDB' };
    } catch {
      return { connected: false, database: 'MongoDB' };
    }
  },

  // SHOPS (Stored in MongoDB with resilient local sync)
  async getShops(): Promise<Shop[]> {
    const localShops = getLocalShops();
    try {
      const res = await fetch(`${API_BASE}/shops`);
      if (res.ok) {
        const remoteShops: Shop[] = await res.json();
        const map = new Map<string, Shop>();
        remoteShops.forEach((s) => map.set(s.id, s));
        localShops.forEach((s) => {
          if (!map.has(s.id)) map.set(s.id, s);
        });
        return Array.from(map.values());
      }
    } catch {
      // fallback
    }
    return localShops;
  },

  async registerShop(shopData: Omit<Shop, 'id' | 'createdAt'>): Promise<Shop> {
    try {
      const res = await fetch(`${API_BASE}/shops`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(shopData),
      });
      if (res.ok) {
        const created: Shop = await res.json();
        saveLocalShop(created);
        notifySubscribers('shop_registered', created);
        return created;
      }
    } catch (err) {
      console.warn('Network or DB error while registering shop, using local fallback:', err);
    }

    // Resilient fallback so shop registration ALWAYS succeeds
    const fallbackShop: Shop = {
      ...shopData,
      id: `shop-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    saveLocalShop(fallbackShop);
    notifySubscribers('shop_registered', fallbackShop);
    return fallbackShop;
  },

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop | null> {
    try {
      const res = await fetch(`${API_BASE}/shops/${shopId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated: Shop = await res.json();
        saveLocalShop(updated);
        notifySubscribers('shop_updated', updated);
        return updated;
      }
    } catch {
      // ignore
    }
    const local = getLocalShops().find((s) => s.id === shopId);
    if (local) {
      const merged = { ...local, ...updates };
      saveLocalShop(merged);
      notifySubscribers('shop_updated', merged);
      return merged;
    }
    return null;
  },

  // PRODUCTS (Stored in MongoDB)
  async getProducts(shopId?: string): Promise<Product[]> {
    try {
      const url = shopId ? `${API_BASE}/products?shopId=${encodeURIComponent(shopId)}` : `${API_BASE}/products`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  async addProduct(productData: Omit<Product, 'id' | 'rating' | 'reviewCount'>): Promise<Product> {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    if (!res.ok) throw new Error('Failed to add product to MongoDB');
    const created: Product = await res.json();
    notifySubscribers('product_added', created);
    return created;
  },

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product | null> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const updated: Product = await res.json();
    notifySubscribers('product_updated', updated);
    return updated;
  },

  async deleteProduct(id: string): Promise<boolean> {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) return false;
    notifySubscribers('product_deleted', id);
    return true;
  },

  // ORDERS (Stored in MongoDB)
  async getOrders(shopId?: string): Promise<Order[]> {
    try {
      const url = shopId ? `${API_BASE}/orders?shopId=${encodeURIComponent(shopId)}` : `${API_BASE}/orders`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const res = await fetch(`${API_BASE}/orders/${orderId}`);
      if (res.ok) return await res.json();
      return null;
    } catch {
      return null;
    }
  },

  async createOrder(orderInput: {
    shopId: string;
    customerName: string;
    customerPhone: string;
    orderType: 'dine_in' | 'takeaway' | 'delivery';
    tableOrAddress: string;
    items: CartItem[];
    subtotal: number;
    discount: number;
    deliveryFee: number;
    tax: number;
    total: number;
    paymentMethod: PaymentMethod;
  }): Promise<Order> {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderInput),
    });
    if (!res.ok) throw new Error('Failed to create order in MongoDB');
    const created: Order = await res.json();
    notifySubscribers('order_created', created);
    return created;
  },

  async updateOrderStatus(orderId: string, newStatus: OrderStatus): Promise<Order | null> {
    const res = await fetch(`${API_BASE}/orders/${orderId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) return null;
    const updated: Order = await res.json();
    notifySubscribers('order_status_updated', updated);
    return updated;
  },

  // REVIEWS (Stored in MongoDB)
  async getReviews(shopId?: string): Promise<Review[]> {
    try {
      const url = shopId ? `${API_BASE}/reviews?shopId=${encodeURIComponent(shopId)}` : `${API_BASE}/reviews`;
      const res = await fetch(url);
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  async submitReview(reviewInput: {
    shopId: string;
    orderId: string;
    customerName: string;
    rating: number;
    tags: string[];
    comment: string;
    dishNames: string[];
  }): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(reviewInput),
    });
    if (!res.ok) throw new Error('Failed to save review in MongoDB');
    const created: Review = await res.json();
    notifySubscribers('review_submitted', created);
    return created;
  },

  // Reset database endpoint
  async resetDatabase(): Promise<void> {
    await fetch(`${API_BASE}/reset`, { method: 'POST' });
    notifySubscribers('store_reset');
  },

  // DELETE shop and cascade remove all related data
  async deleteShop(shopId: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/shops/${shopId}`, { method: 'DELETE' });
      if (res.ok) {
        // Remove from local shops cache
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('qrorder_local_shops');
            if (raw) {
              const shops: Shop[] = JSON.parse(raw);
              localStorage.setItem('qrorder_local_shops', JSON.stringify(shops.filter((s) => s.id !== shopId)));
            }
          } catch { /* ignore */ }
        }
        notifySubscribers('shop_deleted', shopId);
        return true;
      }
    } catch (err) {
      console.warn('Delete shop error:', err);
    }
    return false;
  },

  // Hash password client-side with Web Crypto SHA-256 and verify against server
  async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  },

  async verifyShopPassword(shopId: string, password: string): Promise<{ valid: boolean; shop?: Shop }> {
    try {
      const passwordHash = await StoreService.hashPassword(password);
      const res = await fetch(`${API_BASE}/shops/${shopId}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passwordHash }),
      });
      const data = await res.json();
      return { valid: data.valid === true, shop: data.shop };
    } catch {
      return { valid: false };
    }
  },
};
