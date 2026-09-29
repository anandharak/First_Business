import React from 'react';
import { Shop } from '../../types';
import { CustomerInfo } from '../customer/CustomerRegistrationModal';
import {
  QrCode,
  User,
  ShoppingBag,
  Camera,
  LogOut,
  ArrowRightLeft,
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
  /** Open user profile modal (works for customer & owner) */
  onOpenProfile?: () => void;
  /** Open customer details & profile modal (backward-compat) */
  onOpenCustomerProfile?: () => void;
  /** Switch role between customer and owner */
  onSwitchRole?: (newRole: 'customer' | 'owner') => void;
  /** Owner logout handler */
  onLogout?: () => void;
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
  onOpenProfile,
  onOpenCustomerProfile,
  onSwitchRole,
  onLogout,
}) => {
  const handleOpenProfile = onOpenProfile || onOpenCustomerProfile;

  return (
    <header className="top-nav-bar">
      <div className="top-nav-inner">
        {/* Left Brand + Shop Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div className="brand-logo" style={{ cursor: 'pointer' }} onClick={handleOpenProfile}>
            <span style={{ fontSize: '1.4rem' }}>⚡</span>
            <span>QROrder</span>
            <span className="brand-badge">PRO</span>
          </div>

          {/* Role badge with instant switch button */}
          {onSwitchRole && (
            <button
              onClick={() => {
                playSound('click');
                onSwitchRole(userRole === 'owner' ? 'customer' : 'owner');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                background: userRole === 'owner' ? 'rgba(139,92,246,0.14)' : 'rgba(249,115,22,0.14)',
                border: userRole === 'owner' ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(249,115,22,0.3)',
                color: userRole === 'owner' ? '#c4b5fd' : '#fdba74',
                transition: 'all 0.2s',
              }}
              title={userRole === 'owner' ? 'Click to switch to Customer Mode' : 'Click to switch to Shop Owner Mode'}
            >
              <span>{userRole === 'owner' ? '🏪 Owner' : '🛍️ Customer'}</span>
              <ArrowRightLeft size={11} style={{ opacity: 0.8 }} />
            </button>
          )}

          {/* Owner can switch between their shops */}
          {userRole === 'owner' && activeShop && allShops.length > 0 && (
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

          {/* Profile button – visible for BOTH customer and owner */}
          {handleOpenProfile && (
            <button
              onClick={() => {
                playSound('click');
                handleOpenProfile();
              }}
              className="btn btn-secondary btn-sm"
              title="View and edit your profile and role details"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: userRole === 'owner' ? 'rgba(139,92,246,0.3)' : 'rgba(249,115,22,0.3)',
              }}
            >
              <User size={15} color={userRole === 'owner' ? '#a78bfa' : 'var(--primary)'} />
              <span>
                {customerInfo?.name
                  ? customerInfo.name.split(' ')[0]
                  : userRole === 'owner'
                  ? 'Owner Profile'
                  : 'Profile'}
              </span>
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

          {/* Logout – owner only */}
          {userRole === 'owner' && onLogout && (
            <button
              onClick={() => { playSound('click'); onLogout(); }}
              className="btn btn-sm"
              title="Log out of owner dashboard"
              style={{
                background: 'rgba(239,68,68,0.1)',
                border: '1px solid rgba(239,68,68,0.25)',
                color: '#f87171',
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 20,
              }}
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

