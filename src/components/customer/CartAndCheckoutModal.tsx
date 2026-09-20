import React, { useState } from 'react';
import { CartItem, Shop, OrderType, PaymentMethod, Order } from '../../types';
import { StoreService } from '../../services/storeService';
import {
  ShoppingBag,
  X,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Banknote,
  QrCode,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Phone,
  User,
  MapPin
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../../utils/audio';

interface CartAndCheckoutModalProps {
  cart: CartItem[];
  shop: Shop;
  tableParam?: string;
  onClose: () => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onOrderConfirmed: (order: Order) => void;
}

export const CartAndCheckoutModal: React.FC<CartAndCheckoutModalProps> = ({
  cart,
  shop,
  tableParam,
  onClose,
  onUpdateQuantity,
  onOrderConfirmed,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'online_payment_sim'>('cart');
  const [orderType, setOrderType] = useState<OrderType>(tableParam ? 'dine_in' : 'dine_in');
  const [tableOrAddress, setTableOrAddress] = useState(tableParam || 'Table 1');
  const [customerName, setCustomerName] = useState('Anand');
  const [customerPhone, setCustomerPhone] = useState('+91 98765 43210');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('online');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Financial calculations
  const subtotal = cart.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const discount = subtotal > 500 ? 50 : 0;
  const tax = Math.round(subtotal * 0.05); // 5% GST/Service tax
  const deliveryFee = orderType === 'delivery' ? (subtotal >= shop.freeDeliveryAbove ? 0 : shop.deliveryCharge) : 0;
  const grandTotal = subtotal - discount + tax + deliveryFee;

  const handlePlaceOrder = () => {
    if (paymentMethod === 'online') {
      // Simulate UPI online payment modal
      playSound('click');
      setStep('online_payment_sim');
      setIsProcessingPayment(true);

      setTimeout(() => {
        setIsProcessingPayment(false);
        finalizeOrder('online');
      }, 2000);
    } else {
      finalizeOrder('cash');
    }
  };

  const finalizeOrder = async (method: PaymentMethod) => {
    playSound('success');
    try {
      confetti({
        particleCount: 100,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch {
      // ignore
    }

    try {
      const created = await StoreService.createOrder({
        shopId: shop.id,
        customerName: customerName.trim() || 'Guest Customer',
        customerPhone: customerPhone.trim() || '+91 99999 88888',
        orderType,
        tableOrAddress: tableOrAddress.trim() || (orderType === 'dine_in' ? 'Table 1' : 'Store Pickup'),
        items: cart,
        subtotal,
        discount,
        deliveryFee,
        tax,
        total: grandTotal,
        paymentMethod: method,
      });

      onOrderConfirmed(created);
    } catch (err) {
      console.error('Failed to create order in MongoDB:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: 10, borderRadius: 12 }}>
              <ShoppingBag size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>
                {step === 'cart' ? 'Review Your Cart' : step === 'checkout' ? 'Fulfillment & Payment' : 'Secure Online Payment'}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {shop.name} • {cart.reduce((sum, i) => sum + i.quantity, 0)} items
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* STEP 1: CART REVIEW */}
        {step === 'cart' && (
          <div style={{ padding: '24px' }}>
            {cart.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 10px' }}>
                <ShoppingBag size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
                <h3>Your cart is empty</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                  Add dishes from the menu to place an order.
                </p>
                <button onClick={onClose} className="btn btn-primary" style={{ marginTop: 16 }}>
                  Browse Menu
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 300, overflowY: 'auto', paddingRight: 6, marginBottom: 20 }}>
                  {cart.map((item) => (
                    <div
                      key={item.product.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'rgba(255,255,255,0.03)',
                        borderRadius: 12,
                        border: '1px solid var(--border-subtle)',
                        gap: 12,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.name}
                          style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.product.dietary && <span className={`diet-badge ${item.product.dietary}`} />}
                            <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>{item.product.name}</h4>
                          </div>
                          <p style={{ fontSize: '0.82rem', color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>
                            {shop.currency}{item.product.discountPrice || item.product.price}
                          </p>
                        </div>
                      </div>

                      {/* Stepper */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button
                          onClick={() => { playSound('click'); onUpdateQuantity(item.product.id, -1); }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'rgba(255,255,255,0.08)',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span style={{ fontWeight: 700, fontSize: '0.95rem', minWidth: 20, textAlign: 'center' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => { playSound('click'); onUpdateQuantity(item.product.id, 1); }}
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 6,
                            background: 'var(--primary)',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal breakdown */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: 12, marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Subtotal</span>
                    <span>{shop.currency}{subtotal}</span>
                  </div>
                  {discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: '#10b981', marginBottom: 6 }}>
                      <span>Special Discount</span>
                      <span>-{shop.currency}{discount}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: 6 }}>
                    <span>Taxes & Restaurant Charges (5%)</span>
                    <span>{shop.currency}{tax}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.25rem', fontWeight: 800, color: '#fff', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                    <span>Total Amount</span>
                    <span style={{ color: 'var(--primary)' }}>{shop.currency}{grandTotal}</span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                  <button onClick={onClose} className="btn btn-secondary">
                    Add More Items
                  </button>
                  <button
                    onClick={() => { playSound('click'); setStep('checkout'); }}
                    className="btn btn-primary btn-lg"
                  >
                    Proceed to Details & Payment <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: DETAILS & PAYMENT METHOD CHOICE */}
        {step === 'checkout' && (
          <div style={{ padding: '24px' }}>
            {/* Dining / Serving Type */}
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">How would you like to receive your order?</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <button
                  type="button"
                  onClick={() => { setOrderType('dine_in'); playSound('click'); }}
                  className={`btn ${orderType === 'dine_in' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', padding: '10px' }}
                >
                  🍽️ Dine-In Table
                </button>
                <button
                  type="button"
                  onClick={() => { setOrderType('takeaway'); playSound('click'); }}
                  className={`btn ${orderType === 'takeaway' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', padding: '10px' }}
                >
                  🛍️ Takeaway / Pickup
                </button>
                <button
                  type="button"
                  onClick={() => { setOrderType('delivery'); playSound('click'); }}
                  className={`btn ${orderType === 'delivery' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ fontSize: '0.85rem', padding: '10px' }}
                >
                  🛵 Home Delivery
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 20 }}>
              {orderType === 'dine_in' ? (
                <div className="form-group">
                  <label className="form-label">Table Number / Section</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={tableOrAddress}
                    onChange={(e) => setTableOrAddress(e.target.value)}
                    placeholder="e.g. Table 4"
                  />
                </div>
              ) : orderType === 'delivery' ? (
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Delivery Street Address & Landmark</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    value={tableOrAddress}
                    onChange={(e) => setTableOrAddress(e.target.value)}
                    placeholder="Flat / House No., Landmark, Area"
                  />
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Pickup Name / Token</label>
                  <input
                    type="text"
                    className="form-input"
                    value={tableOrAddress}
                    onChange={(e) => setTableOrAddress(e.target.value)}
                    placeholder="Self Pickup Counter"
                  />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input
                  type="text"
                  required
                  className="form-input"
                  placeholder="e.g. Anand"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number (For Order Updates) *</label>
                <input
                  type="tel"
                  required
                  className="form-input"
                  placeholder="+91 98765 43210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
              </div>
            </div>

            {/* CUSTOMER'S PAYMENT OPTION CHOICE */}
            <div style={{ marginBottom: 24 }}>
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Choose Payment Method *</span>
                <span style={{ color: 'var(--primary)', textTransform: 'none', fontWeight: 600 }}>Customer's Choice</span>
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {/* Online Payment Option */}
                <div
                  onClick={() => { setPaymentMethod('online'); playSound('click'); }}
                  style={{
                    padding: '16px',
                    borderRadius: 14,
                    border: paymentMethod === 'online' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'online' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <CreditCard size={22} color={paymentMethod === 'online' ? 'var(--primary)' : '#94a3b8'} />
                    {paymentMethod === 'online' && <CheckCircle2 size={18} color="var(--primary)" />}
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Online Payment</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Pay via UPI (GPay, PhonePe, Paytm) or Card
                  </p>
                  <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 700, marginTop: 6 }}>
                    ⚡ Instant Order Confirmation
                  </div>
                </div>

                {/* Cash Payment Option */}
                <div
                  onClick={() => { setPaymentMethod('cash'); playSound('click'); }}
                  style={{
                    padding: '16px',
                    borderRadius: 14,
                    border: paymentMethod === 'cash' ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    background: paymentMethod === 'cash' ? 'rgba(249, 115, 22, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Banknote size={22} color={paymentMethod === 'cash' ? 'var(--primary)' : '#94a3b8'} />
                    {paymentMethod === 'cash' && <CheckCircle2 size={18} color="var(--primary)" />}
                  </div>
                  <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>Pay in Cash</h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                    Pay Cash to server at table or on counter/delivery
                  </p>
                  <div style={{ fontSize: '0.72rem', color: '#fbbf24', fontWeight: 700, marginTop: 6 }}>
                    💵 Pay After Receiving Food
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Amount Payable</span>
                <p style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)', lineHeight: 1 }}>
                  {shop.currency}{grandTotal}
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setStep('cart')} className="btn btn-secondary">
                  Back to Cart
                </button>
                <button
                  type="button"
                  onClick={handlePlaceOrder}
                  className="btn btn-primary btn-lg"
                >
                  <Sparkles size={18} />
                  {paymentMethod === 'online' ? 'Pay Online & Confirm' : 'Confirm Order with Cash'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: ONLINE SIMULATED UPI PAYMENT */}
        {step === 'online_payment_sim' && (
          <div style={{ padding: '40px 24px', textAlign: 'center' }}>
            {isProcessingPayment ? (
              <div>
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  border: '3px solid var(--primary-glow)',
                  borderTopColor: 'var(--primary)',
                  animation: 'spin 1s linear infinite',
                  margin: '0 auto 20px auto',
                }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                <h3 style={{ fontSize: '1.3rem' }}>Connecting to {shop.upiId}...</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 6 }}>
                  Simulating secure UPI payment verification of {shop.currency}{grandTotal}...
                </p>
              </div>
            ) : (
              <div>
                <div style={{ color: '#10b981', margin: '0 auto 16px auto' }}>
                  <CheckCircle2 size={64} />
                </div>
                <h3 style={{ fontSize: '1.4rem' }}>Payment Successful!</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6 }}>
                  Transaction verified. Order dispatched to kitchen!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
