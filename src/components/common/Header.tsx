import React from 'react';
import { Shop } from '../../types';
import { CustomerInfo } from '../customer/CustomerRegistrationModal';
import {
  QrCode,
  User,
  ShoppingBag,
  Camera,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface HeaderProps {
  /** 'customer' or 'owner' – determines which UI elements are shown */
  userRole: 'customer' | 'owner';
  /** Currently active shop (always defined when a shop exists) */
  activeShop?: Shop;
  /** All shops – used only for owner when they can switch shops */
  allShops: Shop[];
  /** Number of items in the customer's cart */
  cartCount: number;
  /** Customer identity info */
  customerInfo?: CustomerInfo | null;
  /** Called when a different shop is selected from dropdown */
  onShopChange: (shopId: string) => void;
  /** Open the QR modal (owner only) */
  onOpenQrModal: () => void;
  /** Owner opens the Register‑Shop modal */
  onOpenRegisterShop: () => void;
  /** Open the cart drawer (customer only) */
  onOpenCart: () => void;
  /** Open customer QR camera scanner (customer only) */
  onOpenScanner?: () => void;
  /** Open customer details & profile modal (customer only) */
  onOpenCustomerProfile?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userRole,
  activeShop,
  allShops,
  cartCount,
  customerInfo,
  onShopChange,
  onOpenQrModal,
  onOpenRegisterShop,
  onOpenCart,
  onOpenScanner,
  onOpenCustomerProfile,
}) => {
  return (
    <header className="top-nav-bar">
      <div className="top-nav-inner">
        {/* Left Brand + Shop Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className="brand-logo">
            <span style={{ fontSize: '1.5rem' }}>⚡</span>
            <span>QROrder</span>
            <span className="brand-badge">PRO</span>
          </div>

          {/* Owner can switch between their shops */}
          {userRole === 'owner' && activeShop && (
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

          {/* Customer active shop indicator badge */}
          {userRole === 'customer' && activeShop && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 12px',
                borderRadius: 20,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.8rem',
                color: '#e2e8f0',
                fontWeight: 600,
              }}
            >
              <span>🏪</span>
              <span>{activeShop.name}</span>
            </div>
          )}
        </div>

        {/* Right side – actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Customer: Scan QR button */}
          {userRole === 'customer' && onOpenScanner && (
            <button
              onClick={onOpenScanner}
              className="btn btn-secondary btn-sm"
              title="Scan any shop QR code or table standee"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Camera size={15} color="var(--primary)" />
              <span>Scan QR</span>
            </button>
          )}

          {/* Customer: My Details / Profile */}
          {userRole === 'customer' && onOpenCustomerProfile && (
            <button
              onClick={onOpenCustomerProfile}
              className="btn btn-secondary btn-sm"
              title="View and edit your registered customer details"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <User size={15} />
              <span>{customerInfo?.name ? customerInfo.name.split(' ')[0] : 'My Details'}</span>
            </button>
          )}

          {/* QR code – owner only */}
          {userRole === 'owner' && (
            <button
              onClick={onOpenQrModal}
              className="btn btn-secondary btn-sm"
              title="View & Download Shop QR Code"
            >
              <QrCode size={15} />
              <span>Store QR</span>
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
