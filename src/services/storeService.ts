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

  // SHOPS (Stored in MongoDB)
  async getShops(): Promise<Shop[]> {
    try {
      const res = await fetch(`${API_BASE}/shops`);
      if (res.ok) return await res.json();
      return [];
    } catch {
      return [];
    }
  },

  async registerShop(shopData: Omit<Shop, 'id' | 'createdAt'>): Promise<Shop> {
    const res = await fetch(`${API_BASE}/shops`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shopData),
    });
    if (!res.ok) throw new Error('Failed to register shop in MongoDB');
    const created: Shop = await res.json();
    notifySubscribers('shop_registered', created);
    return created;
  },

  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop | null> {
    const res = await fetch(`${API_BASE}/shops/${shopId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) return null;
    const updated: Shop = await res.json();
    notifySubscribers('shop_updated', updated);
    return updated;
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
};
