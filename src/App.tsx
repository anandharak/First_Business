import React, { useState, useEffect } from 'react';
import { Shop, Product, CartItem, Order } from './types';
import { StoreService, subscribeToStoreEvents } from './services/storeService';
import { NamasteScreen } from './components/common/NamasteScreen';
import { Header } from './components/common/Header';
import { StoreQrModal } from './components/owner/StoreQrModal';
import { ShopRegistrationModal } from './components/owner/ShopRegistrationModal';
import { AddProductModal } from './components/owner/AddProductModal';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { CustomerStorefront } from './components/customer/CustomerStorefront';
import { CustomerRegistrationModal } from './components/customer/CustomerRegistrationModal';
import type { CustomerInfo } from './components/customer/CustomerRegistrationModal';
import { CustomerShopFinder } from './components/customer/CustomerShopFinder';
import { CartAndCheckoutModal } from './components/customer/CartAndCheckoutModal';
import { LiveOrderStatus } from './components/customer/LiveOrderStatus';
import { PostMealRatingModal } from './components/customer/PostMealRatingModal';
import { playSound } from './utils/audio';
import { BellRing, Database } from 'lucide-react';

// ─── Role Persistence Keys ────────────────────────────────
const ROLE_KEY = 'qrorder_role';
const CUSTOMER_KEY = 'qrorder_customer';

type UserRole = 'customer' | 'owner' | null;

export const App: React.FC = () => {
  // ─── Role State ────────────────────────────────────────
  const [userRole, setUserRole] = useState<UserRole>(() => {
    return (localStorage.getItem(ROLE_KEY) as UserRole) || null;
  });
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(() => {
    try {
      const raw = localStorage.getItem(CUSTOMER_KEY);
      return raw ? (JSON.parse(raw) as CustomerInfo) : null;
    } catch {
      return null;
    }
  });

  // ─── Shop State ────────────────────────────────────────
  const [allShops, setAllShops] = useState<Shop[]>([]);
  const [activeShopId, setActiveShopId] = useState<string>('');
  const [tableParam, setTableParam] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isMongoConnected, setIsMongoConnected] = useState(true);

  // ─── Detect QR context from URL ───────────────────────
  const urlParams = new URLSearchParams(window.location.search);
  const urlShopSlug = urlParams.get('shop') || '';
  const urlTable = urlParams.get('table') || '';
  const isQrContext = Boolean(urlShopSlug);

  // ─── Owner modals ──────────────────────────────────────
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ─── Customer modals & state ──────────────────────────
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);

  // ─── Customer reg modal trigger ────────────────────────
  const [showCustomerReg, setShowCustomerReg] = useState(false);

  // ─── Toast ─────────────────────────────────────────────
  const [toastMessage, setToastMessage] = useState<{ title: string; body: string } | null>(null);

  const showToast = (title: string, body: string, duration = 4000) => {
    setToastMessage({ title, body });
    setTimeout(() => setToastMessage(null), duration);
  };

  // ─── Fetch shops ───────────────────────────────────────
  const fetchShops = async () => {
    try {
      const health = await StoreService.checkMongoHealth();
      setIsMongoConnected(health.connected);
      const shops = await StoreService.getShops();
      setAllShops(shops);
      if (shops.length > 0) {
        if (urlShopSlug) {
          const match = shops.find((s) => s.slug === urlShopSlug);
          if (match) {
            setActiveShopId(match.id);
            if (urlTable) setTableParam(decodeURIComponent(urlTable));
          } else {
            setActiveShopId(shops[0].id);
          }
        } else {
          setActiveShopId(shops[0].id);
        }
      }
    } catch {
      setIsMongoConnected(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // ─── Event bus ─────────────────────────────────────────
  useEffect(() => {
    const unsub = subscribeToStoreEvents((event) => {
      if (event.type === 'shop_registered' || event.type === 'shop_updated') {
        fetchShops();
      } else if (event.type === 'order_created') {
        const ord = event.payload as Order;
        if (ord && activeShop && ord.shopId === activeShop.id && userRole === 'owner') {
          playSound('new_order');
          showToast(
            `🔔 New Order ${ord.orderNumber}`,
            `${ord.customerName} — ${ord.tableOrAddress} — ${activeShop.currency}${ord.total}`
          );
        }
      } else if (event.type === 'order_status_updated') {
        const ord = event.payload as Order;
        if (ord) {
          if (activeOrder?.id === ord.id) setActiveOrder(ord);
          if (userRole === 'customer') {
            if (ord.status === 'preparing')
              showToast('👨‍🍳 Kitchen Update', `Order ${ord.orderNumber} is now being prepared!`);
            else if (ord.status === 'ready')
              showToast('🔔 Order Ready!', `Order ${ord.orderNumber} is ready — please collect!`);
          }
        }
      }
    });
    return unsub;
  }, [activeShopId, activeOrder, userRole, allShops]);

  const activeShop = allShops.find((s) => s.id === activeShopId) || allShops[0];

  // ─── Role handlers ─────────────────────────────────────
  const handleRoleSelect = (role: 'customer' | 'owner') => {
    setUserRole(role);
    localStorage.setItem(ROLE_KEY, role);
    if (role === 'customer' && !customerInfo) {
      setShowCustomerReg(true);
    } else if (role === 'owner' && allShops.length === 0) {
      setIsRegisterModalOpen(true);
    }
  };

  const handleCustomerRegistered = (info: CustomerInfo) => {
    setCustomerInfo(info);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(info));
    setShowCustomerReg(false);
  };

  // ─── Cart handlers ─────────────────────────────────────
  const handleAddToCart = (product: Product) => {
    setCart((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx].quantity += 1;
        return copy;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.product.id !== productId) return item;
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleOrderConfirmed = (newOrder: Order) => {
    setCart([]);
    setIsCartModalOpen(false);
    setActiveOrder(newOrder);
    setActiveTrackingOrderId(newOrder.id);
  };

  // ══════════════════════════════════════════════════════
  // RENDER — Loading
  // ══════════════════════════════════════════════════════
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#070b14' }}>
        <style>{`@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`}</style>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            border: '3px solid rgba(249,115,22,0.15)', borderTopColor: '#f97316',
            animation: 'spin 0.9s linear infinite', margin: '0 auto 18px auto',
          }} />
          <p style={{ color: '#fff', fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600 }}>
            Connecting to MongoDB…
          </p>
          <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: 4 }}>
            {window.location.hostname === 'localhost'
              ? 'mongodb://127.0.0.1:27017/shop_platform'
              : 'Connecting to Cloud Database…'}
          </p>
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER — Namaste (no role chosen yet)
  // ══════════════════════════════════════════════════════
  if (!userRole) {
    return (
      <>
        <NamasteScreen isQrContext={isQrContext} onSelectRole={handleRoleSelect} />
        {/* Customer reg fires right after role select */}
        {showCustomerReg && (
          <CustomerRegistrationModal
            shopName={activeShop?.name}
            onComplete={handleCustomerRegistered}
          />
        )}
        {/* Owner shop reg fires right after role select */}
        {isRegisterModalOpen && (
          <ShopRegistrationModal
            onClose={() => {
              // If owner closes without registering, keep them in owner mode
              setIsRegisterModalOpen(false);
            }}
            onRegistered={(newShop) => {
              setIsRegisterModalOpen(false);
              setAllShops([newShop]);
              setActiveShopId(newShop.id);
              setIsQrModalOpen(true);
            }}
          />
        )}
        {isQrModalOpen && activeShop && (
          <StoreQrModal
            shop={activeShop}
            onClose={() => setIsQrModalOpen(false)}
            onSimulateCustomerScan={() => setIsQrModalOpen(false)}
          />
        )}
      </>
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER — Customer: needs to register first
  // ══════════════════════════════════════════════════════
  if (userRole === 'customer' && (!customerInfo || showCustomerReg)) {
    return (
      <CustomerRegistrationModal
        shopName={activeShop?.name}
        onComplete={handleCustomerRegistered}
      />
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER — Customer: no shop selected yet → shop finder
  // ══════════════════════════════════════════════════════
  if (userRole === 'customer' && !activeShop) {
    return (
      <CustomerShopFinder
        onShopFound={(shop, table) => {
          setAllShops((prev) => (prev.find((s) => s.id === shop.id) ? prev : [...prev, shop]));
          setActiveShopId(shop.id);
          if (table) setTableParam(table);
        }}
      />
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER — Owner: no shop registered yet
  // ══════════════════════════════════════════════════════
  if (userRole === 'owner' && allShops.length === 0) {
    return (
      <>
        <div style={{ minHeight: '100vh', background: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(20px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div style={{ textAlign: 'center', animation: 'fadeUp 0.5s ease', maxWidth: 460 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.25), rgba(139,92,246,0.08))',
              border: '1.5px solid rgba(139,92,246,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 22px auto',
            }}>
              <span style={{ fontSize: '2.2rem' }}>🏪</span>
            </div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800, color: '#fff', margin: '0 0 10px 0' }}>
              Register Your Shop
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, marginBottom: 28 }}>
              You're registered as a shop owner. Set up your store to start receiving orders, generate your QR code, and manage your menu — all from one dashboard.
            </p>
            <button
              onClick={() => setIsRegisterModalOpen(true)}
              className="btn btn-primary"
              style={{ padding: '14px 32px', fontSize: '0.95rem', borderRadius: 14, margin: '0 auto' }}
            >
              🏪 Set Up My Store
            </button>
          </div>
        </div>

        {isRegisterModalOpen && (
          <ShopRegistrationModal
            onClose={() => setIsRegisterModalOpen(false)}
            onRegistered={(newShop) => {
              setIsRegisterModalOpen(false);
              setAllShops([newShop]);
              setActiveShopId(newShop.id);
              setIsQrModalOpen(true);
            }}
          />
        )}
        {isQrModalOpen && activeShop && (
          <StoreQrModal
            shop={activeShop}
            onClose={() => setIsQrModalOpen(false)}
            onSimulateCustomerScan={() => setIsQrModalOpen(false)}
          />
        )}
      </>
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER — MAIN APP (role-locked)
  // ══════════════════════════════════════════════════════
  return (
    <div className="app-layout">
      <Header
        userRole={userRole}
        activeShop={activeShop}
        allShops={userRole === 'owner' ? allShops : []}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}

        onShopChange={(id) => {
          setActiveShopId(id);
          setCart([]);
          setActiveOrder(null);
          setActiveTrackingOrderId(null);
        }}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
        onOpenCart={() => setIsCartModalOpen(true)}
      />

      {/* MongoDB status strip */}
      <div style={{
        background: isMongoConnected ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
        borderBottom: `1px solid ${isMongoConnected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}`,
        padding: '3px 16px',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
        fontSize: '0.7rem', color: isMongoConnected ? '#34d399' : '#f87171', fontWeight: 600,
      }}>
        <Database size={10} />
        {isMongoConnected
          ? `MongoDB Connected (${window.location.hostname === 'localhost' ? 'Local' : 'Cloud'})`
          : window.location.hostname === 'localhost'
          ? 'MongoDB Disconnected — Run: node server/index.js'
          : 'MongoDB Disconnected — Set MONGODB_URI in Vercel Project Settings'}
      </div>

      {/* Main content — role-locked */}
      <main style={{ flex: 1 }}>
        {userRole === 'owner' ? (
          <OwnerDashboard
            currentShop={activeShop}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
            onOpenAddProduct={(prod) => {
              setEditingProduct(prod || null);
              setIsAddProductModalOpen(true);
            }}
          />
        ) : activeTrackingOrderId ? (
          <LiveOrderStatus
            orderId={activeTrackingOrderId}
            shop={activeShop}
            onBackToMenu={() => setActiveTrackingOrderId(null)}
            onOpenRating={(ord) => setRatingOrder(ord)}
          />
        ) : (
          <CustomerStorefront
            shop={activeShop}
            tableParam={tableParam}
            cart={cart}
            activeOrder={activeOrder}
            onAddToCart={handleAddToCart}
            onUpdateQuantity={handleUpdateQuantity}
            onOpenCart={() => setIsCartModalOpen(true)}
            onOpenLiveOrder={(orderId) => setActiveTrackingOrderId(orderId)}
          />
        )}
      </main>

      {/* Toast notifications */}
      {toastMessage && (
        <div className="toast-container">
          <div className="toast">
            <div style={{ background: 'rgba(249,115,22,0.2)', padding: 8, borderRadius: '50%', color: '#f97316' }}>
              <BellRing size={18} />
            </div>
            <div>
              <h5 style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0, color: '#fff' }}>{toastMessage.title}</h5>
              <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>{toastMessage.body}</p>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modals ─── */}
      {isQrModalOpen && activeShop && (
        <StoreQrModal
          shop={activeShop}
          onClose={() => setIsQrModalOpen(false)}
          onSimulateCustomerScan={() => setIsQrModalOpen(false)}
        />
      )}

      {isRegisterModalOpen && (
        <ShopRegistrationModal
          onClose={() => setIsRegisterModalOpen(false)}
          onRegistered={(newShop) => {
            setIsRegisterModalOpen(false);
            setAllShops((prev) => {
              const exists = prev.find((s) => s.id === newShop.id);
              return exists ? prev : [newShop, ...prev];
            });
            setActiveShopId(newShop.id);
            setIsQrModalOpen(true);
          }}
        />
      )}

      {isAddProductModalOpen && activeShop && (
        <AddProductModal
          shop={activeShop}
          editingProduct={editingProduct}
          onClose={() => { setIsAddProductModalOpen(false); setEditingProduct(null); }}
          onProductAdded={() => { setIsAddProductModalOpen(false); setEditingProduct(null); }}
        />
      )}

      {isCartModalOpen && activeShop && (
        <CartAndCheckoutModal
          cart={cart}
          shop={activeShop}
          tableParam={tableParam}
          onClose={() => setIsCartModalOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onOrderConfirmed={handleOrderConfirmed}
        />
      )}

      {ratingOrder && activeShop && (
        <PostMealRatingModal
          order={ratingOrder}
          shop={activeShop}
          onClose={() => setRatingOrder(null)}
          onSubmitted={() => setRatingOrder(null)}
        />
      )}
    </div>
  );
};

export default App;
