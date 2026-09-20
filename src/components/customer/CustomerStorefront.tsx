import React, { useState, useEffect, useMemo } from 'react';
import { Shop, Product, CartItem, Order } from '../../types';
import { StoreService, subscribeToStoreEvents } from '../../services/storeService';
import {
  Search,
  ShoppingBag,
  Star,
  Clock,
  Plus,
  Minus,
  Check,
  UtensilsCrossed,
  MapPin,
  ChevronRight,
  Flame
} from 'lucide-react';
import { playSound } from '../../utils/audio';

interface CustomerStorefrontProps {
  shop: Shop;
  tableParam?: string;
  cart: CartItem[];
  activeOrder?: Order | null;
  onAddToCart: (product: Product) => void;
  onUpdateQuantity: (productId: string, delta: number) => void;
  onOpenCart: () => void;
  onOpenLiveOrder: (orderId: string) => void;
}

export const CustomerStorefront: React.FC<CustomerStorefrontProps> = ({
  shop,
  tableParam,
  cart,
  activeOrder,
  onAddToCart,
  onUpdateQuantity,
  onOpenCart,
  onOpenLiveOrder,
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'non-veg'>('all');

  const loadProducts = async () => {
    try {
      const prods = await StoreService.getProducts(shop.id);
      setProducts(prods);
    } catch (err) {
      console.error('Failed to load products from MongoDB:', err);
    }
  };

  useEffect(() => {
    loadProducts();
    const unsub = subscribeToStoreEvents((event) => {
      if (
        event.type === 'product_added' ||
        event.type === 'product_updated' ||
        event.type === 'product_deleted' ||
        event.type === 'store_reset'
      ) {
        loadProducts();
      }
    });
    return unsub;
  }, [shop.id]);

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(products.map((p) => p.category)));
    return ['all', ...cats];
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      const matchesDiet =
        dietaryFilter === 'all' ||
        (dietaryFilter === 'veg' && p.dietary === 'veg') ||
        (dietaryFilter === 'non-veg' && p.dietary === 'non-veg');

      return matchesSearch && matchesCat && matchesDiet;
    });
  }, [products, searchQuery, selectedCategory, dietaryFilter]);

  // Total cart count & price
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => {
    const price = item.product.discountPrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const isFood = shop.category === 'food' || shop.category === 'cafe';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '16px 16px 100px 16px' }}>
      {/* Active Order Banner if customer has placed an order */}
      {activeOrder && activeOrder.status !== 'completed' && activeOrder.status !== 'cancelled' && (
        <div
          onClick={() => onOpenLiveOrder(activeOrder.id)}
          style={{
            background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25), rgba(245, 158, 11, 0.2))',
            border: '1px solid var(--primary)',
            borderRadius: 14,
            padding: '12px 18px',
            marginBottom: 18,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 20px var(--primary-glow)',
            animation: 'slideUp 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: '1.4rem' }}>
              {activeOrder.status === 'preparing' ? '👨‍🍳' : activeOrder.status === 'ready' ? '🔔' : '⏱️'}
            </span>
            <div>
              <h4 style={{ fontSize: '0.98rem', fontWeight: 700 }}>
                Order #{activeOrder.orderNumber} is{' '}
                <span style={{ color: 'var(--primary)', textTransform: 'capitalize' }}>
                  {activeOrder.status === 'preparing' ? 'Being Prepared Fresh' : activeOrder.status}
                </span>
              </h4>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Click to view live kitchen tracking & status updates
              </p>
            </div>
          </div>
          <button className="btn btn-primary btn-sm">
            Live Tracker <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Hero Shop Banner */}
      <div
        className="glass-panel"
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 20,
          marginBottom: 24,
          padding: 0,
        }}
      >
        <div style={{ height: 180, position: 'relative', overflow: 'hidden' }}>
          <img
            src={shop.bannerUrl}
            alt={shop.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.65)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(11, 15, 25, 0.95), transparent 70%)' }} />

          {/* Table pill if scanned from table QR */}
          {tableParam && (
            <div style={{
              position: 'absolute',
              top: 14,
              right: 14,
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(8px)',
              border: '1px solid var(--border-highlight)',
              color: '#fff',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.85rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}>
              <MapPin size={14} color="var(--primary)" />
              {tableParam}
            </div>
          )}
        </div>

        {/* Shop details */}
        <div style={{ padding: '0 24px 20px 24px', marginTop: -40, position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
            <div>
              <span className="brand-badge" style={{ marginBottom: 8, display: 'inline-block', textTransform: 'capitalize' }}>
                {shop.category}
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{shop.name}</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
                {shop.tagline}
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: 12 }}>
                <Star size={18} fill="#f59e0b" color="#f59e0b" />
                <span style={{ fontWeight: 800, fontSize: '0.95rem' }}>4.9</span>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>(150+ reviews)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', padding: '6px 12px', borderRadius: 12 }}>
                <Clock size={16} color="var(--primary)" />
                <span style={{ fontSize: '0.82rem', fontWeight: 600 }}>15-20 min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Dietary Filters Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={18} color="var(--text-muted)" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: 42, borderRadius: 25 }}
            placeholder={`Search ${isFood ? 'dishes, drinks, desserts...' : 'items in store...'}`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {isFood && (
          <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.05)', padding: 4, borderRadius: 25, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => { setDietaryFilter('all'); playSound('click'); }}
              className={`btn btn-sm ${dietaryFilter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 20 }}
            >
              All
            </button>
            <button
              onClick={() => { setDietaryFilter('veg'); playSound('click'); }}
              className={`btn btn-sm ${dietaryFilter === 'veg' ? 'btn-emerald' : 'btn-secondary'}`}
              style={{ borderRadius: 20 }}
            >
              <span className="diet-badge veg" style={{ width: 12, height: 12 }} />
              Veg Only
            </button>
            <button
              onClick={() => { setDietaryFilter('non-veg'); playSound('click'); }}
              className={`btn btn-sm ${dietaryFilter === 'non-veg' ? 'btn-primary' : 'btn-secondary'}`}
              style={{ borderRadius: 20 }}
            >
              <span className="diet-badge non-veg" style={{ width: 12, height: 12 }} />
              Non-Veg
            </button>
          </div>
        )}
      </div>

      {/* Category Chips Scroll */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 14, marginBottom: 20, scrollbarWidth: 'none' }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => { setSelectedCategory(cat); playSound('click'); }}
            className={`btn btn-sm ${selectedCategory === cat ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              textTransform: 'capitalize',
              borderRadius: 20,
              whiteSpace: 'nowrap',
              padding: '8px 18px',
            }}
          >
            {cat === 'all' ? (isFood ? '🍽️ All Menu' : '🛍️ All Items') : cat}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      {filteredProducts.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <UtensilsCrossed size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px auto', display: 'block' }} />
          <h3>No items found</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 4 }}>
            Try searching for something else or clearing filters.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
          {filteredProducts.map((product) => {
            const inCart = cart.find((i) => i.product.id === product.id);
            return (
              <div
                key={product.id}
                className="glass-card"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  position: 'relative',
                }}
              >
                {/* Photo */}
                <div style={{ position: 'relative', height: 190, overflow: 'hidden' }}>
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  />

                  {/* Dietary badge */}
                  {product.dietary && product.dietary !== 'none' && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,0.95)', padding: '4px 6px', borderRadius: 6, display: 'flex', alignItems: 'center' }}>
                      <span className={`diet-badge ${product.dietary}`} />
                    </div>
                  )}

                  {/* Rating badge */}
                  <div style={{
                    position: 'absolute',
                    top: 12,
                    right: 12,
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(6px)',
                    color: '#fff',
                    padding: '3px 8px',
                    borderRadius: 12,
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}>
                    <Star size={13} fill="#f59e0b" color="#f59e0b" />
                    {product.rating}
                  </div>
                </div>

                {/* Body */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: 'var(--primary)', fontWeight: 700 }}>
                        {product.category}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        ⏱️ {product.prepTime}
                      </span>
                    </div>

                    <h3 style={{ fontSize: '1.1rem', marginTop: 4, marginBottom: 6 }}>
                      {product.name}
                    </h3>
                    <p style={{
                      fontSize: '0.82rem',
                      color: 'var(--text-muted)',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {product.description}
                    </p>
                  </div>

                  {/* Price & Add to Cart button */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--border-subtle)' }}>
                    <div>
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff' }}>
                        {shop.currency}{product.discountPrice || product.price}
                      </span>
                      {product.discountPrice && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textDecoration: 'line-through', marginLeft: 6 }}>
                          {shop.currency}{product.price}
                        </span>
                      )}
                    </div>

                    {/* Quantity or Add button */}
                    {inCart ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(249, 115, 22, 0.15)', border: '1px solid var(--primary)', borderRadius: 20, padding: '4px 8px' }}>
                        <button
                          onClick={() => { playSound('click'); onUpdateQuantity(product.id, -1); }}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Minus size={13} />
                        </button>
                        <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.92rem', minWidth: 16, textAlign: 'center' }}>
                          {inCart.quantity}
                        </span>
                        <button
                          onClick={() => { playSound('click'); onUpdateQuantity(product.id, 1); }}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: '50%',
                            background: 'var(--primary)',
                            border: 'none',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          playSound('click');
                          onAddToCart(product);
                        }}
                        className="btn btn-outline-primary btn-sm"
                        style={{ borderRadius: 20, fontWeight: 700, padding: '6px 16px' }}
                      >
                        + ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating Bottom Cart Bar (Sticky when cart has items) */}
      {cartItemCount > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 20,
            left: 0,
            right: 0,
            zIndex: 90,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px',
            animation: 'slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <div
            onClick={onOpenCart}
            style={{
              maxWidth: 580,
              width: '100%',
              background: 'linear-gradient(135deg, var(--primary), #ea580c)',
              color: '#fff',
              padding: '12px 20px',
              borderRadius: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 8px 30px var(--primary-glow)',
              cursor: 'pointer',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: '50%' }}>
                <ShoppingBag size={20} />
              </div>
              <div>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  {cartItemCount} {cartItemCount === 1 ? 'Dish' : 'Dishes'} in Cart
                </span>
                <p style={{ fontSize: '1.15rem', fontWeight: 800 }}>
                  {shop.currency}{cartSubtotal}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700, fontSize: '0.92rem' }}>
              View Cart & Pay <ChevronRight size={18} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
