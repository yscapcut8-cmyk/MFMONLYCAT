require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');

// Initialize Database Schema
require('./database/schema');

const app = express();
const PORT = process.env.PORT || 3000;

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));

// Webhook route must be registered BEFORE global express.json() so it can access the raw body for signature validation
app.use('/webhook', require('./routes/webhookRoutes'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session
app.use(session({
  secret: process.env.SESSION_SECRET || 'secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false } // in dev, use false
}));

// Global variables for views
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.error = req.session.error || null;
  res.locals.success = req.session.success || null;
  res.locals.process = process; // Allow EJS to access process.env
  delete req.session.error;
  delete req.session.success;
  
  // Upcoming renewals
  res.locals.upcomingRenewals = [];
  if (req.session.user) {
    try {
      const db = require('./database/connection');
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      
      const stmt = db.prepare("SELECT * FROM subscriptions WHERE status = 'active' AND renewal_date IS NOT NULL AND renewal_date BETWEEN ? AND ? ORDER BY renewal_date ASC");
      res.locals.upcomingRenewals = stmt.all(today, nextWeekStr);
    } catch (e) {
      console.error(e);
    }
  }

  next();
});

// Health check (required for Railway)
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Routes
app.use('/', require('./routes/indexRoutes'));
app.use('/', require('./routes/authRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));
app.use('/company', require('./routes/companyRoutes'));
app.use('/users', require('./routes/userRoutes'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on http://0.0.0.0:${PORT}`);
});
