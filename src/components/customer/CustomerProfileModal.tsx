import React, { useState, useEffect } from 'react';
import { CustomerInfo } from './CustomerRegistrationModal';
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
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CustomerProfileModalProps {
  customerInfo: CustomerInfo;
  activeShop?: Shop;
  onClose: () => void;
  onUpdateCustomerInfo: (info: CustomerInfo) => void;
  onOpenScanner: () => void;
  onViewOrder: (orderId: string) => void;
  onSwitchRole: () => void;
}

export const CustomerProfileModal: React.FC<CustomerProfileModalProps> = ({
  customerInfo,
  activeShop,
  onClose,
  onUpdateCustomerInfo,
  onOpenScanner,
  onViewOrder,
  onSwitchRole,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(customerInfo.name);
  const [phone, setPhone] = useState(customerInfo.phone);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (activeShop) {
      StoreService.getOrders(activeShop.id).then((all) => {
        // Filter orders placed by this customer phone or name
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

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 480, width: '92%', overflow: 'hidden' }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, var(--primary), #ea580c)',
                color: '#fff',
                padding: 10,
                borderRadius: 12,
              }}
            >
              <User size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>My Customer Details</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Your saved identity and order history
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Profile Card */}
        <div style={{ padding: '24px' }}>
          {savedSuccess && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                color: '#34d399',
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <CheckCircle size={16} /> Details saved successfully!
            </div>
          )}

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
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
                    {customerInfo.name}
                  </h3>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      color: 'var(--text-muted)',
                      fontSize: '0.88rem',
                    }}
                  >
                    <Phone size={14} /> {customerInfo.phone || 'No phone number provided'}
                  </div>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="btn btn-secondary btn-sm"
                  style={{ borderRadius: 8 }}
                >
                  <Edit2 size={13} /> Edit
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={handleSave}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(249,115,22,0.3)',
                borderRadius: 16,
                padding: '18px 20px',
                marginBottom: 20,
              }}
            >
              <div className="form-group" style={{ marginBottom: 12 }}>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 16 }}>
                <label className="form-label">Phone / WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                  <Save size={14} /> Save Details
                </button>
              </div>
            </form>
          )}

          {/* Current Shop Banner */}
          {activeShop && (
            <div
              style={{
                background: 'rgba(249, 115, 22, 0.06)',
                border: '1px solid rgba(249, 115, 22, 0.2)',
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
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Connected Store
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>
                    {activeShop.name}
                  </div>
                </div>
              </div>

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
            </div>
          )}

          {/* Recent Orders Section */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <h4
                style={{
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
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
                  padding: '24px 16px',
                  background: 'rgba(255,255,255,0.02)',
                  borderRadius: 12,
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                <ShoppingBag size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px auto', display: 'block' }} />
                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                  No orders placed yet from this store. Add items to your cart and checkout!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 160, overflowY: 'auto' }}>
                {orders.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => {
                      onClose();
                      onViewOrder(ord.id);
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
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
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

          {/* Quick Actions & Logout */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button
              onClick={() => {
                onClose();
                onOpenScanner();
              }}
              className="btn btn-secondary btn-sm"
            >
              <QrCode size={14} /> Scan Shop QR
            </button>

            <button
              onClick={() => {
                if (window.confirm('Do you want to switch to the Namaste welcome screen / role selection?')) {
                  onClose();
                  onSwitchRole();
                }
              }}
              className="btn btn-secondary btn-sm"
              style={{ color: '#f87171' }}
            >
              <LogOut size={14} /> Switch Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
