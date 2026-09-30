const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { seedDatabase } = require('./services/seedData');

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// API Audit Transaction Middleware (HTTP Request Logger)
app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    console.log(`[API TRANSACT ${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Seed initial database records
seedDatabase();

// Mount Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/dashboard', require('./routes/dashboard.routes'));
app.use('/api/purchases', require('./routes/purchases.routes'));
app.use('/api/transfers', require('./routes/transfers.routes'));
app.use('/api/assignments', require('./routes/assignments.routes'));
app.use('/api/expenditures', require('./routes/expenditures.routes'));
app.use('/api/bases', require('./routes/bases.routes'));
app.use('/api/assets', require('./routes/assets.routes'));
app.use('/api/audit', require('./routes/audit.routes'));

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal server error occurred.',
    error: err.message
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`Military Asset Management System (MAMS) Server Live`);
  console.log(`Listening on: http://localhost:${PORT}`);
  console.log(`=======================================================`);
});

module.exports = app;
