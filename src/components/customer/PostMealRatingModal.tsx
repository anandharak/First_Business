import React, { useState } from 'react';
import { Order, Shop } from '../../types';
import { StoreService } from '../../services/storeService';
import { Star, X, Sparkles, Heart, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { playSound } from '../../utils/audio';

interface PostMealRatingModalProps {
  order: Order;
  shop: Shop;
  onClose: () => void;
  onSubmitted: () => void;
}

const FEEDBACK_TAGS = [
  'Super Delicious',
  'Fresh & Hot',
  'Authentic Flavors',
  'Quick Service',
  'Great Portions',
  'Loved the Packaging',
];

export const PostMealRatingModal: React.FC<PostMealRatingModalProps> = ({
  order,
  shop,
  onClose,
  onSubmitted,
}) => {
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [selectedTags, setSelectedTags] = useState<string[]>(['Super Delicious', 'Fresh & Hot']);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    playSound('click');
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    playSound('rating');

    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    const dishNames = order.items.map((i) => i.product.name);

    try {
      await StoreService.submitReview({
        shopId: shop.id,
        orderId: order.id,
        customerName: order.customerName || 'Happy Customer',
        rating,
        tags: selectedTags,
        comment: comment.trim() || 'Food was absolutely delicious! Loved the quick QR ordering experience.',
        dishNames,
      });

      setSubmitted(true);
      setTimeout(() => {
        onSubmitted();
      }, 1800);
    } catch (err) {
      console.error('Failed to submit review to MongoDB:', err);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 480, textAlign: 'center' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left' }}>
            <div style={{ background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', padding: 8, borderRadius: 10 }}>
              <Star size={20} fill="#f59e0b" />
            </div>
            <div>
              <h3 style={{ fontSize: '1.15rem' }}>Rate Your Meal & Experience</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shop.name} • Order {order.orderNumber}</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {submitted ? (
          <div style={{ padding: '40px 24px' }}>
            <div style={{ color: '#10b981', margin: '0 auto 16px auto' }}>
              <CheckCircle2 size={56} />
            </div>
            <h3 style={{ fontSize: '1.4rem' }}>Thank You for Your Review!</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: 8 }}>
              Your feedback helps our chef and store provide an even better experience!
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding: '24px 20px' }}>
            {/* Dish previews */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 14px', borderRadius: 10, marginBottom: 18, textAlign: 'left' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600, marginBottom: 4 }}>
                Dishes You Enjoyed:
              </p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {order.items.map((i, idx) => (
                  <span key={idx} style={{ background: 'rgba(255,255,255,0.07)', padding: '2px 8px', borderRadius: 6, fontSize: '0.8rem' }}>
                    {i.product.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Interactive 5-Star Selector */}
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                How was the taste & overall experience?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      transform: (hoverRating || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.15s ease',
                      padding: 4,
                    }}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      setRating(star);
                      playSound('rating');
                    }}
                  >
                    <Star
                      size={36}
                      fill={(hoverRating || rating) >= star ? '#f59e0b' : 'none'}
                      color={(hoverRating || rating) >= star ? '#f59e0b' : '#64748b'}
                    />
                  </button>
                ))}
              </div>
              <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', marginTop: 6 }}>
                {rating === 5 ? '⭐⭐⭐⭐⭐ Phenomenal & Delicious!' : rating === 4 ? '⭐⭐⭐⭐ Very Good!' : rating === 3 ? '⭐⭐⭐ Decent' : 'Needs Improvement'}
              </p>
            </div>

            {/* Quick tags */}
            <div style={{ marginBottom: 18, textAlign: 'left' }}>
              <label className="form-label">What did you like the most?</label>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {FEEDBACK_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      style={{
                        background: isSelected ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.05)',
                        border: isSelected ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                        color: isSelected ? 'var(--primary)' : 'var(--text-muted)',
                        padding: '5px 10px',
                        borderRadius: 20,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected ? '✓ ' : '+ '}
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Comment */}
            <div className="form-group" style={{ textAlign: 'left' }}>
              <label className="form-label">Feedback / Message to Chef</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="Share your review about flavors, spice level, or dining experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>

            {/* Submit */}
            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Maybe Later
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 2 }}>
                <Sparkles size={16} />
                Submit Review
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
