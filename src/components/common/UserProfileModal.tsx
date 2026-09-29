import React, { useState, useEffect } from 'react';
import { CustomerInfo } from '../customer/CustomerRegistrationModal';
import { Shop, Order } from '../../types';
import { StoreService } from '../../services/storeService';
import {
  User,
  Phone,
  Store,
  Clock,
  CheckCircle,
  X,
  Edit2,
  Save,
  QrCode,
  LogOut,
  ShoppingBag,
  ArrowRightLeft,
  Sparkles,
  Plus,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

export interface UserProfileModalProps {
  userRole: 'customer' | 'owner' | null;
  customerInfo: CustomerInfo | null;
  activeShop?: Shop;
  allShops: Shop[];
  onClose: () => void;
  onUpdateCustomerInfo: (info: CustomerInfo) => void;
  onSwitchRole: (newRole: 'customer' | 'owner') => void;
  onOpenScanner?: () => void;
  onViewOrder?: (orderId: string) => void;
  onOpenQrModal?: () => void;
  onOpenRegisterShop?: () => void;
  onResetRole?: () => void;
  onSelectShop?: (shopId: string) => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  userRole,
  customerInfo,
  activeShop,
  allShops,
  onClose,
  onUpdateCustomerInfo,
  onSwitchRole,
  onOpenScanner,
  onViewOrder,
  onOpenQrModal,
  onOpenRegisterShop,
  onResetRole,
  onSelectShop,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(customerInfo?.name || '');
  const [phone, setPhone] = useState(customerInfo?.phone || '');
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Keep state in sync with customerInfo changes
  useEffect(() => {
    if (customerInfo) {
      setName(customerInfo.name);
      setPhone(customerInfo.phone);
    }
  }, [customerInfo]);

  // Load orders for customer
  useEffect(() => {
    if (activeShop && customerInfo) {
      StoreService.getOrders(activeShop.id).then((all) => {
        const myOrders = all.filter(
          (o) =>
            o.customerPhone === customerInfo.phone ||
            o.customerName.toLowerCase() === customerInfo.name.toLowerCase()
        );
        setOrders(myOrders);
      });
    }
  }, [activeShop, customerInfo]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    playSound('success');
    const updated: CustomerInfo = {
      name: name.trim(),
      phone: phone.trim(),
    };
    onUpdateCustomerInfo(updated);
    setIsEditing(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const displayName = customerInfo?.name || (userRole === 'owner' ? (activeShop?.name ? `${activeShop.name} Owner` : 'Shop Owner') : 'Guest User');
  const displayPhone = customerInfo?.phone || (userRole === 'owner' ? activeShop?.phone : '') || '';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('') || (userRole === 'owner' ? '🏪' : '👤');

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: 500,
          width: '94%',
          maxHeight: '90vh',
          overflowY: 'auto',
          borderRadius: 24,
          background: 'linear-gradient(170deg, #0d1527 0%, #070b14 100%)',
          border: '1.5px solid rgba(255,255,255,0.08)',
          boxShadow: '0 30px 90px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: userRole === 'owner'
                  ? 'linear-gradient(135deg, #8b5cf6, #6366f1)'
                  : 'linear-gradient(135deg, #f97316, #ea580c)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1.1rem',
                boxShadow: userRole === 'owner'
                  ? '0 6px 20px rgba(139,92,246,0.3)'
                  : '0 6px 20px rgba(249,115,22,0.3)',
              }}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: '#fff' }}>
                  {displayName}
                </h3>
                <span
                  style={{
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: userRole === 'owner' ? 'rgba(139,92,246,0.18)' : 'rgba(249,115,22,0.18)',
                    color: userRole === 'owner' ? '#a78bfa' : '#fb923c',
                    border: userRole === 'owner' ? '1px solid rgba(139,92,246,0.35)' : '1px solid rgba(249,115,22,0.35)',
                  }}
                >
                  {userRole === 'owner' ? '🏪 Shop Owner' : '🛍️ Customer'}
                </span>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: '2px 0 0 0' }}>
                {displayPhone ? `📞 ${displayPhone}` : 'No phone number linked'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              width: 32,
              height: 32,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
            }}
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {/* Saved notification */}
          {savedSuccess && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                color: '#34d399',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle size={16} /> Profile saved successfully!
            </div>
          )}

          {/* ─── ROLE SWITCHER CARD (NO COMPULSION) ─── */}
          <div
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 16,
              padding: '16px 18px',
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700 }}>
                Active Mode
              </div>
              <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', marginTop: 2 }}>
                {userRole === 'owner' ? '🏪 Shop Owner Mode' : '🛍️ Customer Mode'}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                {userRole === 'owner'
                  ? 'Manage your store, menu, and customer orders'
                  : 'Scan store QR codes, browse menus, and order'}
              </div>
            </div>

            <button
              onClick={() => {
                playSound('click');
                onClose();
                onSwitchRole(userRole === 'owner' ? 'customer' : 'owner');
              }}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: 10,
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                borderColor: userRole === 'owner' ? 'rgba(249,115,22,0.4)' : 'rgba(139,92,246,0.4)',
                color: userRole === 'owner' ? '#f97316' : '#a78bfa',
              }}
              title={userRole === 'owner' ? 'Switch to Customer View' : 'Switch to Shop Owner View'}
            >
              <ArrowRightLeft size={14} />
              <span>{userRole === 'owner' ? 'Switch to Customer' : 'Switch to Owner'}</span>
            </button>
          </div>

          {/* ─── PROFILE IDENTITY FORM / DISPLAY ─── */}
          {!isEditing ? (
            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 20,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 700, marginBottom: 4 }}>
                    Contact Details
                  </div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
                    {customerInfo?.name || (userRole === 'owner' ? (activeShop?.name || 'Shop Owner') : 'Guest Customer')}
                  </h4>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: '#94a3b8',
                      fontSize: '0.85rem',
                    }}
                  >
                    <Phone size={14} />
                    <span>{displayPhone || 'No phone number saved yet'}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    playSound('click');
                    setIsEditing(true);
                  }}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5 }}
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>

              {!customerInfo && userRole === 'customer' && (
                <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(249,115,22,0.08)', borderRadius: 8, border: '1px solid rgba(249,115,22,0.2)', fontSize: '0.78rem', color: '#fdba74' }}>
                  💡 You are browsing as a guest. Click <strong>Edit</strong> to save your name &amp; phone for quick one-click orders.
                </div>
              )}
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1.5px solid rgba(249,115,22,0.4)',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 20,
              }}
            >
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', marginBottom: 14 }}>
                Update Your Details
              </div>

              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                />
              </div>

              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary btn-sm">
                  <Save size={14} /> Save Profile
                </button>
              </div>
            </form>
          )}

          {/* ─── ROLE-SPECIFIC SECTIONS ─── */}
          {userRole === 'customer' ? (
            <>
              {/* Connected Shop Banner */}
              {activeShop && (
                <div
                  style={{
                    background: 'rgba(249, 115, 22, 0.07)',
                    border: '1px solid rgba(249, 115, 22, 0.22)',
                    borderRadius: 14,
                    padding: '14px 16px',
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Store size={20} color="var(--primary)" />
                    <div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase' }}>
                        Current Connected Store
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                        {activeShop.name}
                      </div>
                    </div>
                  </div>

                  {onOpenScanner && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenScanner();
                      }}
                      className="btn btn-primary btn-sm"
                      style={{ borderRadius: 8, fontSize: '0.78rem' }}
                    >
                      <QrCode size={14} /> Scan Other Shop
                    </button>
                  )}
                </div>
              )}

              {/* Recent Orders Section */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h4
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}
                  >
                    Recent Orders ({orders.length})
                  </h4>
                </div>

                {orders.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '22px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <ShoppingBag size={24} color="#64748b" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                    <p style={{ fontSize: '0.82rem', color: '#64748b', margin: 0 }}>
                      No orders placed yet from this store.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                    {orders.map((ord) => (
                      <div
                        key={ord.id}
                        onClick={() => {
                          onClose();
                          if (onViewOrder) onViewOrder(ord.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          borderRadius: 10,
                          background: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          cursor: 'pointer',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>
                            {ord.orderNumber} • {activeShop?.currency}{ord.total}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {ord.tableOrAddress}
                          </div>
                        </div>

                        <span className={`badge-status badge-${ord.status}`} style={{ fontSize: '0.7rem' }}>
                          {ord.status === 'preparing' ? '🍳 Preparing' : ord.status === 'ready' ? '🔔 Ready' : ord.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Owner Shops Summary */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <h4
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: '#94a3b8',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: 0,
                    }}
                  >
                    Your Registered Shops ({allShops.length})
                  </h4>
                  {onOpenRegisterShop && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenRegisterShop();
                      }}
                      className="btn btn-emerald btn-sm"
                      style={{ fontSize: '0.72rem', padding: '3px 8px' }}
                    >
                      <Plus size={12} /> New Shop
                    </button>
                  )}
                </div>

                {allShops.length === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '20px 16px',
                      background: 'rgba(255,255,255,0.02)',
                      borderRadius: 12,
                      border: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0 0 10px 0' }}>
                      No shops registered yet.
                    </p>
                    {onOpenRegisterShop && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenRegisterShop();
                        }}
                        className="btn btn-primary btn-sm"
                      >
                        + Register Shop Now
                      </button>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
                    {allShops.map((s) => {
                      const isActive = activeShop?.id === s.id;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            if (onSelectShop) onSelectShop(s.id);
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '10px 14px',
                            borderRadius: 10,
                            background: isActive ? 'rgba(139,92,246,0.12)' : 'rgba(255,255,255,0.03)',
                            border: isActive ? '1px solid rgba(139,92,246,0.3)' : '1px solid rgba(255,255,255,0.06)',
                            cursor: 'pointer',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>
                              🏪 {s.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                              {s.category} • {s.isOpen ? '🟢 Open' : '🔴 Closed'}
                            </div>
                          </div>

                          {isActive ? (
                            <span style={{ fontSize: '0.72rem', color: '#a78bfa', fontWeight: 700 }}>
                              Active ✓
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                              Select
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Owner Quick Actions */}
              {activeShop && onOpenQrModal && (
                <div style={{ marginBottom: 20 }}>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenQrModal();
                    }}
                    className="btn btn-secondary"
                    style={{ width: '100%', justifyContent: 'center', gap: 8, borderRadius: 12, padding: '12px' }}
                  >
                    <QrCode size={16} />
                    <span>View &amp; Print Store QR Standee</span>
                  </button>
                </div>
              )}
            </>
          )}

          {/* ─── MODAL FOOTER ACTIONS ─── */}
          <div
            style={{
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <button
              onClick={() => {
                onClose();
                if (userRole === 'customer' && onOpenScanner) {
                  onOpenScanner();
                } else if (onOpenQrModal) {
                  onOpenQrModal();
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <QrCode size={14} />
              <span>{userRole === 'customer' ? 'Scan Shop QR' : 'Store QR'}</span>
            </button>

            {onResetRole && (
              <button
                onClick={() => {
                  if (window.confirm('Return to welcome screen to choose role?')) {
                    onClose();
                    onResetRole();
                  }
                }}
                className="btn btn-secondary btn-sm"
                style={{ color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <LogOut size={14} />
                <span>Switch Role / Logout</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
