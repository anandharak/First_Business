import app, { connectToDatabase } from './app.js';

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shop_platform';

// ==========================================
// START SERVER & CONNECT MONGODB (LOCAL RUNNER)
// ==========================================
connectToDatabase()
  .then(async () => {
    console.log(`Connected to MongoDB successfully at: ${MONGODB_URI}`);
    app.listen(PORT, () => {
      console.log(`MongoDB Backend Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  });
