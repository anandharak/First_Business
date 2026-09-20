import React, { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Shop } from '../../types';
import { QrCode, Download, Printer, Copy, Check, ExternalLink, X, UtensilsCrossed } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface StoreQrModalProps {
  shop: Shop;
  onClose: () => void;
  onSimulateCustomerScan: (tableNum?: string) => void;
}

export const StoreQrModal: React.FC<StoreQrModalProps> = ({
  shop,
  onClose,
  onSimulateCustomerScan,
}) => {
  const [selectedTable, setSelectedTable] = useState<string>('Table 1');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  // Formulate the direct customer store link (including table param if dine-in)
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://shop.online';
  const targetUrl = `${baseUrl}?shop=${shop.slug}&table=${encodeURIComponent(selectedTable)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    playSound('click');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    playSound('click');
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${shop.slug}-${selectedTable.replace(/\s+/g, '-').toLowerCase()}-qr.png`;
    a.click();
  };

  const handlePrint = () => {
    playSound('click');
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520, textAlign: 'center' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
            <div style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: 8, borderRadius: 10 }}>
              <QrCode size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Store QR Code Standee</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scan to view menu, place order & pay</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px 20px' }}>
          {/* Table selector for restaurants/cafes */}
          {shop.tableCount > 0 && (
            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Select Table for Standee:</span>
                <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{selectedTable}</span>
              </label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', maxHeight: 85, overflowY: 'auto', padding: 4 }}>
                <button
                  className={`btn btn-sm ${selectedTable === 'General Store / Counter' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => { setSelectedTable('General Store / Counter'); playSound('click'); }}
                >
                  Counter QR
                </button>
                {Array.from({ length: shop.tableCount }, (_, i) => `Table ${i + 1}`).map((tbl) => (
                  <button
                    key={tbl}
                    className={`btn btn-sm ${selectedTable === tbl ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => { setSelectedTable(tbl); playSound('click'); }}
                  >
                    {tbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Printable Standee Card */}
          <div
            ref={qrRef}
            style={{
              background: '#ffffff',
              color: '#0f172a',
              borderRadius: 16,
              padding: '24px 20px',
              margin: '0 auto 20px auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              maxWidth: 340,
              border: '4px solid #f97316',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 8 }}>
              <UtensilsCrossed size={20} color="#f97316" />
              <h4 style={{ color: '#0f172a', fontSize: '1.2rem', fontWeight: 800 }}>{shop.name}</h4>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 14 }}>
              {shop.tagline}
            </p>

            <div style={{ background: '#f8fafc', padding: 14, borderRadius: 12, display: 'inline-block', border: '1px solid #e2e8f0' }}>
              <QRCodeCanvas
                value={targetUrl}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>

            <div style={{ marginTop: 14 }}>
              <div style={{
                background: '#ffedd5',
                color: '#c2410c',
                display: 'inline-block',
                padding: '4px 12px',
                borderRadius: 20,
                fontSize: '0.85rem',
                fontWeight: 700,
                marginBottom: 6,
              }}>
                📍 {selectedTable}
              </div>
              <p style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600 }}>
                Scan with your phone camera to order & pay
              </p>
            </div>
          </div>

          {/* Store Link Box */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '6px 12px',
            marginBottom: 20,
            gap: 10,
          }}>
            <input
              type="text"
              readOnly
              value={targetUrl}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.82rem',
                width: '100%',
                outline: 'none',
              }}
            />
            <button
              onClick={handleCopy}
              className="btn btn-secondary btn-sm"
              style={{ flexShrink: 0 }}
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>

          {/* Actions */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
            <button onClick={handleDownload} className="btn btn-secondary">
              <Download size={16} />
              Download QR
            </button>
            <button onClick={handlePrint} className="btn btn-secondary">
              <Printer size={16} />
              Print Card
            </button>
            <button
              onClick={() => {
                playSound('click');
                onSimulateCustomerScan(selectedTable);
              }}
              className="btn btn-primary"
            >
              <ExternalLink size={16} />
              Test Scan (Open Menu)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
