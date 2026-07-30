const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../database/connection');
const { ensureGuest, ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.get('/login', ensureGuest, (req, res) => {
  res.render('auth/login', { title: 'Login - MoneyFinance' });
});

router.post('/login', ensureGuest, async (req, res) => {
  const { email, password } = req.body;
  try {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const user = stmt.get(email);
    
    if (user && await bcrypt.compare(password, user.password)) {
      req.session.userId = user.id;
      req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
      res.redirect('/');
    } else {
      req.session.error = 'E-mail ou senha inválidos';
      res.redirect('/login');
    }
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao fazer login';
    res.redirect('/login');
  }
});

router.get('/register', ensureGuest, (req, res) => {
  res.render('auth/register', { title: 'Cadastro - MoneyFinance' });
});

router.post('/register', ensureGuest, async (req, res) => {
  const { name, email, password } = req.body;
  try {
    // Check if user exists
    const checkStmt = db.prepare('SELECT * FROM users WHERE email = ?');
    const existing = checkStmt.get(email);
    
    if (existing) {
      req.session.error = 'E-mail já está em uso';
      return res.redirect('/register');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = email === 'yscapcut8@gmail.com' ? 'admin' : 'user';
    const insertStmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const result = insertStmt.run(name, email, hashedPassword, role);
    
    // Auto-login
    req.session.userId = result.lastInsertRowid;
    req.session.user = { id: result.lastInsertRowid, name, email, role };
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao criar conta';
    res.redirect('/register');
  }
});

router.get('/logout', ensureAuthenticated, (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

module.exports = router;
