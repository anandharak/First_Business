import React, { useState, useEffect } from 'react';
import { Shop, Product, Order, Review, OrderStatus } from '../../types';
import { StoreService, subscribeToStoreEvents } from '../../services/storeService';
import {
  Utensils,
  Plus,
  QrCode,
  Store,
  DollarSign,
  Clock,
  CheckCircle,
  Star,
  Phone,
  ChefHat,
  BellRing,
  Trash2,
  Edit2,
  Coffee,
  ShoppingBag,
  ExternalLink,
  RefreshCw,
  Power
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface OwnerDashboardProps {
  currentShop: Shop;
  onOpenQrModal: () => void;
  onOpenRegisterShop: () => void;
  onOpenAddProduct: (product?: Product) => void;
  onDeleteAccount?: (shopId: string) => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  currentShop,
  onOpenQrModal,
  onOpenRegisterShop,
  onOpenAddProduct,
  onDeleteAccount,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'reviews' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderStatus | 'all'>('all');
  const [menuSearch, setMenuSearch] = useState('');
  const [deleteConfirmStep, setDeleteConfirmStep] = useState(0); // 0=idle, 1=first, 2=typing
  const [deleteTyped, setDeleteTyped] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    try {
      const [ord, prod, rev] = await Promise.all([
        StoreService.getOrders(currentShop.id),
        StoreService.getProducts(currentShop.id),
        StoreService.getReviews(currentShop.id),
      ]);
      setOrders(ord);
      setProducts(prod);
      setReviews(rev);
    } catch (err) {
      console.error('Failed to load data from MongoDB:', err);
    }
  };

  useEffect(() => {
    loadData();
    const unsubscribe = subscribeToStoreEvents((event) => {
      if (
        event.type === 'order_created' ||
        event.type === 'order_status_updated' ||
        event.type === 'product_added' ||
        event.type === 'product_updated' ||
        event.type === 'product_deleted' ||
        event.type === 'review_submitted' ||
        event.type === 'shop_updated'
      ) {
        loadData();
      }
    });
    return unsubscribe;
  }, [currentShop.id]);

  // Status transitions
  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    if (status === 'preparing') playSound('preparing');
    else if (status === 'ready') playSound('ready');
    else if (status === 'completed') playSound('success');
    else playSound('click');

    await StoreService.updateOrderStatus(orderId, status);
    loadData();
  };

  // Toggle store open/closed
  const handleToggleStoreStatus = async () => {
    playSound('click');
    await StoreService.updateShop(currentShop.id, { isOpen: !currentShop.isOpen });
  };

  // Delete product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the menu in MongoDB?`)) {
      playSound('click');
      await StoreService.deleteProduct(id);
      loadData();
    }
  };

  // Toggle availability
  const handleToggleAvailability = async (prod: Product) => {
    playSound('click');
    await StoreService.updateProduct(prod.id, { isAvailable: !prod.isAvailable });
    loadData();
  };

  // KPIs
  const totalRevenue = orders
    .filter((o) => o.status === 'completed')
    .reduce((sum, o) => sum + o.total, 0);

  const activeOrdersCount = orders.filter(
    (o) => o.status === 'received' || o.status === 'preparing' || o.status === 'ready'
  ).length;

  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '5.0';

  const filteredOrders = orderFilter === 'all'
    ? orders
    : orders.filter((o) => o.status === orderFilter);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(menuSearch.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 20px 80px 20px' }}>
      {/* Top Banner with Store Controls */}
      <div
        className="glass-panel"
        style={{
          padding: '24px',
          marginBottom: 24,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: 16,
                overflow: 'hidden',
                border: '2px solid var(--primary)',
                flexShrink: 0,
              }}
            >
              <img
                src={currentShop.bannerUrl}
                alt={currentShop.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{currentShop.name}</h1>
                <span className="brand-badge" style={{ textTransform: 'capitalize' }}>
                  {currentShop.category}
                </span>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    background: currentShop.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: currentShop.isOpen ? '#34d399' : '#f87171',
                    border: `1px solid ${currentShop.isOpen ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: currentShop.isOpen ? '#10b981' : '#ef4444',
                    }}
                  />
                  {currentShop.isOpen ? 'Accepting Orders' : 'Store Closed'}
                </span>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: 4 }}>
                {currentShop.tagline} • UPI: <span style={{ color: '#fff' }}>{currentShop.upiId}</span>
              </p>
            </div>
          </div>

          {/* Top action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <button
              onClick={handleToggleStoreStatus}
              className={`btn btn-sm ${currentShop.isOpen ? 'btn-secondary' : 'btn-emerald'}`}
              title="Toggle Store Online/Offline Status"
            >
              <Power size={15} />
              {currentShop.isOpen ? 'Close Store' : 'Open Store'}
            </button>

            <button onClick={onOpenQrModal} className="btn btn-primary btn-sm">
              <QrCode size={16} />
              Store QR Code & Standee
            </button>

            <button onClick={onOpenRegisterShop} className="btn btn-secondary btn-sm">
              <Store size={16} />
              + New Shop
            </button>


          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Completed Revenue
              </p>
              <h2 style={{ fontSize: '1.8rem', marginTop: 6, color: '#10b981' }}>
                {currentShop.currency}{totalRevenue.toLocaleString()}
              </h2>
            </div>
            <div style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', padding: 10, borderRadius: 12 }}>
              <DollarSign size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 8 }}>
            From {orders.filter((o) => o.status === 'completed').length} completed orders
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Live Active Orders
              </p>
              <h2 style={{ fontSize: '1.8rem', marginTop: 6, color: activeOrdersCount > 0 ? '#f59e0b' : '#fff' }}>
                {activeOrdersCount}
              </h2>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: 10, borderRadius: 12 }}>
              <Clock size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 8 }}>
            Awaiting preparation or pickup
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Total Items in Menu
              </p>
              <h2 style={{ fontSize: '1.8rem', marginTop: 6 }}>
                {products.length}
              </h2>
            </div>
            <div style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', padding: 10, borderRadius: 12 }}>
              <Utensils size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 8 }}>
            {products.filter((p) => p.isAvailable).length} currently in stock
          </p>
        </div>

        <div className="glass-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase' }}>
                Customer Rating
              </p>
              <h2 style={{ fontSize: '1.8rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, color: '#f59e0b' }}>
                <Star size={24} fill="#f59e0b" color="#f59e0b" />
                {averageRating}
              </h2>
            </div>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: 10, borderRadius: 12 }}>
              <CheckCircle size={24} />
            </div>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 8 }}>
            Based on {reviews.length} post-meal reviews
          </p>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('orders'); playSound('click'); }}
            style={{ borderRadius: '12px 12px 0 0' }}
          >
            <ChefHat size={18} />
            Live Kitchen / Orders
            {activeOrdersCount > 0 && (
              <span style={{ background: '#fff', color: 'var(--primary)', padding: '1px 6px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 800 }}>
                {activeOrdersCount}
              </span>
            )}
          </button>

          <button
            className={`btn ${activeTab === 'menu' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('menu'); playSound('click'); }}
            style={{ borderRadius: '12px 12px 0 0' }}
          >
            <Utensils size={18} />
            Product & Dish Menu ({products.length})
          </button>

          <button
            className={`btn ${activeTab === 'reviews' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('reviews'); playSound('click'); }}
            style={{ borderRadius: '12px 12px 0 0' }}
          >
            <Star size={18} />
            Customer Ratings ({reviews.length})
          </button>

          <button
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setActiveTab('settings'); playSound('click'); }}
            style={{ borderRadius: '12px 12px 0 0' }}
          >
            ⚙️ Settings
          </button>
        </div>

        {activeTab === 'menu' && (
          <button onClick={() => onOpenAddProduct()} className="btn btn-emerald btn-sm">
            <Plus size={16} />
            Add New Dish / Product
          </button>
        )}
      </div>

      {/* TAB 1: LIVE ORDERS PIPELINE */}
      {activeTab === 'orders' && (
        <div>
          {/* Order Status Filters */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
            {(['all', 'received', 'preparing', 'ready', 'completed'] as const).map((st) => (
              <button
                key={st}
                onClick={() => { setOrderFilter(st); playSound('click'); }}
                className={`btn btn-sm ${orderFilter === st ? 'btn-primary' : 'btn-secondary'}`}
                style={{ textTransform: 'capitalize' }}
              >
                {st === 'all' ? 'All Orders' : st}
                <span style={{ opacity: 0.7, marginLeft: 4 }}>
                  ({st === 'all' ? orders.length : orders.filter((o) => o.status === st).length})
                </span>
              </button>
            ))}
          </div>

          {filteredOrders.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <ChefHat size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px auto', display: 'block' }} />
              <h3>No {orderFilter !== 'all' ? orderFilter : ''} orders yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 6, maxWidth: 440, margin: '6px auto 0 auto', lineHeight: 1.6 }}>
                Share your store's QR code or link with customers. When they place an order, it will instantly appear here with a sound alert. Use the <strong>QR Code</strong> button above to get your store link.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
              {filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="glass-card"
                  style={{
                    padding: '20px',
                    borderLeft: `4px solid ${
                      order.status === 'received'
                        ? '#3b82f6'
                        : order.status === 'preparing'
                        ? '#f59e0b'
                        : order.status === 'ready'
                        ? '#10b981'
                        : '#64748b'
                    }`,
                  }}
                >
                  {/* Order Card Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                          {order.orderNumber}
                        </span>
                        <span className={`badge-status badge-${order.status}`}>
                          {order.status === 'preparing' ? '🍳 Preparing' : order.status === 'ready' ? '🔔 Ready' : order.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {order.orderType === 'dine_in' ? '🍽️ Dine-In' : order.orderType === 'takeaway' ? '🛍️ Takeaway' : '🛵 Delivery'}
                      </p>
                    </div>

                    <div style={{
                      background: order.paymentMethod === 'online' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                      color: order.paymentMethod === 'online' ? '#34d399' : '#fbbf24',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      border: `1px solid ${order.paymentMethod === 'online' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`,
                    }}>
                      {order.paymentMethod === 'online' ? '💳 Paid Online (UPI)' : '💵 Pay Cash at Counter'}
                    </div>
                  </div>

                  {/* Customer & Location */}
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 8, marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.86rem' }}>
                      <span style={{ fontWeight: 600, color: '#fff' }}>{order.customerName}</span>
                      <span style={{ color: 'var(--primary)', fontWeight: 700 }}>📍 {order.tableOrAddress}</span>
                    </div>
                    {order.customerPhone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                        <Phone size={12} /> {order.customerPhone}
                      </div>
                    )}
                  </div>

                  {/* Items list */}
                  <div style={{ marginBottom: 16 }}>
                    <p style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
                      Ordered Items:
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {order.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {item.product.dietary && (
                              <span className={`diet-badge ${item.product.dietary}`} />
                            )}
                            <span>{item.product.name}</span>
                            <strong style={{ color: 'var(--primary)' }}>x{item.quantity}</strong>
                          </span>
                          <span style={{ color: 'var(--text-muted)' }}>
                            {currentShop.currency}{(item.product.discountPrice || item.product.price) * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Total & Action Pipeline Buttons */}
                  <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Bill:</span>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                        {currentShop.currency}{order.total}
                      </span>
                    </div>

                    {/* Sequential Status Flow Buttons */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {order.status === 'received' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'preparing')}
                          className="btn btn-primary"
                          style={{ width: '100%' }}
                        >
                          <ChefHat size={16} />
                          Accept & Start Preparing
                        </button>
                      )}

                      {order.status === 'preparing' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'ready')}
                          className="btn btn-emerald"
                          style={{ width: '100%' }}
                        >
                          <BellRing size={16} />
                          Mark Ready & Notify Customer
                        </button>
                      )}

                      {order.status === 'ready' && (
                        <button
                          onClick={() => handleUpdateStatus(order.id, 'completed')}
                          className="btn btn-primary"
                          style={{ width: '100%', background: 'linear-gradient(135deg, #10b981, #047857)' }}
                        >
                          <CheckCircle size={16} />
                          Complete & Request Rating
                        </button>
                      )}

                      {order.status === 'completed' && (
                        <div style={{ width: '100%', textAlign: 'center', fontSize: '0.82rem', color: '#10b981', fontWeight: 600, padding: 6, background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
                          ✓ Order Completed & Fulfilled
                          {order.rating && ` • Rated ⭐ ${order.rating}/5`}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PRODUCT & DISH MENU */}
      {activeTab === 'menu' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
            <input
              type="text"
              className="form-input"
              style={{ maxWidth: 360 }}
              placeholder="Search dishes or categories..."
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
            />
            <button onClick={() => onOpenAddProduct()} className="btn btn-emerald">
              <Plus size={16} />
              Add New Dish / Product
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 18 }}>
            {filteredProducts.map((prod) => (
              <div key={prod.id} className="glass-card" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ position: 'relative', height: 160, overflow: 'hidden' }}>
                  <img
                    src={prod.imageUrl}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {prod.dietary && prod.dietary !== 'none' && (
                    <div style={{ position: 'absolute', top: 10, left: 10, background: '#fff', padding: 4, borderRadius: 4, display: 'flex' }}>
                      <span className={`diet-badge ${prod.dietary}`} />
                    </div>
                  )}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span style={{
                      background: prod.isAvailable ? '#10b981' : '#ef4444',
                      color: '#fff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 12,
                    }}>
                      {prod.isAvailable ? 'In Stock' : 'Out of Stock'}
                    </span>
                  </div>
                </div>

                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>
                      {prod.category}
                    </span>
                    <h3 style={{ fontSize: '1.05rem', marginTop: 2, marginBottom: 4 }}>{prod.name}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineClamp: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {prod.description}
                    </p>
                  </div>

                  <div style={{ marginTop: 14, paddingTop: 10, borderTop: '1px solid var(--border-subtle)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <div>
                        <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>
                          {currentShop.currency}{prod.discountPrice || prod.price}
                        </span>
                        {prod.discountPrice && (
                          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textDecoration: 'line-through', marginLeft: 6 }}>
                            {currentShop.currency}{prod.price}
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        ⏱️ {prod.prepTime}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => handleToggleAvailability(prod)}
                        className={`btn btn-sm ${prod.isAvailable ? 'btn-secondary' : 'btn-emerald'}`}
                        style={{ flex: 1 }}
                      >
                        {prod.isAvailable ? 'Mark Unavailable' : 'Mark Available'}
                      </button>
                      <button
                        onClick={() => onOpenAddProduct(prod)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Dish"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id, prod.name)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#ef4444' }}
                        title="Delete Dish"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER RATINGS & REVIEWS */}
      {activeTab === 'reviews' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: '1.25rem' }}>Customer Post-Meal Reviews</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Real feedback and taste ratings submitted by customers after eating.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245, 158, 11, 0.15)', padding: '8px 16px', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
              <Star size={22} fill="#f59e0b" color="#f59e0b" />
              <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f59e0b' }}>{averageRating}</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ 5.0</span>
            </div>
          </div>

          {reviews.length === 0 ? (
            <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
              <Star size={44} color="var(--text-muted)" style={{ margin: '0 auto 14px auto', display: 'block' }} />
              <h3>No reviews yet</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                When customers complete their order and meal, their ratings and reviews will appear here.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
              {reviews.map((rev) => (
                <div key={rev.id} className="glass-card" style={{ padding: '20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div>
                      <h4 style={{ fontSize: '1rem' }}>{rev.customerName}</h4>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                        {new Date(rev.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={15}
                          fill={i < rev.rating ? '#f59e0b' : 'none'}
                          color={i < rev.rating ? '#f59e0b' : '#64748b'}
                        />
                      ))}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.88rem', color: '#e2e8f0', marginBottom: 12, lineHeight: 1.4 }}>
                    "{rev.comment}"
                  </p>

                  {rev.tags && rev.tags.length > 0 && (
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                      {rev.tags.map((tg, idx) => (
                        <span
                          key={idx}
                          style={{
                            background: 'rgba(249, 115, 22, 0.12)',
                            color: 'var(--primary)',
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: 10,
                            fontWeight: 600,
                          }}
                        >
                          ✓ {tg}
                        </span>
                      ))}
                    </div>
                  )}

                  {rev.dishNames && rev.dishNames.length > 0 && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      Dishes enjoyed: <strong style={{ color: '#fff' }}>{rev.dishNames.join(', ')}</strong>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SETTINGS / DANGER ZONE */}
      {activeTab === 'settings' && (
        <div style={{ maxWidth: 560 }}>
          {/* Shop Info */}
          <div className="glass-panel" style={{ padding: '20px 24px', marginBottom: 20 }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', margin: '0 0 14px 0' }}>Shop Information</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Shop Name</span>
                <span style={{ color: '#fff', fontWeight: 600 }}>{currentShop.name}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Shop ID</span>
                <code style={{ color: '#818cf8', fontFamily: 'monospace', fontSize: '0.82rem' }}>{currentShop.id}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Category</span>
                <span style={{ color: '#fff', fontWeight: 600, textTransform: 'capitalize' }}>{currentShop.category}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: '#64748b' }}>Slug / Link</span>
                <code style={{ color: '#f97316', fontFamily: 'monospace', fontSize: '0.8rem' }}>?shop={currentShop.slug}</code>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div style={{
            border: '1.5px solid rgba(239,68,68,0.3)',
            borderRadius: 16, padding: '20px 24px',
            background: 'rgba(239,68,68,0.04)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Trash2 size={18} color="#f87171" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#f87171', margin: 0 }}>Danger Zone</h3>
            </div>
            <p style={{ color: '#64748b', fontSize: '0.84rem', lineHeight: 1.6, marginBottom: 18 }}>
              Permanently delete this shop account. This will remove all products, orders, and reviews from the database. <strong style={{ color: '#f87171' }}>This action cannot be undone.</strong>
            </p>

            {deleteConfirmStep === 0 && (
              <button
                onClick={() => setDeleteConfirmStep(1)}
                className="btn btn-sm"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <Trash2 size={14} />
                Delete My Shop Account
              </button>
            )}

            {deleteConfirmStep === 1 && (
              <div style={{ animation: 'fadeUp 0.3s ease' }}>
                <p style={{ color: '#fbbf24', fontSize: '0.83rem', marginBottom: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '10px 12px', lineHeight: 1.5 }}>
                  ⚠️ Are you sure? Type <strong style={{ color: '#fff', fontFamily: 'monospace' }}>DELETE</strong> below to confirm.
                </p>
                <input
                  type="text"
                  className="form-input"
                  placeholder='Type DELETE to confirm'
                  value={deleteTyped}
                  onChange={(e) => setDeleteTyped(e.target.value)}
                  style={{ marginBottom: 12 }}
                />
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setDeleteConfirmStep(0); setDeleteTyped(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleteTyped !== 'DELETE' || isDeleting}
                    onClick={async () => {
                      if (deleteTyped !== 'DELETE') return;
                      setIsDeleting(true);
                      try {
                        await StoreService.deleteShop(currentShop.id);
                        if (onDeleteAccount) onDeleteAccount(currentShop.id);
                      } finally {
                        setIsDeleting(false);
                      }
                    }}
                    className="btn btn-sm"
                    style={{
                      background: deleteTyped === 'DELETE' ? 'rgba(239,68,68,0.85)' : 'rgba(239,68,68,0.15)',
                      border: '1px solid rgba(239,68,68,0.4)',
                      color: deleteTyped === 'DELETE' ? '#fff' : '#f87171',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'all 0.2s',
                    }}
                  >
                    {isDeleting ? (
                      <>
                        <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        Deleting…
                      </>
                    ) : (
                      <><Trash2 size={14} /> Permanently Delete</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
