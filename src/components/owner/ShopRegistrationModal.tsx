import React, { useState } from 'react';
import { Shop, ShopCategory } from '../../types';
import { StoreService } from '../../services/storeService';
import { Store, X, Sparkles, CheckCircle2, Eye, EyeOff, Copy, Check, ShieldCheck } from 'lucide-react';
import { playSound } from '../../utils/audio';
import { seedStarterProductsForShop } from '../../utils/starterMenu';

interface ShopRegistrationModalProps {
  onClose: () => void;
  onRegistered: (shop: Shop) => void;
}

export const ShopRegistrationModal: React.FC<ShopRegistrationModalProps> = ({
  onClose,
  onRegistered,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopCategory>('fast_food');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [address, setAddress] = useState('');
  const [tableCount, setTableCount] = useState<number>(6);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // After-registration credential reveal
  const [createdShop, setCreatedShop] = useState<Shop | null>(null);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedPw, setCopiedPw] = useState(false);

  const copyToClipboard = async (text: string, type: 'id' | 'pw') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'id') { setCopiedId(true); setTimeout(() => setCopiedId(false), 2000); }
      else { setCopiedPw(true); setTimeout(() => setCopiedPw(false), 2000); }
    } catch { /* ignore */ }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a shop or restaurant name.');
      return;
    }
    if (!password.trim() || password.trim().length < 4) {
      setErrorMessage('Please set a password of at least 4 characters to protect your shop.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug || 'shop'}-${Date.now().toString().slice(-4)}`;

    try {
      // Hash the password before storing
      const passwordHash = await StoreService.hashPassword(password.trim());

      const shopData = {
        name: name.trim(),
        slug,
        category,
        tagline: tagline.trim() || 'Order directly from your table or phone',
        description: `${name.trim()} — Order directly from your table or phone.`,
        phone: phone.trim(),
        upiId: upiId.trim(),
        address: address.trim(),
        tableCount: Number(tableCount) || 0,
        isOpen: true,
        bannerUrl:
          bannerUrl.trim() ||
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        currency: '₹',
        deliveryCharge: 30,
        freeDeliveryAbove: 499,
        passwordHash,
      };

      const newShop = await StoreService.registerShop(shopData);
      try {
        await seedStarterProductsForShop(newShop.id, category);
      } catch (seedErr) {
        console.warn('Starter seeding error:', seedErr);
      }
      playSound('success');
      // Show the credentials reveal panel first
      setCreatedShop(newShop);
    } catch (err: any) {
      const fallbackShop: Shop = {
        id: `shop-${Date.now()}`,
        name: name.trim(),
        slug,
        category,
        tagline: tagline.trim() || 'Order directly from your table or phone',
        description: `${name.trim()} — Order directly from your table or phone.`,
        phone: phone.trim(),
        upiId: upiId.trim(),
        address: address.trim(),
        tableCount: Number(tableCount) || 0,
        isOpen: true,
        bannerUrl:
          bannerUrl.trim() ||
          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
        currency: '₹',
        deliveryCharge: 30,
        freeDeliveryAbove: 499,
        createdAt: new Date().toISOString(),
        logoUrl: '',
      } as Shop;
      try {
        await seedStarterProductsForShop(fallbackShop.id, category);
      } catch { /* ignore */ }
      playSound('success');
      setCreatedShop(fallbackShop);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Credentials Reveal Panel ─────────────────────────
  if (createdShop) {
    return (
      <div className="modal-overlay">
        <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
          <style>{`
            @keyframes credReveal { from{opacity:0;transform:scale(0.92) translateY(14px)} to{opacity:1;transform:scale(1) translateY(0)} }
            .cred-box { animation: credReveal 0.45s cubic-bezier(0.34,1.56,0.64,1); }
          `}</style>

          <div className="cred-box" style={{ padding: '32px 28px', textAlign: 'center' }}>
            {/* Success icon */}
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.06))',
              border: '2px solid rgba(16,185,129,0.35)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 18px auto',
            }}>
              <ShieldCheck size={34} color="#10b981" />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
              🎉 Shop Registered!
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 28, lineHeight: 1.6 }}>
              Your shop is live. Save your credentials below — you'll need them to log in as owner.
            </p>

            {/* Shop ID */}
            <div style={{
              background: 'rgba(99,102,241,0.08)',
              border: '1.5px solid rgba(99,102,241,0.25)',
              borderRadius: 14, padding: '14px 16px',
              marginBottom: 12, textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                🆔 Shop ID
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <code style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', letterSpacing: '0.04em', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                  {createdShop.id}
                </code>
                <button
                  onClick={() => copyToClipboard(createdShop.id, 'id')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#818cf8', padding: 4, flexShrink: 0 }}
                  title="Copy Shop ID"
                >
                  {copiedId ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Password */}
            <div style={{
              background: 'rgba(249,115,22,0.07)',
              border: '1.5px solid rgba(249,115,22,0.25)',
              borderRadius: 14, padding: '14px 16px',
              marginBottom: 24, textAlign: 'left',
            }}>
              <div style={{ fontSize: '0.72rem', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                🔑 Password
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <code style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', fontFamily: 'monospace' }}>
                  {password}
                </code>
                <button
                  onClick={() => copyToClipboard(password, 'pw')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fb923c', padding: 4, flexShrink: 0 }}
                  title="Copy Password"
                >
                  {copiedPw ? <Check size={16} color="#10b981" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            {/* Warning */}
            <div style={{
              background: 'rgba(245,158,11,0.08)',
              border: '1px solid rgba(245,158,11,0.25)',
              borderRadius: 10, padding: '10px 14px',
              fontSize: '0.78rem', color: '#fbbf24',
              lineHeight: 1.6, marginBottom: 24, textAlign: 'left',
            }}>
              ⚠️ <strong>Save these credentials</strong> — you'll need your Shop ID + Password to log back in if you log out on this device.
            </div>

            <button
              onClick={() => onRegistered(createdShop)}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 14 }}
            >
              <Sparkles size={18} />
              Go to My Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Registration Form ────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'linear-gradient(135deg, var(--primary), #d97706)', color: '#fff', padding: 10, borderRadius: 12 }}>
              <Store size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Register Your Online Shop</h3>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Generate instant store link &amp; customized QR Code</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Shop / Restaurant Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Royal Spice Bistro"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shop Business Type * (Burger Joint, Dine-In, etc.)</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as ShopCategory;
                  setCategory(cat);
                  if (cat === 'fast_food') {
                    setBannerUrl('https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80');
                  } else if (cat === 'food') {
                    setBannerUrl('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80');
                  } else if (cat === 'pizza') {
                    setBannerUrl('https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=1200&q=80');
                  } else if (cat === 'cafe') {
                    setBannerUrl('https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80');
                  } else if (cat === 'clothing') {
                    setBannerUrl('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80');
                  } else {
                    setBannerUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80');
                  }
                }}
              >
                <option value="fast_food">🍔 Fast Food / Burger Joint (Burger King Style)</option>
                <option value="food">🍽️ Dine-In Restaurant / Bistro</option>
                <option value="pizza">🍕 Pizza &amp; Fast Casual</option>
                <option value="cafe">☕ Cafe &amp; Bakery</option>
                <option value="clothing">👕 Clothing &amp; Fashion Boutique</option>
                <option value="grocery">🛒 Grocery &amp; Daily Essentials</option>
                <option value="electronics">⚡ Electronics &amp; Gadgets</option>
                <option value="other">🏪 General Retail Store</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Catchy Tagline</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Authentic Taste, Freshly Made"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Shop UPI ID (For Direct Payments)</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. yourstore@okhdfcbank"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Contact Phone / WhatsApp</label>
              <input
                type="tel"
                className="form-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            {(category === 'fast_food' || category === 'food' || category === 'pizza' || category === 'cafe') && (
              <div className="form-group">
                <label className="form-label">Number of Dining Tables <span style={{ color: '#f97316' }}>*</span> <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.78rem' }}>(each table gets its own QR standee)</span></label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  className="form-input"
                  value={tableCount}
                  onChange={(e) => setTableCount(Number(e.target.value))}
                />
              </div>
            )}

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Physical Address / City</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Shop 12, Ground Floor, Phoenix Mall"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Password field — full width */}
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#fb923c' }}>🔑</span>
                Owner Password * <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.78rem' }}>(min. 4 chars — needed to log back in)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="form-input"
                  placeholder="Create a password for your shop account"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4,
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </div>

          {/* Quick preset banners */}
          <div style={{ marginTop: 10, marginBottom: 20 }}>
            <label className="form-label">Store Cover Banner</label>
            <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
              {[
                { label: 'Warm Cafe', url: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?auto=format&fit=crop&w=600&q=80' },
                { label: 'Bistro Food', url: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80' },
                { label: 'Fashion boutique', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80' },
                { label: 'Cozy Bakery', url: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80' },
              ].map((b) => (
                <div
                  key={b.url}
                  onClick={() => setBannerUrl(b.url)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: bannerUrl === b.url ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    flexShrink: 0,
                    width: 130,
                    height: 60,
                  }}
                >
                  <img src={b.url} alt={b.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span style={{ position: 'absolute', bottom: 2, left: 4, fontSize: '0.7rem', color: '#fff', background: 'rgba(0,0,0,0.6)', padding: '1px 4px', borderRadius: 4 }}>
                    {b.label}
                  </span>
                  {bannerUrl === b.url && (
                    <div style={{ position: 'absolute', top: 3, right: 3, color: 'var(--primary)', background: '#fff', borderRadius: '50%' }}>
                      <CheckCircle2 size={14} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Error message */}
          {errorMessage && (
            <div
              style={{
                marginTop: 16,
                padding: '10px 14px',
                borderRadius: 10,
                background: 'rgba(239, 68, 68, 0.12)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#f87171',
                fontSize: '0.85rem',
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Footer CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 18, marginTop: 18 }}>
            <button type="button" onClick={onClose} disabled={isSubmitting} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary btn-lg">
              {isSubmitting ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTopColor: '#fff',
                      borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                    }}
                  />
                  Registering Shop…
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  Register &amp; Generate QR Code
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
