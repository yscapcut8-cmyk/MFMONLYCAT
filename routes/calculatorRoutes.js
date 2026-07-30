const express = require('express');
const { ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.get('/', ensureAuthenticated, (req, res) => {
  res.render('calculator/index', { title: 'Calculadora de % - MoneyFinance' });
});

module.exports = router;
