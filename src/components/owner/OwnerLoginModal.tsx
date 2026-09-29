import React, { useState } from 'react';
import { StoreService } from '../../services/storeService';
import { Shop } from '../../types';
import { Store, Eye, EyeOff, LogIn, X, AlertCircle } from 'lucide-react';

interface OwnerLoginModalProps {
  /** Pre-filled shop IDs owned by this device — user can pick one */
  knownShopIds: string[];
  onLoginSuccess: (shop: Shop) => void;
  onClose: () => void;
  /** Switch to registration instead */
  onRegisterNewShop: () => void;
}

export const OwnerLoginModal: React.FC<OwnerLoginModalProps> = ({
  knownShopIds,
  onLoginSuccess,
  onClose,
  onRegisterNewShop,
}) => {
  const [shopId, setShopId] = useState(knownShopIds[0] || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopId.trim() || !password.trim()) {
      setError('Please enter both Shop ID and Password.');
      triggerShake();
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const result = await StoreService.verifyShopPassword(shopId.trim(), password.trim());
      if (result.valid && result.shop) {
        onLoginSuccess(result.shop as Shop);
      } else {
        setError('Incorrect Shop ID or Password. Please try again.');
        triggerShake();
      }
    } catch {
      setError('Could not connect to server. Check your connection and try again.');
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <style>{`
        @keyframes owner-login-in { from{opacity:0;transform:scale(0.94) translateY(18px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes shake { 0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)} 60%{transform:translateX(-5px)} 80%{transform:translateX(5px)} }
        .owner-login-modal { animation: owner-login-in 0.4s cubic-bezier(0.34,1.56,0.64,1); }
        .owner-login-modal.shake { animation: shake 0.45s ease; }
        .ol-input {
          background: rgba(255,255,255,0.05);
          border: 1.5px solid rgba(255,255,255,0.1);
          border-radius: 12px;
          color: #fff;
          font-family: var(--font-body);
          font-size: 0.92rem;
          padding: 12px 14px;
          outline: none;
          width: 100%;
          box-sizing: border-box;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .ol-input:focus {
          border-color: rgba(139,92,246,0.55);
          box-shadow: 0 0 0 3px rgba(139,92,246,0.12);
        }
        .ol-input::placeholder { color: #475569; }
      `}</style>

      <div
        className={`owner-login-modal modal-content${shake ? ' shake' : ''}`}
        style={{ maxWidth: 420, padding: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(139,92,246,0.18), rgba(139,92,246,0.06))',
          borderBottom: '1px solid rgba(139,92,246,0.2)',
          padding: '24px 24px 20px 24px',
          textAlign: 'center',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 4 }}
          >
            <X size={18} />
          </button>

          <div style={{
            width: 60, height: 60, borderRadius: 18,
            background: 'linear-gradient(135deg, rgba(139,92,246,0.3), rgba(139,92,246,0.1))',
            border: '1.5px solid rgba(139,92,246,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 14px auto',
          }}>
            <Store size={28} color="#8b5cf6" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', margin: '0 0 6px 0' }}>
            Owner Login
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.82rem', margin: 0 }}>
            Enter your Shop ID &amp; Password to access your dashboard
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} style={{ padding: '24px' }}>
          {/* Shop ID dropdown (if known IDs) or free input */}
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              🆔 Shop ID
            </label>
            {knownShopIds.length > 0 ? (
              <select
                className="ol-input"
                value={shopId}
                onChange={(e) => { setShopId(e.target.value); setError(''); }}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff', fontSize: '0.88rem', padding: '12px 14px', outline: 'none', width: '100%', boxSizing: 'border-box' }}
              >
                {knownShopIds.map((id) => (
                  <option key={id} value={id} style={{ background: '#1e293b', color: '#fff' }}>
                    {id}
                  </option>
                ))}
                <option value="_other_" style={{ background: '#1e293b', color: '#94a3b8' }}>✏️ Enter a different Shop ID…</option>
              </select>
            ) : (
              <input
                type="text"
                className="ol-input"
                placeholder="e.g. shop-1234567890"
                value={shopId}
                onChange={(e) => { setShopId(e.target.value); setError(''); }}
              />
            )}
            {shopId === '_other_' && (
              <input
                type="text"
                className="ol-input"
                placeholder="Paste your Shop ID"
                style={{ marginTop: 10 }}
                onChange={(e) => { setShopId(e.target.value); setError(''); }}
              />
            )}
          </div>

          {/* Password */}
          <div className="form-group" style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              🔑 Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="ol-input"
                placeholder="Enter your owner password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                style={{ paddingRight: 44 }}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 4 }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 8,
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: '10px 12px', marginBottom: 16,
              color: '#f87171', fontSize: '0.82rem', lineHeight: 1.5,
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary btn-lg"
            style={{ width: '100%', justifyContent: 'center', borderRadius: 14, marginBottom: 14, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)' }}
          >
            {isLoading ? (
              <>
                <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                Verifying…
              </>
            ) : (
              <>
                <LogIn size={18} />
                Login to Dashboard
              </>
            )}
          </button>

          <div style={{ textAlign: 'center' }}>
            <button
              type="button"
              onClick={onRegisterNewShop}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '0.8rem' }}
            >
              Don't have a shop yet?{' '}
              <span style={{ color: '#8b5cf6', fontWeight: 700 }}>Register a new shop →</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
