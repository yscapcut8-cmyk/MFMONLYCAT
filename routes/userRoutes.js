const express = require('express');
const db = require('../database/connection');
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/adminAuth');
const router = express.Router();

router.use(ensureAuthenticated);
router.use(ensureAdmin);

// Listar todos os usuários
router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC');
    const users = stmt.all();
    res.render('users/index', { title: 'Gestão de Acessos - MoneyFinance', users });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar usuários");
  }
});

// Promover ou rebaixar usuário (alterar role)
router.post('/:id/role', (req, res) => {
  const { role } = req.body;
  const targetId = req.params.id;

  // Evita que o dono do sistema se remova de admin por acidente (se for o dono)
  if (req.session.user.id == targetId && role !== 'admin') {
    req.session.error = 'Você não pode remover seu próprio acesso de administrador.';
    return res.redirect('/users');
  }

  try {
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, targetId);
    req.session.success = 'Permissão do usuário atualizada!';
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao atualizar permissão';
    res.redirect('/users');
  }
});

// Aprovar ou bloquear usuário (alterar status)
router.post('/:id/status', (req, res) => {
  const { status } = req.body;
  const targetId = req.params.id;

  // Evita que o admin bloqueie a si mesmo
  if (req.session.user.id == targetId && status !== 'approved') {
    req.session.error = 'Você não pode bloquear seu próprio acesso.';
    return res.redirect('/users');
  }

  try {
    const stmt = db.prepare('UPDATE users SET status = ? WHERE id = ?');
    stmt.run(status, targetId);
    req.session.success = 'Status do usuário atualizado!';
    res.redirect('/users');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao atualizar status';
    res.redirect('/users');
  }
});

module.exports = router;
