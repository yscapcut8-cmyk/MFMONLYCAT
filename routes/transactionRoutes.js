const express = require('express');
const db = require('../database/connection');
const { ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(ensureAuthenticated);

// List transactions
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT transactions.*, users.name as user_name 
      FROM transactions 
      LEFT JOIN users ON transactions.user_id = users.id 
      ORDER BY date DESC, id DESC
    `);
    const transactions = stmt.all();
    res.render('transactions/index', { title: 'Transações - MoneyFinance', transactions });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar transações");
  }
});

// New transaction form
router.get('/new', (req, res) => {
  res.render('transactions/form', { title: 'Nova Transação - MoneyFinance', transaction: null });
});

// Create transaction
router.post('/add', ensureAuthenticated, (req, res) => {
  try {
    const { description, type, amount, date } = req.body;
    
    let targetDate = date;
    if (!targetDate) {
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const spDate = new Date(utc + (3600000 * -3));
        targetDate = spDate.toISOString().split('T')[0];
    }
    
    const stmt = db.prepare('INSERT INTO transactions (description, type, amount, date, user_id) VALUES (?, ?, ?, ?, ?)');
    stmt.run(description, type, parseFloat(amount), targetDate, req.session.user.id);

    req.session.success = 'Transação registrada com sucesso!';
    res.redirect('/transactions');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao criar transação';
    res.redirect('/transactions/new');
  }
});

// Edit transaction form
router.get('/:id/edit', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM transactions WHERE id = ?');
    const transaction = stmt.get(req.params.id);
    if (!transaction) {
      req.session.error = 'Transação não encontrada';
      return res.redirect('/transactions');
    }
    res.render('transactions/form', { title: 'Editar Transação - MoneyFinance', transaction });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no servidor");
  }
});

// Update transaction
router.post('/:id/edit', (req, res) => {
  const { description, amount, type, date } = req.body;
  try {
    const stmt = db.prepare('UPDATE transactions SET description = ?, amount = ?, type = ?, date = ? WHERE id = ?');
    stmt.run(description, parseFloat(amount), type, date, req.params.id);
    req.session.success = 'Transação atualizada!';
    res.redirect('/transactions');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao atualizar transação';
    res.redirect(`/transactions/${req.params.id}/edit`);
  }
});

// Delete transaction
router.post('/:id/delete', (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM transactions WHERE id = ?');
    stmt.run(req.params.id);
    req.session.success = 'Transação excluída!';
    res.redirect('/transactions');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao excluir transação';
    res.redirect('/transactions');
  }
});

module.exports = router;
