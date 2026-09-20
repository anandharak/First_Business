import React, { useState } from 'react';
import { User, Phone, ArrowRight, Sparkles } from 'lucide-react';

export interface CustomerInfo {
  name: string;
  phone: string;
}

interface CustomerRegistrationModalProps {
  /** Pre-fill hint if we detected a shop context */
  shopName?: string;
  onComplete: (info: CustomerInfo) => void;
}

export const CustomerRegistrationModal: React.FC<CustomerRegistrationModalProps> = ({
  shopName,
  onComplete,
}) => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [loading, setLoading] = useState(false);

  const validate = () => {
    const e: { name?: string; phone?: string } = {};
    if (!name.trim() || name.trim().length < 2) e.name = 'Please enter your full name';
    if (!phone.trim() || !/^[6-9]\d{9}$/.test(phone.replace(/\s/g, ''))) {
      e.phone = 'Enter a valid 10-digit Indian mobile number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Small UX delay for feel
    await new Promise((r) => setTimeout(r, 600));
    onComplete({ name: name.trim(), phone: phone.trim() });
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(7,11,20,0.92)',
        backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
      }}
    >
      <style>{`
        @keyframes slideUpModal {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        .cust-input {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 0.95rem;
          padding: 12px 14px 12px 42px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-sizing: border-box;
        }
        .cust-input:focus {
          border-color: rgba(249,115,22,0.5);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.12);
        }
        .cust-input.error {
          border-color: rgba(239,68,68,0.5);
        }
        .cust-input::placeholder { color: #475569; }
      `}</style>

      <div style={{
        background: 'linear-gradient(160deg, rgba(20,27,45,0.98) 0%, rgba(15,20,35,0.98) 100%)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 24,
        padding: '40px 36px',
        width: '100%',
        maxWidth: 440,
        boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(249,115,22,0.08)',
        animation: 'slideUpModal 0.4s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.25), rgba(249,115,22,0.08))',
            border: '1px solid rgba(249,115,22,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px auto',
          }}>
            <User size={30} color="#f97316" />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.02em', margin: '0 0 8px 0',
          }}>
            Welcome! 👋
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>
            {shopName
              ? `Tell us your name to order at ${shopName}`
              : 'Quick registration so shops know who\'s ordering'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Name field */}
          <div style={{ marginBottom: 18, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Your Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                id="customer-name"
                className={`cust-input${errors.name ? ' error' : ''}`}
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={name}
                onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                autoComplete="name"
                autoFocus
              />
            </div>
            {errors.name && (
              <p style={{ fontSize: '0.74rem', color: '#f87171', margin: '5px 0 0 2px' }}>{errors.name}</p>
            )}
          </div>

          {/* Phone field */}
          <div style={{ marginBottom: 28, position: 'relative' }}>
            <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600, marginBottom: 7, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Mobile Number
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                id="customer-phone"
                className={`cust-input${errors.phone ? ' error' : ''}`}
                type="tel"
                placeholder="9876543210"
                value={phone}
                maxLength={10}
                onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '')); setErrors((p) => ({ ...p, phone: undefined })); }}
                autoComplete="tel"
              />
            </div>
            {errors.phone && (
              <p style={{ fontSize: '0.74rem', color: '#f87171', margin: '5px 0 0 2px' }}>{errors.phone}</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '0.95rem', borderRadius: 12, justifyContent: 'center' }}
          >
            {loading ? (
              <>
                <div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Setting up…
              </>
            ) : (
              <>
                Continue to Shop
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#334155', marginTop: 18, lineHeight: 1.5 }}>
          <Sparkles size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3, color: '#475569' }} />
          Your info is only used to identify your orders — we don't share it.
        </p>
      </div>
    </div>
  );
};
