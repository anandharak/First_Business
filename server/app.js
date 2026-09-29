import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

export const app = express();
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop_platform';

app.use(cors());
app.use(express.json());

// ==========================================
// MONGOOSE CONNECTION (SERVERLESS-AWARE CACHE)
// ==========================================
let cachedDb = null;

export async function connectToDatabase() {
  if (cachedDb && mongoose.connection.readyState === 1) {
    return cachedDb;
  }

  const uri = process.env.MONGODB_URI || MONGODB_URI;
  try {
    const db = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    cachedDb = db;
    console.log(`Connected to MongoDB successfully: ${uri.replace(/\/\/.*@/, '//<credentials>@')}`);
    return db;
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err.message);
    return null;
  }
}

// Auto-connect middleware for serverless invocations
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    await connectToDatabase();
  }
  next();
});

// ==========================================
// MONGOOSE SCHEMAS & MODELS
// ==========================================

const ShopSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: 'fast_food' },
    tagline: { type: String, default: '' },
    description: { type: String, default: '' },
    phone: { type: String, default: '' },
    upiId: { type: String, default: '' },
    address: { type: String, default: '' },
    tableCount: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
    bannerUrl: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    currency: { type: String, default: '₹' },
    deliveryCharge: { type: Number, default: 30 },
    freeDeliveryAbove: { type: Number, default: 499 },
    passwordHash: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ProductSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    shopId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true },
    discountPrice: { type: Number },
    imageUrl: { type: String, default: '' },
    description: { type: String, default: '' },
    dietary: { type: String, enum: ['veg', 'non-veg', 'vegan', 'none'], default: 'none' },
    prepTime: { type: String, default: '15 min' },
    isAvailable: { type: Boolean, default: true },
    rating: { type: Number, default: 5.0 },
    reviewCount: { type: Number, default: 0 },
    tags: [String],
  },
  { timestamps: true }
);

const OrderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    orderNumber: { type: String, required: true },
    shopId: { type: String, required: true, index: true },
    customerName: { type: String, default: 'Guest' },
    customerPhone: { type: String, default: '' },
    orderType: { type: String, enum: ['dine_in', 'takeaway', 'delivery'], default: 'dine_in' },
    tableOrAddress: { type: String, default: 'Counter' },
    items: [
      {
        product: { type: Object, required: true },
        quantity: { type: Number, required: true, default: 1 },
        instructions: { type: String },
      },
    ],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ['online', 'cash'], default: 'online' },
    paymentStatus: { type: String, enum: ['paid', 'pending_cash'], default: 'paid' },
    status: {
      type: String,
      enum: ['received', 'preparing', 'ready', 'completed', 'cancelled'],
      default: 'received',
      index: true,
    },
    statusHistory: [
      {
        status: { type: String },
        timestamp: { type: String },
        title: { type: String },
        description: { type: String },
      },
    ],
    rating: { type: Number },
    reviewComment: { type: String },
  },
  { timestamps: true }
);

const ReviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    shopId: { type: String, required: true, index: true },
    orderId: { type: String, required: true },
    customerName: { type: String, default: 'Customer' },
    rating: { type: Number, required: true, min: 1, max: 5 },
    tags: [String],
    comment: { type: String, default: '' },
    dishNames: [String],
  },
  { timestamps: true }
);

export const ShopModel = mongoose.models.Shop || mongoose.model('Shop', ShopSchema);
export const ProductModel = mongoose.models.Product || mongoose.model('Product', ProductSchema);
export const OrderModel = mongoose.models.Order || mongoose.model('Order', OrderSchema);
export const ReviewModel = mongoose.models.Review || mongoose.model('Review', ReviewSchema);

// ==========================================
// REST API ROUTES
// ==========================================

// Health & DB status
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.json({
    status: isDbConnected ? 'ok' : 'degraded',
    database: 'MongoDB',
    connected: isDbConnected,
    timestamp: new Date().toISOString(),
    message: isDbConnected
      ? 'MongoDB Connected'
      : process.env.MONGODB_URI
      ? 'MongoDB Connecting or Unavailable'
      : 'MONGODB_URI not configured. Please set MONGODB_URI in Vercel settings.',
  });
});

// SHOPS
app.get('/api/shops', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const shops = await ShopModel.find().sort({ createdAt: -1 });
    res.json(shops);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/shops', async (req, res) => {
  try {
    const rawName = (req.body.name || 'New Shop').trim();
    let baseSlug = (req.body.slug || rawName)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    if (!baseSlug) baseSlug = `shop-${Date.now()}`;

    let slug = baseSlug;
    if (mongoose.connection.readyState === 1) {
      let counter = 1;
      while (await ShopModel.findOne({ slug })) {
        slug = `${baseSlug}-${counter++}`;
      }
    } else {
      slug = `${baseSlug}-${Date.now().toString().slice(-4)}`;
    }

    const defaultBanner =
      req.body.category === 'cafe'
        ? 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=1200&q=80'
        : req.body.category === 'clothing'
        ? 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';

    const shopPayload = {
      ...req.body,
      id: req.body.id || `shop-${Date.now()}`,
      name: rawName,
      slug,
      bannerUrl: req.body.bannerUrl || defaultBanner,
      currency: req.body.currency || '₹',
      isOpen: req.body.isOpen !== undefined ? req.body.isOpen : true,
    };

    if (mongoose.connection.readyState === 1) {
      const newShop = await ShopModel.create(shopPayload);
      return res.status(201).json(newShop);
    } else {
      console.warn('MongoDB not ready, returning fallback shop object');
      return res.status(201).json({ ...shopPayload, createdAt: new Date().toISOString() });
    }
  } catch (err) {
    console.error('Failed to create shop:', err);
    res.status(500).json({ error: err.message || 'Failed to register shop' });
  }
});

app.put('/api/shops/:id', async (req, res) => {
  try {
    const updated = await ShopModel.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Shop not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/shops/:id', async (req, res) => {
  try {
    const shop = await ShopModel.findOne({ id: req.params.id });
    if (!shop) return res.status(404).json({ error: 'Shop not found' });
    // Cascade delete: products and orders belonging to this shop
    await ProductModel.deleteMany({ shopId: req.params.id });
    await OrderModel.deleteMany({ shopId: req.params.id });
    await ReviewModel.deleteMany({ shopId: req.params.id });
    await ShopModel.findOneAndDelete({ id: req.params.id });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify owner password (hash sent from client via Web Crypto SHA-256)
app.post('/api/shops/:id/verify-password', async (req, res) => {
  try {
    const { passwordHash } = req.body;
    const shop = await ShopModel.findOne({ id: req.params.id });
    if (!shop) return res.status(404).json({ error: 'Shop not found', valid: false });
    if (!shop.passwordHash) {
      // No password set — allow access (legacy shops)
      return res.json({ valid: true, shop });
    }
    const valid = shop.passwordHash === passwordHash;
    if (valid) {
      return res.json({ valid: true, shop });
    }
    return res.status(401).json({ valid: false, error: 'Incorrect password' });
  } catch (err) {
    res.status(500).json({ error: err.message, valid: false });
  }
});

// PRODUCTS
app.get('/api/products', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const query = {};
    if (req.query.shopId) query.shopId = req.query.shopId;
    const products = await ProductModel.find(query).sort({ createdAt: -1 });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const newProduct = await ProductModel.create({
      ...req.body,
      id: req.body.id || `prod-${Date.now()}`,
    });
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await ProductModel.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const result = await ProductModel.findOneAndDelete({ id: req.params.id });
    if (!result) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ORDERS
app.get('/api/orders', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const query = {};
    if (req.query.shopId) query.shopId = req.query.shopId;
    const orders = await OrderModel.find(query).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await OrderModel.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  try {
    const orderNumber = `#ORD-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newOrder = await OrderModel.create({
      ...req.body,
      id: req.body.id || `ord-${Date.now()}`,
      orderNumber: req.body.orderNumber || orderNumber,
      paymentStatus: req.body.paymentMethod === 'online' ? 'paid' : 'pending_cash',
      status: 'received',
      statusHistory: [
        {
          status: 'received',
          timestamp: timeStr,
          title: 'Order Placed & Received',
          description:
            req.body.paymentMethod === 'online'
              ? 'Online payment confirmed. Sent to kitchen/store.'
              : 'Order received. Customer will pay Cash at counter/delivery.',
        },
      ],
    });
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let title = 'Order Updated';
    let description = `Status moved to ${status}`;

    if (status === 'preparing') {
      title = 'Chef is Preparing your Order';
      description = 'Your dishes are freshly being prepared in the kitchen!';
    } else if (status === 'ready') {
      title = 'Order Ready / Dispatched';
      description = 'Your order is ready! Hot and prepared for serving or pickup.';
    } else if (status === 'completed') {
      title = 'Order Completed';
      description = 'Thank you for ordering! We hope you loved your food/items.';
    }

    const order = await OrderModel.findOne({ id: req.params.id });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = status;
    order.statusHistory.push({
      status,
      timestamp: timeStr,
      title,
      description,
    });

    if (status === 'completed' && order.paymentStatus === 'pending_cash') {
      order.paymentStatus = 'paid';
    }

    await order.save();
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// REVIEWS
app.get('/api/reviews', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const query = {};
    if (req.query.shopId) query.shopId = req.query.shopId;
    const reviews = await ReviewModel.find(query).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reviews', async (req, res) => {
  try {
    const newReview = await ReviewModel.create({
      ...req.body,
      id: req.body.id || `rev-${Date.now()}`,
    });

    // Update rating on order
    if (req.body.orderId) {
      await OrderModel.findOneAndUpdate(
        { id: req.body.orderId },
        {
          $set: {
            rating: req.body.rating,
            reviewComment: req.body.comment,
          },
        }
      );
    }

    // Update dish ratings
    if (Array.isArray(req.body.dishNames) && req.body.dishNames.length > 0) {
      for (const dish of req.body.dishNames) {
        const prod = await ProductModel.findOne({ name: dish });
        if (prod) {
          const newCount = (prod.reviewCount || 0) + 1;
          const newRating = Number(
            (((prod.rating || 5) * (newCount - 1) + req.body.rating) / newCount).toFixed(1)
          );
          prod.rating = newRating;
          prod.reviewCount = newCount;
          await prod.save();
        }
      }
    }

    res.status(201).json(newReview);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reset endpoint
app.post('/api/reset', async (req, res) => {
  try {
    await ShopModel.deleteMany({});
    await ProductModel.deleteMany({});
    await OrderModel.deleteMany({});
    await ReviewModel.deleteMany({});
    res.json({ message: 'MongoDB successfully cleared' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default app;
