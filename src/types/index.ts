export type ShopCategory = 'fast_food' | 'food' | 'cafe' | 'pizza' | 'clothing' | 'grocery' | 'electronics' | 'other';

export type DietaryType = 'veg' | 'non-veg' | 'vegan' | 'none';

export interface Shop {
  id: string;
  name: string;
  slug: string;
  category: ShopCategory;
  tagline: string;
  description: string;
  phone: string;
  upiId: string;
  address: string;
  tableCount: number;
  isOpen: boolean;
  bannerUrl: string;
  logoUrl?: string;
  currency: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  passwordHash?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  shopId: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  imageUrl: string;
  description: string;
  dietary?: DietaryType;
  prepTime: string; // e.g. "12-15 min"
  isAvailable: boolean;
  rating: number;
  reviewCount: number;
  tags?: string[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  instructions?: string;
}

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';
export type PaymentMethod = 'online' | 'cash';
export type PaymentStatus = 'paid' | 'pending_cash';
export type OrderStatus = 'received' | 'preparing' | 'ready' | 'completed' | 'cancelled';

export interface OrderStatusHistoryItem {
  status: OrderStatus;
  timestamp: string;
  title: string;
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  shopId: string;
  customerName: string;
  customerPhone: string;
  orderType: OrderType;
  tableOrAddress: string; // "Table 4" or address
  items: CartItem[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  statusHistory: OrderStatusHistoryItem[];
  rating?: number;
  reviewComment?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  id: string;
  shopId: string;
  orderId: string;
  customerName: string;
  rating: number; // 1 to 5
  tags: string[]; // e.g. ["Delicious Food", "Fast Service"]
  comment: string;
  dishNames: string[];
  createdAt: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order_update' | 'new_order' | 'review' | 'system';
  timestamp: string;
  orderId?: string;
}
