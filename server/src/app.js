const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const { seedDatabase } = require('./services/seedData');

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    console.log(`[API TRANSACT ${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  }
  next();
});

// Health / Root Status Endpoints
app.get(['/', '/api'], (req, res) => {
  res.json({
    status: 'online',
    system: 'Military Asset Management System (MAMS) API',
    version: '1.0.0',
    documentation: 'Access the frontend UI at https://client-alpha-lake.vercel.app'
  });
});

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

app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({
    message: 'Internal server error occurred.',
    error: err.message
  });
});

// Initialize database and start listening on 0.0.0.0 for Render host binding
seedDatabase().then(() => {
  app.listen(PORT, HOST, () => {
    console.log(`=======================================================`);
    console.log(`Military Asset Management System (MAMS) Server Live`);
    console.log(`Listening on: http://${HOST}:${PORT}`);
    console.log(`=======================================================`);
  });
}).catch(err => {
  console.error('Database initialization error:', err);
  app.listen(PORT, HOST, () => {
    console.log(`Server listening on http://${HOST}:${PORT}`);
  });
});

module.exports = app;
