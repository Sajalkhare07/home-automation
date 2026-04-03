// server.js — application entry point
require('dotenv').config();

const express  = require('express');
const http     = require('http');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const { testConnection } = require('./config/db');

const app    = express();
const server = http.createServer(app); // needed for Socket.io later

// ─── Middleware ───────────────────────────────────────────
app.use(helmet());                         // security headers
app.use(cors({ origin: '*' }));            // allow all origins (tighten in production)
app.use(morgan('dev'));                     // request logging
app.use(express.json());                   // parse JSON bodies
app.use(express.urlencoded({ extended: true }));


// ─── Routes ───────────────────────────────────────────────

const authRoutes   = require('./routes/auth');
const deviceRoutes = require('./routes/devices');   // ← add this
const espRoutes    = require('./routes/esp');
app.use('/api/esp', espRoutes);
app.use('/api/auth',    authRoutes);
app.use('/api/devices', deviceRoutes);              // ← add this

// ─── Health check ─────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Home Automation API is running',
    timestamp: new Date().toISOString(),
  });
});

// ─── 404 handler ──────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// ─── Start ────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

async function start() {
  try {
    await testConnection();
    server.listen(PORT, () => {
      console.log(`🚀  Server running on http://10.133.230.93:${PORT}`);
      console.log(`📡  Environment: ${process.env.NODE_ENV}`);
    });
  } catch (err) {
    console.error('❌  Startup error:', err.message);
    process.exit(1);
  }
}

start();