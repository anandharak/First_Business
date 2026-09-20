import React, { useState } from 'react';
import { Shop, ShopCategory } from '../../types';
import { StoreService } from '../../services/storeService';
import { Store, X, Sparkles, CheckCircle2 } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface ShopRegistrationModalProps {
  onClose: () => void;
  onRegistered: (shop: Shop) => void;
}

export const ShopRegistrationModal: React.FC<ShopRegistrationModalProps> = ({
  onClose,
  onRegistered,
}) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<ShopCategory>('food');
  const [tagline, setTagline] = useState('');
  const [phone, setPhone] = useState('');
  const [upiId, setUpiId] = useState('');
  const [address, setAddress] = useState('');
  const [tableCount, setTableCount] = useState<number>(0);
  const [bannerUrl, setBannerUrl] = useState(
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Please enter a shop or restaurant name.');
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
      const newShop = await StoreService.registerShop({
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
      });

      playSound('success');
      onRegistered(newShop);
    } catch (err: any) {
      console.error('Shop registration error:', err);
      setErrorMessage(err.message || 'Failed to create shop. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Generate instant store link & customized QR Code</p>
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
              <label className="form-label">Shop Business Type *</label>
              <select
                className="form-select"
                value={category}
                onChange={(e) => {
                  const cat = e.target.value as ShopCategory;
                  setCategory(cat);
                  if (cat === 'food' || cat === 'cafe') {
                    setBannerUrl('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80');
                  } else if (cat === 'clothing') {
                    setBannerUrl('https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80');
                  } else {
                    setBannerUrl('https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80');
                  }
                }}
              >
                <option value="food">🍽️ Restaurant / Food & Dining</option>
                <option value="cafe">☕ Cafe & Bakery</option>
                <option value="clothing">👕 Clothing & Fashion Boutique</option>
                <option value="grocery">🛒 Grocery & Daily Essentials</option>
                <option value="electronics">⚡ Electronics & Gadgets</option>
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

            {(category === 'food' || category === 'cafe') && (
              <div className="form-group">
                <label className="form-label">Number of Dining Tables (For QR Codes)</label>
                <input
                  type="number"
                  min="0"
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
                  Register & Generate QR Code
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
