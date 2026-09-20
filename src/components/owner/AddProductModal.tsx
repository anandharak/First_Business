import React, { useState } from 'react';
import { Product, Shop, DietaryType } from '../../types';
import { StoreService } from '../../services/storeService';
import { Utensils, X, Plus, Image as ImageIcon } from 'lucide-react';
import { playSound } from '../../utils/audio';

interface AddProductModalProps {
  shop: Shop;
  onClose: () => void;
  onProductAdded: (product: Product) => void;
  editingProduct?: Product | null;
}

const PRESET_DISH_IMAGES = [
  { name: 'Biryani', url: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=80' },
  { name: 'Paneer Masala', url: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=800&q=80' },
  { name: 'Crispy Snack', url: 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?auto=format&fit=crop&w=800&q=80' },
  { name: 'Tandoori Tikka', url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80' },
  { name: 'Artisan Pizza', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80' },
  { name: 'Burger & Fries', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80' },
  { name: 'Warm Brownie', url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Chilled Mocktail', url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { name: 'Linen Shirt', url: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?auto=format&fit=crop&w=800&q=80' },
  { name: 'Denim Jeans', url: 'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80' },
];

export const AddProductModal: React.FC<AddProductModalProps> = ({
  shop,
  onClose,
  onProductAdded,
  editingProduct,
}) => {
  const isFood = shop.category === 'food' || shop.category === 'cafe';

  const [name, setName] = useState(editingProduct?.name || '');
  const [category, setCategory] = useState(
    editingProduct?.category || (isFood ? 'Starters' : 'Shirts')
  );
  const [price, setPrice] = useState<number>(editingProduct?.price || 199);
  const [discountPrice, setDiscountPrice] = useState<number | ''>(
    editingProduct?.discountPrice || ''
  );
  const [imageUrl, setImageUrl] = useState(
    editingProduct?.imageUrl || PRESET_DISH_IMAGES[0].url
  );
  const [dietary, setDietary] = useState<DietaryType>(
    editingProduct?.dietary || (isFood ? 'veg' : 'none')
  );
  const [prepTime, setPrepTime] = useState(
    editingProduct?.prepTime || (isFood ? '10-15 min' : 'Same Day Dispatch')
  );
  const [description, setDescription] = useState(
    editingProduct?.description || ''
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    playSound('success');

    try {
      if (editingProduct) {
        const updated = await StoreService.updateProduct(editingProduct.id, {
          name: name.trim(),
          category: category.trim(),
          price: Number(price),
          discountPrice: discountPrice ? Number(discountPrice) : undefined,
          imageUrl: imageUrl.trim(),
          dietary,
          prepTime: prepTime.trim(),
          description: description.trim(),
        });
        if (updated) onProductAdded(updated);
      } else {
        const created = await StoreService.addProduct({
          shopId: shop.id,
          name: name.trim(),
          category: category.trim(),
          price: Number(price),
          discountPrice: discountPrice ? Number(discountPrice) : undefined,
          imageUrl: imageUrl.trim(),
          dietary,
          prepTime: prepTime.trim(),
          description: description.trim(),
          isAvailable: true,
        });
        onProductAdded(created);
      }
    } catch (err) {
      console.error('Failed to save product in MongoDB:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content wide" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', padding: 10, borderRadius: 12 }}>
              <Utensils size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem' }}>
                {editingProduct ? 'Edit Item Details' : `Add New ${isFood ? 'Dish' : 'Product'}`}
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                {shop.name} • Instant digital menu & QR update
              </p>
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
              <label className="form-label">{isFood ? 'Dish / Food Name *' : 'Product Title *'}</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder={isFood ? 'e.g. Sizzling Paneer Tikka' : 'e.g. Vintage Wash Denim'}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category *</label>
              <input
                type="text"
                required
                list="category-suggestions"
                className="form-input"
                placeholder={isFood ? 'Starters, Mains, Desserts, Drinks' : 'Shirts, Pants, Accessories'}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              />
              <datalist id="category-suggestions">
                {isFood ? (
                  <>
                    <option value="Starters" />
                    <option value="Main Course" />
                    <option value="Biryani & Rice" />
                    <option value="Breads" />
                    <option value="Desserts" />
                    <option value="Beverages" />
                    <option value="Combos & Platters" />
                  </>
                ) : (
                  <>
                    <option value="Shirts" />
                    <option value="T-Shirts" />
                    <option value="Pants" />
                    <option value="Dresses" />
                    <option value="Accessories" />
                  </>
                )}
              </datalist>
            </div>

            <div className="form-group">
              <label className="form-label">Price ({shop.currency}) *</label>
              <input
                type="number"
                required
                min="1"
                className="form-input"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Discount Offer Price ({shop.currency}) (Optional)</label>
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="Leave blank if no discount"
                value={discountPrice}
                onChange={(e) => setDiscountPrice(e.target.value ? Number(e.target.value) : '')}
              />
            </div>

            {isFood && (
              <div className="form-group">
                <label className="form-label">Dietary Classification</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="dietary"
                      checked={dietary === 'veg'}
                      onChange={() => setDietary('veg')}
                    />
                    <span className="diet-badge veg" /> Pure Veg
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.88rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="dietary"
                      checked={dietary === 'non-veg'}
                      onChange={() => setDietary('non-veg')}
                    />
                    <span className="diet-badge non-veg" /> Non-Veg
                  </label>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">{isFood ? 'Prep Time (e.g. 15-20 min)' : 'Dispatch / Delivery Time'}</label>
              <input
                type="text"
                className="form-input"
                placeholder="10-15 min"
                value={prepTime}
                onChange={(e) => setPrepTime(e.target.value)}
              />
            </div>

            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Description / Ingredients</label>
              <textarea
                className="form-textarea"
                rows={2}
                placeholder="Describe flavors, portions, ingredients..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Preset image selector */}
          <div style={{ marginTop: 12, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label className="form-label" style={{ margin: 0 }}>
                <ImageIcon size={14} style={{ display: 'inline', marginRight: 4 }} />
                Product Image URL / Quick Pick
              </label>
            </div>
            <input
              type="url"
              className="form-input"
              style={{ marginBottom: 10 }}
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }}>
              {PRESET_DISH_IMAGES.map((img) => (
                <div
                  key={img.url}
                  onClick={() => setImageUrl(img.url)}
                  style={{
                    position: 'relative',
                    cursor: 'pointer',
                    borderRadius: 8,
                    overflow: 'hidden',
                    border: imageUrl === img.url ? '2px solid var(--primary)' : '1px solid var(--border-subtle)',
                    flexShrink: 0,
                    width: 75,
                    height: 55,
                  }}
                >
                  <img src={img.url} alt={img.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          </div>

          {/* Footer CTA */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, borderTop: '1px solid var(--border-subtle)', paddingTop: 18 }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary btn-lg">
              <Plus size={18} />
              {editingProduct ? 'Save Changes' : `Add ${isFood ? 'Dish' : 'Product'} to Menu`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
