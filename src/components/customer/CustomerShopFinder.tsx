import React, { useState, useEffect } from 'react';
import { Search, ArrowRight, X } from 'lucide-react';
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
  const [showSearch, setShowSearch] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = slug.trim();
    if (!raw) return;

    let cleanSlug = raw;
    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const shopParam = url.searchParams.get('shop');
      if (shopParam) cleanSlug = shopParam;
    } catch {
      // not a URL
    }

    setSearching(true);
    setError('');
    try {
      const shops = await StoreService.getShops();
      const found = shops.find(
        (s) =>
          s.slug === cleanSlug ||
          s.name.toLowerCase() === cleanSlug.toLowerCase()
      );
      if (found) {
        onShopFound(found);
      } else {
        setError(`No shop found for "${cleanSlug}". Ask the shop owner for their QR code.`);
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
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      padding: 24,
    }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes phonepay-pulse {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0;   }
        }
        @keyframes phonepay-pulse2 {
          0%   { transform: scale(1);   opacity: 0.4; }
          100% { transform: scale(2.3); opacity: 0;   }
        }
        @keyframes scanner-sweep {
          0%   { top: 18%; }
          100% { top: 78%; }
        }
        @keyframes corner-glow {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1;   }
        }
        @keyframes orbit-float {
          0%, 100% { transform: translateY(0px) scale(1); }
          50%       { transform: translateY(-6px) scale(1.05); }
        }
        .pp-scan-btn {
          position: relative;
          width: 148px; height: 148px;
          border-radius: 50%;
          background: linear-gradient(135deg, #f97316 0%, #d97706 55%, #f59e0b 100%);
          border: none;
          cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          flex-direction: column;
          box-shadow: 0 0 0 0 rgba(249,115,22,0.4),
                      0 20px 60px rgba(249,115,22,0.4),
                      inset 0 2px 8px rgba(255,255,255,0.2);
          transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.18s;
          z-index: 2;
        }
        .pp-scan-btn:hover {
          transform: scale(1.07);
          box-shadow: 0 0 0 0 rgba(249,115,22,0.4),
                      0 28px 80px rgba(249,115,22,0.55),
                      inset 0 2px 8px rgba(255,255,255,0.25);
        }
        .pp-scan-btn:active { transform: scale(0.96); }
        .pp-ring {
          position: absolute;
          border-radius: 50%;
          border: 2px solid rgba(249,115,22,0.5);
          width: 100%; height: 100%;
          animation: phonepay-pulse 2s ease-out infinite;
        }
        .pp-ring2 {
          animation: phonepay-pulse2 2s ease-out infinite 0.5s;
          border-color: rgba(249,115,22,0.3);
        }
        .finder-search-input {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 14px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 0.9rem;
          padding: 13px 44px 13px 44px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .finder-search-input:focus {
          border-color: rgba(249,115,22,0.5);
          box-shadow: 0 0 0 3px rgba(249,115,22,0.1);
        }
        .finder-search-input::placeholder { color: #475569; }
        .orbit-pill {
          position: absolute;
          display: flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 30px;
          padding: 8px 16px;
          font-size: 0.78rem; font-weight: 600; color: #94a3b8;
          cursor: default;
          white-space: nowrap;
          backdrop-filter: blur(8px);
          animation: orbit-float 3s ease-in-out infinite;
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', top: '10%', left: '5%',
        width: 340, height: 340, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 68%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '8%', right: '6%',
        width: 280, height: 280, borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 68%)',
      }} />

      <div style={{
        position: 'relative', zIndex: 1,
        maxWidth: 480, width: '100%',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>

        {/* Top brand pill */}
        <div style={{ marginBottom: 32, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', marginBottom: 10 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg, #f97316, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.9rem' }}>⚡</span>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>QROrder</span>
          </div>
          <h2 style={{ fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800, color: '#fff', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
            Scan to Order
          </h2>
          <p style={{ color: '#475569', fontSize: '0.82rem', margin: 0 }}>
            Point your camera at any shop's QR code
          </p>
        </div>

        {/* ─── Central PhonePe-style Scanner Button ─── */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 44, width: 200, height: 200 }}>

          {/* Orbit pills */}
          <div className="orbit-pill" style={{ top: -6, left: -90, animationDelay: '0s' }}>
            🍔 Fast Food
          </div>
          <div className="orbit-pill" style={{ bottom: 18, right: -80, animationDelay: '1.1s' }}>
            🍕 Pizza & More
          </div>
          <div className="orbit-pill" style={{ bottom: -18, left: -68, animationDelay: '0.6s' }}>
            ☕ Cafes & Bakeries
          </div>

          {/* Pulse rings */}
          <div style={{ position: 'absolute', inset: 26 }}>
            <div className="pp-ring" />
            <div className="pp-ring pp-ring2" />
          </div>

          {/* Main scan button */}
          <button
            className="pp-scan-btn"
            onClick={onOpenScanner}
            title="Open QR Scanner"
            id="btn-open-scanner"
          >
            {/* Inner QR frame corners */}
            {[
              { top: 22, left: 22, borderWidth: '3px 0 0 3px' },
              { top: 22, right: 22, borderWidth: '3px 3px 0 0' },
              { bottom: 22, left: 22, borderWidth: '0 0 3px 3px' },
              { bottom: 22, right: 22, borderWidth: '0 3px 3px 0' },
            ].map((style, i) => (
              <div key={i} style={{
                position: 'absolute',
                width: 18, height: 18,
                border: `3px solid rgba(255,255,255,0.85)`,
                borderWidth: style.borderWidth,
                borderRadius: 2,
                top: style.top, bottom: style.bottom,
                left: style.left, right: style.right,
                animation: 'corner-glow 1.5s ease-in-out infinite',
                animationDelay: `${i * 0.2}s`,
              }} />
            ))}

            {/* Sweeping scan line */}
            <div style={{
              position: 'absolute', left: 22, right: 22, height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.95), transparent)',
              animation: 'scanner-sweep 1.6s ease-in-out infinite alternate',
              borderRadius: 2,
            }} />

            <span style={{ fontSize: '2.4rem', lineHeight: 1, zIndex: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}>
              📷
            </span>
            <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'rgba(255,255,255,0.9)', marginTop: 4, zIndex: 1, letterSpacing: '0.04em' }}>
              SCAN QR
            </span>
          </button>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%', marginBottom: 20 }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
          <span style={{ fontSize: '0.75rem', color: '#334155', fontWeight: 600, letterSpacing: '0.05em' }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.07)' }} />
        </div>

        {/* Manual search toggle / inline */}
        {!showSearch ? (
          <button
            onClick={() => setShowSearch(true)}
            className="btn btn-secondary"
            style={{ width: '100%', justifyContent: 'center', borderRadius: 14, padding: '12px', fontSize: '0.88rem' }}
          >
            <Search size={16} />
            Search by Shop Name or Link
          </button>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18, padding: '20px',
            width: '100%', boxSizing: 'border-box',
            animation: 'fadeUp 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h4 style={{ fontSize: '0.8rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', margin: 0 }}>
                Search Shop
              </h4>
              <button onClick={() => { setShowSearch(false); setError(''); setSlug(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: 2 }}>
                <X size={15} />
              </button>
            </div>

            <form onSubmit={handleSearch}>
              <div style={{ position: 'relative', marginBottom: 14 }}>
                <Search size={16} color="#475569" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  id="shop-search"
                  className="finder-search-input"
                  type="text"
                  placeholder="Shop name or paste store link…"
                  value={slug}
                  autoFocus
                  onChange={(e) => { setSlug(e.target.value); setError(''); }}
                />
              </div>

              {error && (
                <p style={{ fontSize: '0.78rem', color: '#f87171', marginBottom: 12, background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: 8, lineHeight: 1.5 }}>
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
                  <>Go to Shop <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#1e293b', marginTop: 24 }}>
          Don't have a QR code? Ask your shop owner to share their store link.
        </p>
      </div>
    </div>
  );
};
