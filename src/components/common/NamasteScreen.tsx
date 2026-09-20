import React, { useState, useEffect } from 'react';
import { Store, User, QrCode, ChefHat, Sparkles } from 'lucide-react';

interface NamasteScreenProps {
  /** true when URL already has ?shop= — auto-suggest customer role */
  isQrContext: boolean;
  onSelectRole: (role: 'customer' | 'owner') => void;
}

export const NamasteScreen: React.FC<NamasteScreenProps> = ({ isQrContext, onSelectRole }) => {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState<'customer' | 'owner' | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 120);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#070b14',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-orb {
          0%, 100% { transform: scale(1); opacity: 0.18; }
          50%       { transform: scale(1.12); opacity: 0.28; }
        }
        @keyframes float-namaste {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-8px); }
        }
        @keyframes shimmer-text {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .namaste-role-card {
          position: relative;
          background: rgba(255,255,255,0.04);
          border: 1.5px solid rgba(255,255,255,0.08);
          border-radius: 20px;
          padding: 32px 24px;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34,1.56,0.64,1);
          text-align: center;
          overflow: hidden;
        }
        .namaste-role-card:hover {
          transform: translateY(-6px) scale(1.02);
          border-color: rgba(249,115,22,0.5);
          box-shadow: 0 20px 60px rgba(249,115,22,0.15), 0 0 0 1px rgba(249,115,22,0.15);
        }
        .namaste-role-card.owner:hover {
          border-color: rgba(139,92,246,0.5);
          box-shadow: 0 20px 60px rgba(139,92,246,0.15), 0 0 0 1px rgba(139,92,246,0.15);
        }
        .namaste-role-card .card-glow {
          position: absolute;
          inset: 0;
          opacity: 0;
          transition: opacity 0.3s;
          border-radius: 20px;
        }
        .namaste-role-card:hover .card-glow {
          opacity: 1;
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: 380, height: 380,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.22) 0%, transparent 70%)',
        animation: 'pulse-orb 5s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '10%', right: '8%',
        width: 320, height: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.2) 0%, transparent 70%)',
        animation: 'pulse-orb 6s ease-in-out infinite 1.5s',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '50%', left: '50%',
        width: 600, height: 600,
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 60%)',
        pointerEvents: 'none',
      }} />

      {/* Content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: 600,
          width: '100%',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'opacity 0.7s ease, transform 0.7s ease',
        }}
      >
        {/* Emoji + Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            fontSize: '3.8rem',
            display: 'inline-block',
            animation: 'float-namaste 3s ease-in-out infinite',
            marginBottom: 12,
            lineHeight: 1,
          }}>
            🙏
          </div>

          {/* नमस्ते — shimmer gradient text */}
          <h1
            style={{
              fontFamily: '"Noto Serif Devanagari", "Devanagari", serif',
              fontSize: 'clamp(3rem, 8vw, 5rem)',
              fontWeight: 900,
              lineHeight: 1.1,
              margin: '0 0 10px 0',
              background: 'linear-gradient(90deg, #f97316, #fbbf24, #f97316, #fbbf24)',
              backgroundSize: '300% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              animation: 'shimmer-text 3s linear infinite',
            }}
          >
            नमस्ते
          </h1>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 30, height: 30, borderRadius: 8,
              background: 'linear-gradient(135deg, #f97316, #d97706)',
            }}>
              <span style={{ fontSize: '1rem' }}>⚡</span>
            </div>
            <span style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em' }}>
              QROrder
            </span>
            <span style={{
              fontSize: '0.62rem', fontWeight: 700, color: '#f97316',
              border: '1px solid rgba(249,115,22,0.4)', borderRadius: 6,
              padding: '1px 6px', letterSpacing: '0.05em',
            }}>
              PRO
            </span>
          </div>

          <p style={{
            color: '#64748b', fontSize: '0.88rem', lineHeight: 1.6,
            maxWidth: 340, margin: '0 auto',
          }}>
            {isQrContext
              ? 'You scanned a shop QR code. Tell us who you are to continue.'
              : 'Your complete digital ordering platform. Please tell us who you are.'}
          </p>
        </div>

        {/* Role Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 28 }}>

          {/* CUSTOMER CARD */}
          <div
            className="namaste-role-card"
            onClick={() => onSelectRole('customer')}
            onMouseEnter={() => setHovered('customer')}
            onMouseLeave={() => setHovered(null)}
            id="role-customer"
          >
            <div className="card-glow" style={{
              background: 'radial-gradient(ellipse at center, rgba(249,115,22,0.08) 0%, transparent 70%)',
            }} />
            {/* Icon */}
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))',
              border: '1px solid rgba(249,115,22,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto',
              transition: 'all 0.3s',
              ...(hovered === 'customer' ? { background: 'linear-gradient(135deg, rgba(249,115,22,0.35), rgba(249,115,22,0.15))', transform: 'scale(1.1)' } : {}),
            }}>
              <User size={28} color="#f97316" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              I'm a Customer
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Scan shop QR or use store link to order food, clothes & more
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: 14 }}>
              {['📷 Scan QR', '🛒 Order', '💳 Pay'].map((t) => (
                <span key={t} style={{
                  fontSize: '0.7rem', color: '#f97316',
                  background: 'rgba(249,115,22,0.08)',
                  border: '1px solid rgba(249,115,22,0.15)',
                  borderRadius: 20, padding: '2px 8px',
                }}>{t}</span>
              ))}
            </div>
          </div>

          {/* OWNER CARD */}
          <div
            className="namaste-role-card owner"
            onClick={() => onSelectRole('owner')}
            onMouseEnter={() => setHovered('owner')}
            onMouseLeave={() => setHovered(null)}
            id="role-owner"
          >
            <div className="card-glow" style={{
              background: 'radial-gradient(ellipse at center, rgba(139,92,246,0.08) 0%, transparent 70%)',
            }} />
            {/* Icon */}
            <div style={{
              width: 60, height: 60, borderRadius: 16,
              background: 'linear-gradient(135deg, rgba(139,92,246,0.2), rgba(139,92,246,0.05))',
              border: '1px solid rgba(139,92,246,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto',
              transition: 'all 0.3s',
              ...(hovered === 'owner' ? { background: 'linear-gradient(135deg, rgba(139,92,246,0.35), rgba(139,92,246,0.15))', transform: 'scale(1.1)' } : {}),
            }}>
              <Store size={28} color="#8b5cf6" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: '0 0 8px 0' }}>
              I'm a Shop Owner
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5, margin: 0 }}>
              Register your store, manage menu, track live orders and reviews
            </p>

            {/* Feature pills */}
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 5, marginTop: 14 }}>
              {['🏪 Register', '📦 Manage', '📊 Analytics'].map((t) => (
                <span key={t} style={{
                  fontSize: '0.7rem', color: '#8b5cf6',
                  background: 'rgba(139,92,246,0.08)',
                  border: '1px solid rgba(139,92,246,0.15)',
                  borderRadius: 20, padding: '2px 8px',
                }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Note */}
        <p style={{ textAlign: 'center', fontSize: '0.74rem', color: '#334155', lineHeight: 1.5 }}>
          <Sparkles size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4, color: '#475569' }} />
          Your choice is remembered on this device. Powered by MongoDB.
        </p>
      </div>
    </div>
  );
};
