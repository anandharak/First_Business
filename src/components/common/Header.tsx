import React from 'react';
import { Shop } from '../../types';
import {
  QrCode,
  Store,
  User,
  ShoppingBag,
  Sparkles,
  ChevronDown,
  ExternalLink,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface HeaderProps {
  /** 'customer' or 'owner' – determines which UI elements are shown */
  userRole: 'customer' | 'owner';
  /** Currently active shop (always defined when a shop exists) */
  activeShop: Shop;
  /** All shops – used only for owner when they can switch shops */
  allShops: Shop[];
  /** Number of items in the customer's cart */
  cartCount: number;
  /** Called when a different shop is selected from dropdown */
  onShopChange: (shopId: string) => void;
  /** Open the QR modal (owner only) */
  onOpenQrModal: () => void;
  /** Owner opens the Register‑Shop modal */
  onOpenRegisterShop: () => void;
  /** Open the cart drawer (customer only) */
  onOpenCart: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  activeShop,
  allShops,
  cartCount,
  onShopChange,
  onOpenQrModal,
  onOpenRegisterShop,
  onOpenCart,
}) => {
  return (
    <header className="top-nav-bar">
      <div className="top-nav-inner">
        {/* Left Brand + Shop Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="brand-logo">
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span>QROrder</span>
            <span className="brand-badge">PRO</span>
          </div>

          {/* Owner can switch between their shops */}
          {userRole === 'owner' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <select
                value={activeShop.id}
                onChange={(e) => {
                  playSound('click');
                  onShopChange(e.target.value);
                }}
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid var(--border-subtle)',
                  color: '#fff',
                  padding: '6px 12px',
                  borderRadius: 20,
                  fontSize: '0.82rem',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  outline: 'none',
                }}
              >
                {allShops.map((s) => (
                  <option key={s.id} value={s.id} style={{ background: '#1e293b', color: '#fff' }}>
                    🏪 {s.name} ({s.category})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Right side – actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* QR code – owner only */}
          {userRole === 'owner' && (
            <button
              onClick={onOpenQrModal}
              className="btn btn-secondary btn-sm"
              title="View & Download Shop QR Code"
            >
              <QrCode size={15} />
              <span className="d-sm-inline" style={{ display: 'none' }}>
                Store QR
              </span>
            </button>
          )}

          {/* Cart button – customer only */}
          {userRole === 'customer' && (
            <button
              onClick={onOpenCart}
              className="btn btn-primary btn-sm"
              style={{ position: 'relative' }}
            >
              <ShoppingBag size={15} />
              <span>Cart</span>
              {cartCount > 0 && (
                <span
                  style={{
                    background: '#fff',
                    color: 'var(--primary)',
                    borderRadius: 10,
                    padding: '1px 6px',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                  }}
                >
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Register shop – owner only */}
          {userRole === 'owner' && (
            <button onClick={onOpenRegisterShop} className="btn btn-emerald btn-sm">
              + Register Shop
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
