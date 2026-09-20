import React, { useState } from 'react';
import { QrCode, Link2, ArrowRight, Search, Scan } from 'lucide-react';
import { StoreService } from '../../services/storeService';
import { Shop } from '../../types';

interface CustomerShopFinderProps {
  onShopFound: (shop: Shop, table?: string) => void;
  onOpenScanner?: () => void;
}

export const CustomerShopFinder: React.FC<CustomerShopFinderProps> = ({
  onShopFound,
  onOpenScanner,
}) => {
  const [slug, setSlug] = useState('');
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = slug.trim();
    if (!raw) return;

    // Support full URL or just slug
    let cleanSlug = raw;
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const shopParam = url.searchParams.get('shop');
      if (shopParam) cleanSlug = shopParam;
    } catch {
      // not a URL, treat as slug directly
    }

    setSearching(true);
    setError('');
    try {
      const shops = await StoreService.getShops();
      const found = shops.find((s) => s.slug === cleanSlug || s.name.toLowerCase() === cleanSlug.toLowerCase());
      if (found) {
        onShopFound(found);
      } else {
        setError(`No shop found with name or link "${cleanSlug}". Ask the shop owner for their QR code link.`);
      }
    } catch {
      setError('Could not connect to the server. Make sure the backend is running.');
    } finally {
      setSearching(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#070b14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes qr-scan-line {
          0%   { top: 10%; }
          100% { top: 90%; }
        }
        .shop-finder-input {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 0.92rem;
          padding: 13px 14px 13px 44px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .shop-finder-input:focus {
          border-color: rgba(249,115,22,0.5);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
        }
        .shop-finder-input::placeholder { color: #475569; }
      `}</style>

      <div style={{ maxWidth: 520, width: '100%', animation: 'fadeUp 0.5s ease' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          {/* Animated QR icon */}
          <div style={{
            width: 88, height: 88, borderRadius: 22,
            background: 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.04))',
            border: '1.5px solid rgba(249,115,22,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px auto',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <QrCode size={42} color="#f97316" />
            {/* Scan line animation */}
            <div style={{
              position: 'absolute', left: 8, right: 8, height: 2,
              background: 'linear-gradient(90deg, transparent, #f97316, transparent)',
              animation: 'qr-scan-line 2s linear infinite',
            }} />
          </div>

          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: '1.9rem', fontWeight: 800,
            color: '#fff', letterSpacing: '-0.02em', margin: '0 0 10px 0',
          }}>
            Find Your Shop
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6, margin: 0 }}>
            Scan the shop's QR code with your phone camera,<br />
            or enter the shop name / link below.
          </p>
        </div>

        {/* Interactive Action Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
          <div
            onClick={onOpenScanner}
            style={{
              background: 'rgba(249,115,22,0.08)',
              border: '1.5px solid rgba(249,115,22,0.3)',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
              cursor: onOpenScanner ? 'pointer' : 'default',
              transition: 'transform 0.2s, background 0.2s',
            }}
            onMouseEnter={(e) => {
              if (onOpenScanner) {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.background = 'rgba(249,115,22,0.14)';
              }
            }}
            onMouseLeave={(e) => {
              if (onOpenScanner) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.background = 'rgba(249,115,22,0.08)';
              }
            }}
          >
            <Scan size={28} color="#f97316" style={{ marginBottom: 10 }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>
              📷 Scan QR Code
            </h4>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              Open camera to scan table standee or pick photo
            </p>
            {onOpenScanner && (
              <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                Tap to Scan →
              </span>
            )}
          </div>

          <div
            style={{
              background: 'rgba(99,102,241,0.06)',
              border: '1.5px solid rgba(99,102,241,0.2)',
              borderRadius: 16,
              padding: '20px 16px',
              textAlign: 'center',
            }}
          >
            <Link2 size={28} color="#818cf8" style={{ marginBottom: 10 }} />
            <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fff', margin: '0 0 6px 0' }}>
              🔗 Enter Store Link
            </h4>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: 0, lineHeight: 1.4 }}>
              Enter shop name or paste the store link below
            </p>
          </div>
        </div>

        {/* Manual search */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 18, padding: '24px',
        }}>
          <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: '0 0 14px 0' }}>
            <Search size={12} style={{ display: 'inline', marginRight: 5 }} />
            Search by Shop Name or Link
          </h4>
          <form onSubmit={handleSearch}>
            <div style={{ position: 'relative', marginBottom: 14 }}>
              <Search size={16} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input
                id="shop-search"
                className="shop-finder-input"
                type="text"
                placeholder="Shop name or paste store link…"
                value={slug}
                onChange={(e) => { setSlug(e.target.value); setError(''); }}
              />
            </div>

            {error && (
              <p style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={searching || !slug.trim()}
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center', borderRadius: 12, padding: '12px' }}
            >
              {searching ? (
                <>
                  <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                  Searching…
                </>
              ) : (
                <>
                  Go to Shop <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#1e293b', marginTop: 18 }}>
          Don't have a QR code? Ask your shop owner to share their store link.
        </p>
      </div>
    </div>
  );
};
