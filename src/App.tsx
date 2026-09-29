import React, { useState, useEffect } from 'react';
import { Shop, Product, CartItem, Order } from './types';
import { StoreService, subscribeToStoreEvents } from './services/storeService';
import { NamasteScreen } from './components/common/NamasteScreen';
import { Header } from './components/common/Header';
import { StoreQrModal } from './components/owner/StoreQrModal';
import { ShopRegistrationModal } from './components/owner/ShopRegistrationModal';
import { OwnerLoginModal } from './components/owner/OwnerLoginModal';
import { AddProductModal } from './components/owner/AddProductModal';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { CustomerStorefront } from './components/customer/CustomerStorefront';
import { CustomerRegistrationModal } from './components/customer/CustomerRegistrationModal';
import type { CustomerInfo } from './components/customer/CustomerRegistrationModal';
import { CustomerShopFinder } from './components/customer/CustomerShopFinder';
import { CartAndCheckoutModal } from './components/customer/CartAndCheckoutModal';
import { LiveOrderStatus } from './components/customer/LiveOrderStatus';
import { PostMealRatingModal } from './components/customer/PostMealRatingModal';
import { CustomerQrScannerModal } from './components/customer/CustomerQrScannerModal';
import { UserProfileModal } from './components/common/UserProfileModal';
import { playSound } from './utils/audio';
import { BellRing, Database } from 'lucide-react';

// ─── Persistence Keys ────────────────────────────────────
const ROLE_KEY = 'qrorder_role';
const CUSTOMER_KEY = 'qrorder_customer';
/** IDs of shops THIS owner device registered — scoped to this browser */
const OWNER_SHOP_IDS_KEY = 'qrorder_owner_shop_ids';

type UserRole = 'customer' | 'owner' | null;

/** Read / write the set of shop IDs owned by this device */
function getOwnerShopIds(): string[] {
  try {
    const raw = localStorage.getItem(OWNER_SHOP_IDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
function addOwnerShopId(id: string) {
  try {
    const existing = getOwnerShopIds();
    if (!existing.includes(id)) {
      localStorage.setItem(OWNER_SHOP_IDS_KEY, JSON.stringify([id, ...existing]));
    }
  } catch {
    // ignore
  }
}

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
  /** All shops fetched from DB / local cache */
  const [allShops, setAllShops] = useState<Shop[]>([]);
  /** Owner-specific: shops registered by this device */
  const [ownerShops, setOwnerShops] = useState<Shop[]>([]);
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
  const [isOwnerLoginModalOpen, setIsOwnerLoginModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // ─── Customer modals & state ──────────────────────────
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [activeTrackingOrderId, setActiveTrackingOrderId] = useState<string | null>(null);
  const [ratingOrder, setRatingOrder] = useState<Order | null>(null);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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

      // Rebuild ownerShops from fetched shops using saved IDs
      const ownedIds = getOwnerShopIds();
      if (ownedIds.length > 0) {
        const owned = shops.filter((s) => ownedIds.includes(s.id));
        // Also include any locally cached shops that might not be in DB yet
        const ownedSet = new Set(owned.map((s) => s.id));
        const localOnly = shops.filter((s) => !ownedSet.has(s.id) && ownedIds.includes(s.id));
        setOwnerShops([...owned, ...localOnly]);
      }

      if (shops.length > 0) {
        if (urlShopSlug) {
          const match = shops.find((s) => s.slug === urlShopSlug);
          if (match) {
            setActiveShopId(match.id);
            if (urlTable) setTableParam(decodeURIComponent(urlTable));
          } else {
            setActiveShopId(shops[0].id);
          }
        } else if (!activeShopId) {
          // For owners: prefer their own shop
          const ownedIds = getOwnerShopIds();
          const firstOwned = shops.find((s) => ownedIds.includes(s.id));
          setActiveShopId(firstOwned?.id || shops[0].id);
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

  // ─── For owner: derived list of their own shops ───────
  const myOwnerShops = ownerShops.length > 0 ? ownerShops : [];
  /** True when owner has at least one registered shop on this device */
  const ownerHasShops = userRole === 'owner' && myOwnerShops.length > 0;
  /** The active shop for owner (only from their own shops) */
  const ownerActiveShop = myOwnerShops.find((s) => s.id === activeShopId) || myOwnerShops[0];

  // ─── Role handlers ─────────────────────────────────────
  const handleRoleSelect = (role: 'customer' | 'owner') => {
    setUserRole(role);
    localStorage.setItem(ROLE_KEY, role);
    if (role === 'customer') {
      if (!customerInfo) {
        setShowCustomerReg(true);
      }
    } else if (role === 'owner') {
      const ownedIds = getOwnerShopIds();
      if (ownedIds.length === 0) {
        // No shops registered yet — go straight to registration
        setIsRegisterModalOpen(true);
      } else {
        // Has saved shops — must verify password to log in
        setIsOwnerLoginModalOpen(true);
      }
    }
  };

  const handleSwitchRole = (newRole: 'customer' | 'owner') => {
    setUserRole(newRole);
    localStorage.setItem(ROLE_KEY, newRole);
    if (newRole === 'owner') {
      const ownedIds = getOwnerShopIds();
      if (ownedIds.length === 0) {
        setIsRegisterModalOpen(true);
      } else if (ownerShops.length === 0) {
        setIsOwnerLoginModalOpen(true);
      }
    }
    showToast(
      newRole === 'owner' ? '🏪 Shop Owner Mode' : '🛍️ Customer Mode',
      newRole === 'owner'
        ? 'Switched to owner dashboard & store management.'
        : 'Switched to customer storefront & ordering.'
    );
  };

  const handleOwnerLoginSuccess = (shop: Shop) => {
    setIsOwnerLoginModalOpen(false);
    // Rebuild ownerShops from all shops
    const ownedIds = getOwnerShopIds();
    const owned = allShops.filter((s) => ownedIds.includes(s.id));
    const inOwned = owned.find((s) => s.id === shop.id);
    if (!inOwned) {
      // Make sure this shop is tracked
      addOwnerShopId(shop.id);
      setAllShops((prev) => (prev.find((s) => s.id === shop.id) ? prev : [shop, ...prev]));
      setOwnerShops((prev) => (prev.find((s) => s.id === shop.id) ? prev : [shop, ...prev]));
    } else {
      setOwnerShops(owned);
    }
    setActiveShopId(shop.id);
    showToast(`🏪 Welcome back!`, `Logged in to ${shop.name}`);
  };

  const handleOwnerLogout = () => {
    // Clear role but keep shop IDs so they can log back in with password
    localStorage.removeItem(ROLE_KEY);
    setUserRole(null);
    setOwnerShops([]);
    setActiveShopId('');
    showToast('👋 Logged out', 'See you soon! Log back in with your Shop ID & Password.');
  };

  const handleDeleteAccount = async (shopId: string) => {
    // Remove from owned IDs
    try {
      const existing = getOwnerShopIds().filter((id) => id !== shopId);
      localStorage.setItem(OWNER_SHOP_IDS_KEY, JSON.stringify(existing));
      // Also remove from local shop cache
      const raw = localStorage.getItem('qrorder_local_shops');
      if (raw) {
        const shops: Shop[] = JSON.parse(raw);
        localStorage.setItem('qrorder_local_shops', JSON.stringify(shops.filter((s) => s.id !== shopId)));
      }
    } catch { /* ignore */ }

    // If no more shops, reset fully
    const remaining = getOwnerShopIds();
    if (remaining.length === 0) {
      localStorage.removeItem(ROLE_KEY);
      setUserRole(null);
      setOwnerShops([]);
      setAllShops((prev) => prev.filter((s) => s.id !== shopId));
      setActiveShopId('');
      showToast('🗑️ Shop Deleted', 'Your shop and all data has been permanently removed.');
    } else {
      setOwnerShops((prev) => prev.filter((s) => s.id !== shopId));
      setAllShops((prev) => prev.filter((s) => s.id !== shopId));
      setActiveShopId(remaining[0]);
      showToast('🗑️ Shop Deleted', 'Shop removed. Switch to another shop or register a new one.');
    }
  };

  const handleCustomerRegistered = (info: CustomerInfo) => {
    setCustomerInfo(info);
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify(info));
    setShowCustomerReg(false);
    showToast(`👋 Welcome ${info.name}!`, 'Scan a shop QR code or browse the store below.');
  };

  const handleShopRegistered = (newShop: Shop) => {
    // Track this shop as owned by this device
    addOwnerShopId(newShop.id);
    setIsRegisterModalOpen(false);
    setAllShops((prev) => {
      const exists = prev.find((s) => s.id === newShop.id);
      return exists ? prev : [newShop, ...prev];
    });
    setOwnerShops((prev) => {
      const exists = prev.find((s) => s.id === newShop.id);
      return exists ? prev : [newShop, ...prev];
    });
    setActiveShopId(newShop.id);
    setIsQrModalOpen(true);
  };

  const handleShopSelectedFromScanner = (shop: Shop, table?: string) => {
    setAllShops((prev) => (prev.find((s) => s.id === shop.id) ? prev : [...prev, shop]));
    setActiveShopId(shop.id);
    if (table) setTableParam(table);
    setCart([]);
    setActiveOrder(null);
    setActiveTrackingOrderId(null);
    showToast(`🏪 Connected to ${shop.name}`, `Table: ${table || 'Counter'}`);
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
            Loading your experience…
          </p>
          <p style={{ color: '#334155', fontSize: '0.78rem', marginTop: 4 }}>Just a moment…</p>
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
        {/* Customer reg (non-blocking, can skip or close) */}
        {showCustomerReg && (
          <CustomerRegistrationModal
            shopName={activeShop?.name}
            onComplete={handleCustomerRegistered}
            onClose={() => setShowCustomerReg(false)}
            onSkip={() => setShowCustomerReg(false)}
          />
        )}
        {/* Owner shop reg fires right after role select */}
        {isRegisterModalOpen && (
          <ShopRegistrationModal
            onClose={() => {
              setIsRegisterModalOpen(false);
              // If they cancel registration, reset role
              localStorage.removeItem(ROLE_KEY);
              setUserRole(null);
            }}
            onRegistered={handleShopRegistered}
          />
        )}
        {/* Owner login gate — when device has saved shop IDs */}
        {isOwnerLoginModalOpen && (
          <OwnerLoginModal
            knownShopIds={getOwnerShopIds()}
            onLoginSuccess={handleOwnerLoginSuccess}
            onClose={() => {
              setIsOwnerLoginModalOpen(false);
              localStorage.removeItem(ROLE_KEY);
              setUserRole(null);
            }}
            onRegisterNewShop={() => {
              setIsOwnerLoginModalOpen(false);
              setIsRegisterModalOpen(true);
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
  // RENDER — Customer: no shop selected yet → shop finder
  // ══════════════════════════════════════════════════════
  if (userRole === 'customer' && !activeShop) {
    return (
      <div className="app-layout">
        <Header
          userRole={userRole}
          activeShop={undefined}
          allShops={[]}
          cartCount={0}
          customerInfo={customerInfo}
          onShopChange={() => {}}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
          onOpenCart={() => setIsCartModalOpen(true)}
          onOpenScanner={() => setIsScannerModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onSwitchRole={handleSwitchRole}
          onLogout={() => {
            localStorage.removeItem(ROLE_KEY);
            setUserRole(null);
          }}
        />
        <CustomerShopFinder
          onShopFound={(shop, table) => {
            handleShopSelectedFromScanner(shop, table);
          }}
          onOpenScanner={() => setIsScannerModalOpen(true)}
        />
        {isScannerModalOpen && (
          <CustomerQrScannerModal
            onClose={() => setIsScannerModalOpen(false)}
            onShopSelected={(shop, table) => handleShopSelectedFromScanner(shop, table)}
          />
        )}
        {showCustomerReg && (
          <CustomerRegistrationModal
            shopName={undefined}
            onComplete={handleCustomerRegistered}
            onClose={() => setShowCustomerReg(false)}
            onSkip={() => setShowCustomerReg(false)}
          />
        )}
        {isProfileModalOpen && (
          <UserProfileModal
            userRole={userRole}
            customerInfo={customerInfo}
            activeShop={undefined}
            allShops={allShops}
            onClose={() => setIsProfileModalOpen(false)}
            onUpdateCustomerInfo={(updated) => {
              setCustomerInfo(updated);
              localStorage.setItem(CUSTOMER_KEY, JSON.stringify(updated));
              showToast('👤 Profile Updated', `Saved details for ${updated.name}`);
            }}
            onSwitchRole={handleSwitchRole}
            onOpenScanner={() => setIsScannerModalOpen(true)}
            onResetRole={() => {
              localStorage.removeItem(ROLE_KEY);
              setUserRole(null);
            }}
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER — Owner: no shop registered from this device yet
  // ══════════════════════════════════════════════════════
  if (userRole === 'owner' && !ownerHasShops) {
    return (
      <div className="app-layout">
        <Header
          userRole={userRole}
          activeShop={undefined}
          allShops={[]}
          cartCount={0}
          customerInfo={customerInfo}
          onShopChange={() => {}}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
          onOpenCart={() => setIsCartModalOpen(true)}
          onOpenProfile={() => setIsProfileModalOpen(true)}
          onSwitchRole={handleSwitchRole}
          onLogout={handleOwnerLogout}
        />
        <div style={{ minHeight: 'calc(100vh - 64px)', background: '#070b14', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
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
              Set up your store to generate table QR codes, build your menu and start receiving dine-in orders from customers — just like Burger King kiosks, but digital.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="btn btn-primary"
                style={{ padding: '14px 28px', fontSize: '0.95rem', borderRadius: 14 }}
              >
                🏪 Set Up My Store
              </button>
              <button
                onClick={() => handleSwitchRole('customer')}
                className="btn btn-secondary"
                style={{ padding: '14px 24px', fontSize: '0.92rem', borderRadius: 14 }}
              >
                🛍️ Switch to Customer Mode
              </button>
            </div>
          </div>
        </div>

        {isRegisterModalOpen && (
          <ShopRegistrationModal
            onClose={() => setIsRegisterModalOpen(false)}
            onRegistered={handleShopRegistered}
          />
        )}
        {isProfileModalOpen && (
          <UserProfileModal
            userRole={userRole}
            customerInfo={customerInfo}
            activeShop={undefined}
            allShops={myOwnerShops}
            onClose={() => setIsProfileModalOpen(false)}
            onUpdateCustomerInfo={(updated) => {
              setCustomerInfo(updated);
              localStorage.setItem(CUSTOMER_KEY, JSON.stringify(updated));
              showToast('👤 Profile Updated', `Saved details for ${updated.name}`);
            }}
            onSwitchRole={handleSwitchRole}
            onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
            onResetRole={() => {
              localStorage.removeItem(ROLE_KEY);
              setUserRole(null);
            }}
          />
        )}
      </div>
    );
  }

  // ══════════════════════════════════════════════════════
  // RENDER — MAIN APP
  // ══════════════════════════════════════════════════════
  const displayShop = userRole === 'owner' ? ownerActiveShop : activeShop;

  return (
    <div className="app-layout">
      <Header
        userRole={userRole}
        activeShop={displayShop}
        allShops={userRole === 'owner' ? myOwnerShops : []}
        cartCount={cart.reduce((s, i) => s + i.quantity, 0)}
        customerInfo={customerInfo}
        onShopChange={(id) => {
          setActiveShopId(id);
          setCart([]);
          setActiveOrder(null);
          setActiveTrackingOrderId(null);
        }}
        onOpenQrModal={() => setIsQrModalOpen(true)}
        onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
        onOpenCart={() => setIsCartModalOpen(true)}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onSwitchRole={handleSwitchRole}
        onLogout={userRole === 'owner' ? handleOwnerLogout : undefined}
      />

      {/* DB status: tiny dot bottom-right, only when disconnected */}
      {!isMongoConnected && (
        <div style={{
          position: 'fixed', bottom: 12, right: 12, zIndex: 9999,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 20, padding: '4px 10px',
          fontSize: '0.68rem', color: '#f87171', fontWeight: 600,
          pointerEvents: 'none',
        }}>
          <Database size={10} />
          DB Offline
        </div>
      )}

      {/* Main content */}
      <main style={{ flex: 1 }}>
        {userRole === 'owner' ? (
          <OwnerDashboard
            currentShop={displayShop!}
            onOpenQrModal={() => setIsQrModalOpen(true)}
            onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
            onOpenAddProduct={(prod) => {
              setEditingProduct(prod || null);
              setIsAddProductModalOpen(true);
            }}
            onDeleteAccount={handleDeleteAccount}
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
      {isQrModalOpen && displayShop && (
        <StoreQrModal
          shop={displayShop}
          onClose={() => setIsQrModalOpen(false)}
          onSimulateCustomerScan={() => setIsQrModalOpen(false)}
        />
      )}

      {isRegisterModalOpen && (
        <ShopRegistrationModal
          onClose={() => setIsRegisterModalOpen(false)}
          onRegistered={handleShopRegistered}
        />
      )}

      {isAddProductModalOpen && displayShop && (
        <AddProductModal
          shop={displayShop}
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

      {/* Customer QR Scanner Modal */}
      {isScannerModalOpen && (
        <CustomerQrScannerModal
          onClose={() => setIsScannerModalOpen(false)}
          onShopSelected={(shop, table) => handleShopSelectedFromScanner(shop, table)}
        />
      )}

      {/* User Profile Modal (Customer & Owner) */}
      {isProfileModalOpen && (
        <UserProfileModal
          userRole={userRole}
          customerInfo={customerInfo}
          activeShop={displayShop}
          allShops={userRole === 'owner' ? myOwnerShops : allShops}
          onClose={() => setIsProfileModalOpen(false)}
          onUpdateCustomerInfo={(updated) => {
            setCustomerInfo(updated);
            localStorage.setItem(CUSTOMER_KEY, JSON.stringify(updated));
            showToast('👤 Profile Updated', `Saved details for ${updated.name}`);
          }}
          onSwitchRole={handleSwitchRole}
          onOpenScanner={() => setIsScannerModalOpen(true)}
          onViewOrder={(orderId) => setActiveTrackingOrderId(orderId)}
          onOpenQrModal={() => setIsQrModalOpen(true)}
          onOpenRegisterShop={() => setIsRegisterModalOpen(true)}
          onResetRole={() => {
            localStorage.removeItem(ROLE_KEY);
            setUserRole(null);
          }}
          onSelectShop={(id) => setActiveShopId(id)}
        />
      )}

      {/* Customer Registration Modal (non-blocking overlay) */}
      {showCustomerReg && (
        <CustomerRegistrationModal
          shopName={activeShop?.name}
          onComplete={handleCustomerRegistered}
          onClose={() => setShowCustomerReg(false)}
          onSkip={() => setShowCustomerReg(false)}
        />
      )}
    </div>
  );
};

export default App;
