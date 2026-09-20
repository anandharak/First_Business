import React, { useState, useEffect, useRef } from 'react';
import { Shop } from '../../types';
import { StoreService } from '../../services/storeService';
import {
  QrCode,
  Camera,
  Upload,
  Link2,
  X,
  Sparkles,
  CheckCircle2,
  Store,
  AlertCircle,
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CustomerQrScannerModalProps {
  onClose: () => void;
  onShopSelected: (shop: Shop, table?: string) => void;
}

export const CustomerQrScannerModal: React.FC<CustomerQrScannerModalProps> = ({
  onClose,
  onShopSelected,
}) => {
  const [tab, setTab] = useState<'camera' | 'upload' | 'direct'>('camera');
  const [shops, setShops] = useState<Shop[]>([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [manualInput, setManualInput] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    StoreService.getShops().then((res) => {
      setShops(res);
      setLoadingShops(false);
    });

    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setCameraError('');
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API is not supported in this browser. Please use Direct Link or Select Shop below.');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Camera access denied or unavailable:', err);
      setCameraError('Camera permission was denied or camera is unavailable. You can upload an image or choose your shop below.');
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (tab === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
  }, [tab]);

  const handleSelectShop = (shop: Shop, table: string = 'Table 1') => {
    playSound('success');
    stopCamera();
    onShopSelected(shop, table);
    onClose();
  };

  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const raw = manualInput.trim();
    if (!raw) return;

    let targetSlug = raw;
    let tableNum = 'Table 1';

    try {
      const url = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
      const shopParam = url.searchParams.get('shop');
      const tableParam = url.searchParams.get('table');
      if (shopParam) targetSlug = shopParam;
      if (tableParam) tableNum = decodeURIComponent(tableParam);
    } catch {
      // not a full URL, treat as slug/name
    }

    const match = shops.find(
      (s) =>
        s.slug.toLowerCase() === targetSlug.toLowerCase() ||
        s.name.toLowerCase() === targetSlug.toLowerCase() ||
        s.id === targetSlug
    );

    if (match) {
      handleSelectShop(match, tableNum);
    } else {
      setErrorMessage(`No shop matching "${targetSlug}". Select one from the available stores below.`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Simulate instant scan detection for demo
    if (shops.length > 0) {
      const selected = shops[0];
      handleSelectShop(selected, 'Table 1');
    } else {
      setErrorMessage('No registered shops found. Ask the owner to register their store first.');
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={() => {
        stopCamera();
        onClose();
      }}
      style={{ zIndex: 1100 }}
    >
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: 540, width: '92%', overflow: 'hidden' }}
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
                padding: 9,
                borderRadius: 12,
              }}
            >
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Scan Shop QR Code</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                Connect to any store's digital menu & place orders
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(255,255,255,0.02)',
          }}
        >
          <button
            onClick={() => setTab('camera')}
            style={{
              padding: '12px 8px',
              background: tab === 'camera' ? 'rgba(249, 115, 22, 0.12)' : 'none',
              border: 'none',
              borderBottom: tab === 'camera' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'camera' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Camera size={16} color={tab === 'camera' ? 'var(--primary)' : 'currentColor'} />
            Camera Scan
          </button>

          <button
            onClick={() => setTab('direct')}
            style={{
              padding: '12px 8px',
              background: tab === 'direct' ? 'rgba(249, 115, 22, 0.12)' : 'none',
              border: 'none',
              borderBottom: tab === 'direct' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'direct' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Link2 size={16} color={tab === 'direct' ? 'var(--primary)' : 'currentColor'} />
            Store Link / Code
          </button>

          <button
            onClick={() => setTab('upload')}
            style={{
              padding: '12px 8px',
              background: tab === 'upload' ? 'rgba(249, 115, 22, 0.12)' : 'none',
              border: 'none',
              borderBottom: tab === 'upload' ? '2px solid var(--primary)' : '2px solid transparent',
              color: tab === 'upload' ? '#fff' : 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Upload size={16} color={tab === 'upload' ? 'var(--primary)' : 'currentColor'} />
            Upload Photo
          </button>
        </div>

        {/* Tab 1: Live Camera */}
        {tab === 'camera' && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <div
              style={{
                width: '100%',
                maxWidth: 320,
                height: 240,
                margin: '0 auto 16px auto',
                background: '#0a0f1d',
                borderRadius: 16,
                position: 'relative',
                overflow: 'hidden',
                border: '2px dashed rgba(249, 115, 22, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <video
                ref={videoRef}
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  display: cameraActive ? 'block' : 'none',
                }}
              />

              {!cameraActive && (
                <div style={{ padding: 16, color: 'var(--text-muted)' }}>
                  <Camera size={36} color="var(--primary)" style={{ marginBottom: 8 }} />
                  <p style={{ fontSize: '0.82rem', margin: 0 }}>
                    {cameraError ? cameraError : 'Starting camera scanner…'}
                  </p>
                </div>
              )}

              {/* Viewfinder Target Frame */}
              <div
                style={{
                  position: 'absolute',
                  inset: 24,
                  border: '2px solid rgba(249, 115, 22, 0.8)',
                  borderRadius: 12,
                  boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.4)',
                  pointerEvents: 'none',
                }}
              >
                {/* Reticle corners */}
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    left: -2,
                    width: 16,
                    height: 16,
                    borderTop: '3px solid #fff',
                    borderLeft: '3px solid #fff',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderTop: '3px solid #fff',
                    borderRight: '3px solid #fff',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    left: -2,
                    width: 16,
                    height: 16,
                    borderBottom: '3px solid #fff',
                    borderLeft: '3px solid #fff',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 16,
                    height: 16,
                    borderBottom: '3px solid #fff',
                    borderRight: '3px solid #fff',
                  }}
                />
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: 8 }}>
              Align the shop's QR code standee inside the camera frame
            </p>
          </div>
        )}

        {/* Tab 2: Direct Link / Slug */}
        {tab === 'direct' && (
          <div style={{ padding: '24px' }}>
            <form onSubmit={handleDirectSubmit}>
              <label className="form-label">Enter Store Link, Slug, or Table URL</label>
              <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. royal-spice-bistro or paste store QR URL"
                  value={manualInput}
                  onChange={(e) => {
                    setManualInput(e.target.value);
                    setErrorMessage('');
                  }}
                />
                <button type="submit" className="btn btn-primary" style={{ flexShrink: 0 }}>
                  Connect
                </button>
              </div>
              {errorMessage && (
                <p style={{ color: '#f87171', fontSize: '0.8rem', marginTop: 4 }}>⚠️ {errorMessage}</p>
              )}
            </form>
          </div>
        )}

        {/* Tab 3: Upload Photo */}
        {tab === 'upload' && (
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <label
              style={{
                border: '2px dashed rgba(255,255,255,0.15)',
                borderRadius: 16,
                padding: '36px 20px',
                display: 'block',
                cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <Upload size={36} color="var(--primary)" style={{ marginBottom: 10 }} />
              <h4 style={{ fontSize: '0.95rem', margin: '0 0 6px 0', color: '#fff' }}>
                Upload QR Code Photo
              </h4>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                Select a picture from your camera roll or screenshot
              </p>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        )}

        {/* Instant Connect / Registered Shops List */}
        <div
          style={{
            padding: '16px 24px 24px 24px',
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(255,255,255,0.01)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <h4
              style={{
                fontSize: '0.78rem',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                margin: 0,
              }}
            >
              ⚡ Instant 1-Click Scan (Registered Stores)
            </h4>
            <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
              {shops.length} Available
            </span>
          </div>

          {loadingShops ? (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: 12 }}>
              Loading shops…
            </p>
          ) : shops.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '16px',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: 12,
              }}
            >
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                No shops registered yet. Register as a shop owner to add your store!
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              {shops.map((s) => (
                <div
                  key={s.id}
                  onClick={() => handleSelectShop(s, 'Table 1')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(249,115,22,0.4)';
                    e.currentTarget.style.background = 'rgba(249,115,22,0.06)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: 8,
                        overflow: 'hidden',
                        background: '#1e293b',
                        flexShrink: 0,
                      }}
                    >
                      <img
                        src={s.bannerUrl}
                        alt={s.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fff' }}>{s.name}</div>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                        🏪 {s.category} • {s.isOpen ? '🟢 Open' : '🔴 Closed'}
                      </div>
                    </div>
                  </div>

                  <button
                    className="btn btn-primary btn-sm"
                    style={{ padding: '5px 12px', fontSize: '0.75rem', borderRadius: 8 }}
                  >
                    Scan & Enter →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
