import React, { useState, useEffect } from 'react';
import { Order, Shop } from '../../types';
import { StoreService, subscribeToStoreEvents } from '../../services/storeService';
import {
  CheckCircle2,
  ChefHat,
  BellRing,
  Sparkles,
  ArrowLeft,
  Clock,
  MapPin,
  CreditCard,
  Banknote,
  Star,
  Receipt,
  Phone
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface LiveOrderStatusProps {
  orderId: string;
  shop: Shop;
  onBackToMenu: () => void;
  onOpenRating: (order: Order) => void;
}

export const LiveOrderStatus: React.FC<LiveOrderStatusProps> = ({
  orderId,
  shop,
  onBackToMenu,
  onOpenRating,
}) => {
  const [order, setOrder] = useState<Order | null>(null);
  const [statusAlert, setStatusAlert] = useState<string | null>(null);

  const fetchOrder = async () => {
    try {
      const ord = await StoreService.getOrderById(orderId);
      if (ord) setOrder(ord);
    } catch (err) {
      console.error('Failed to fetch order from MongoDB:', err);
    }
  };

  useEffect(() => {
    fetchOrder();
    const unsub = subscribeToStoreEvents((event) => {
      if (event.type === 'order_status_updated') {
        const updated = event.payload as Order;
        if (updated && updated.id === orderId) {
          setOrder(updated);

          if (updated.status === 'preparing') {
            playSound('preparing');
            setStatusAlert('👨‍🍳 The chef has begun cooking your order fresh!');
          } else if (updated.status === 'ready') {
            playSound('ready');
            setStatusAlert('🔔 Your order is READY! Please collect or prepare to be served.');
          } else if (updated.status === 'completed') {
            playSound('success');
            setStatusAlert('✨ Order completed! Enjoy your meal!');
            setTimeout(() => {
              onOpenRating(updated);
            }, 1200);
          }

          setTimeout(() => setStatusAlert(null), 5000);
        }
      }
    });

    return unsub;
  }, [orderId, onOpenRating]);

  if (!order) {
    return (
      <div style={{ maxWidth: 600, margin: '40px auto', textAlign: 'center', padding: 20 }}>
        <h3>Order not found</h3>
        <button onClick={onBackToMenu} className="btn btn-primary" style={{ marginTop: 14 }}>
          Back to Store
        </button>
      </div>
    );
  }

  const steps = [
    { key: 'received', title: 'Order Placed', desc: 'Received by store kitchen' },
    { key: 'preparing', title: 'Chef Preparing', desc: 'Cooking & packaging dishes fresh' },
    { key: 'ready', title: 'Order Ready', desc: 'Ready for table serving / pickup' },
    { key: 'completed', title: 'Completed', desc: 'Order delivered & enjoyed' },
  ];

  const getStepIndex = (st: string) => {
    switch (st) {
      case 'received': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const currentIndex = getStepIndex(order.status);

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '16px 20px 80px 20px' }}>
      {/* Top back button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button onClick={onBackToMenu} className="btn btn-secondary btn-sm">
          <ArrowLeft size={16} /> Back to Menu
        </button>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Order #{order.orderNumber}
        </span>
      </div>

      {/* Real-time status update alert banner */}
      {statusAlert && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(245, 158, 11, 0.2))',
            border: '1px solid var(--primary)',
            color: '#fff',
            borderRadius: 12,
            padding: '12px 18px',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            animation: 'slideUp 0.3s ease',
            boxShadow: '0 4px 20px var(--primary-glow)',
          }}
        >
          <BellRing size={20} color="var(--primary)" style={{ flexShrink: 0 }} />
          <p style={{ fontWeight: 600, fontSize: '0.92rem', margin: 0 }}>{statusAlert}</p>
        </div>
      )}

      {/* Main Status Hero Card */}
      <div
        className="glass-panel"
        style={{
          padding: '28px 24px',
          marginBottom: 24,
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          width: 76,
          height: 76,
          borderRadius: '50%',
          margin: '0 auto 16px auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            order.status === 'preparing'
              ? 'rgba(245, 158, 11, 0.18)'
              : order.status === 'ready'
              ? 'rgba(16, 185, 129, 0.18)'
              : order.status === 'completed'
              ? 'rgba(59, 130, 246, 0.18)'
              : 'rgba(249, 115, 22, 0.18)',
          color:
            order.status === 'preparing'
              ? '#fbbf24'
              : order.status === 'ready'
              ? '#34d399'
              : order.status === 'completed'
              ? '#60a5fa'
              : 'var(--primary)',
          border: `2px solid ${
            order.status === 'preparing'
              ? '#f59e0b'
              : order.status === 'ready'
              ? '#10b981'
              : 'var(--primary)'
          }`,
        }}>
          {order.status === 'preparing' ? (
            <ChefHat size={38} className="animate-pulse" />
          ) : order.status === 'ready' ? (
            <BellRing size={38} />
          ) : order.status === 'completed' ? (
            <CheckCircle2 size={38} />
          ) : (
            <Clock size={38} />
          )}
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>
          {order.status === 'received' && 'Order Received by Kitchen'}
          {order.status === 'preparing' && 'Chef is Preparing Your Food! 👨‍🍳🔥'}
          {order.status === 'ready' && 'Your Order is Hot & Ready! 🔔'}
          {order.status === 'completed' && 'Order Delivered / Served! ✨'}
        </h2>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 6, maxWidth: 450, margin: '6px auto 0 auto' }}>
          {order.status === 'received' && 'The order has been transmitted to the store screen. Cooking begins shortly.'}
          {order.status === 'preparing' && 'Fresh ingredients are in the wok and oven. You will be notified the instant it is ready!'}
          {order.status === 'ready' && `Your order is ready at ${order.tableOrAddress}. Enjoy the fresh flavors!`}
          {order.status === 'completed' && 'We hope you enjoyed the meal! Please take a second to rate your experience.'}
        </p>

        {/* Dynamic Stepper */}
        <div style={{ marginTop: 28, padding: '16px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative' }}>
            {steps.map((st, idx) => {
              const isPast = idx < currentIndex;
              const isCurrent = idx === currentIndex;
              return (
                <div key={st.key} style={{ textAlign: 'center', padding: '0 4px' }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      margin: '0 auto 8px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      background: isCurrent
                        ? 'var(--primary)'
                        : isPast
                        ? '#10b981'
                        : 'rgba(255,255,255,0.08)',
                      color: isCurrent || isPast ? '#fff' : 'var(--text-dim)',
                      boxShadow: isCurrent ? '0 0 14px var(--primary-glow)' : 'none',
                    }}
                  >
                    {isPast ? '✓' : idx + 1}
                  </div>
                  <p style={{
                    fontSize: '0.75rem',
                    fontWeight: isCurrent ? 700 : 500,
                    color: isCurrent ? '#fff' : isPast ? '#10b981' : 'var(--text-dim)',
                  }}>
                    {st.title}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* If completed, prompt review button */}
        {order.status === 'completed' && (
          <div style={{ marginTop: 20 }}>
            <button
              onClick={() => onOpenRating(order)}
              className="btn btn-primary"
              style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', padding: '12px 24px' }}
            >
              <Star size={18} fill="#fff" />
              {order.rating ? `You Rated This Order ⭐ ${order.rating}/5 (Edit)` : 'Rate Your Dishes & Experience'}
            </button>
          </div>
        )}
      </div>

      {/* Order Details & Receipt */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--border-subtle)', paddingBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Receipt size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1.05rem' }}>Receipt & Item Details</h3>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {/* Customer / Table Info */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 16, background: 'rgba(255,255,255,0.02)', padding: 12, borderRadius: 8 }}>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Serving Location</span>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)', marginTop: 2 }}>
              📍 {order.tableOrAddress}
            </p>
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Payment Mode</span>
            <p style={{ fontSize: '0.9rem', fontWeight: 600, color: order.paymentMethod === 'online' ? '#34d399' : '#fbbf24', marginTop: 2 }}>
              {order.paymentMethod === 'online' ? '💳 Online Payment (Paid)' : '💵 Cash on Counter'}
            </p>
          </div>
        </div>

        {/* Items List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {item.product.dietary && <span className={`diet-badge ${item.product.dietary}`} />}
                <span>{item.product.name}</span>
                <span style={{ color: 'var(--primary)', fontWeight: 700 }}>x{item.quantity}</span>
              </div>
              <span style={{ color: '#fff', fontWeight: 600 }}>
                {shop.currency}{(item.product.discountPrice || item.product.price) * item.quantity}
              </span>
            </div>
          ))}
        </div>

        {/* Financials */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 4 }}>
            <span>Subtotal</span>
            <span>{shop.currency}{order.subtotal}</span>
          </div>
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#34d399', marginBottom: 4 }}>
              <span>Offer Discount</span>
              <span>-{shop.currency}{order.discount}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: 8 }}>
            <span>Taxes & Service</span>
            <span>{shop.currency}{order.tax}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.2rem', fontWeight: 800, color: '#fff', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 8 }}>
            <span>Grand Total</span>
            <span style={{ color: 'var(--primary)' }}>{shop.currency}{order.total}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
