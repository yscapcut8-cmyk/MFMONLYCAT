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
  delete req.session.error;
  delete req.session.success;
  next();
});

// Routes
app.use('/', require('./routes/indexRoutes'));
app.use('/', require('./routes/authRoutes'));
app.use('/transactions', require('./routes/transactionRoutes'));
app.use('/settings', require('./routes/settingsRoutes'));
app.use('/company', require('./routes/companyRoutes'));
app.use('/users', require('./routes/userRoutes'));
app.use('/calculator', require('./routes/calculatorRoutes'));

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
