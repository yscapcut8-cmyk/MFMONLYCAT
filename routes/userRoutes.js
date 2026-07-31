const express = require('express');
const db = require('../database/connection');
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/adminAuth');
const router = express.Router();

router.use(ensureAuthenticated);

const bcrypt = require('bcrypt'); // Added bcrypt requirement

// Tela de Perfil
router.get('/profile', (req, res) => {
  res.render('users/profile', { title: 'Meu Perfil - MoneyFinance' });
});

// Atualizar Perfil
router.post('/profile', async (req, res) => {
  const { name, email, current_password, new_password } = req.body;
  const userId = req.session.user.id;

  try {
    const userStmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const user = userStmt.get(userId);

    // Validações básicas (nome e email são originais se não mudar)
    let finalName = name || user.name;
    let finalEmail = email || user.email;
    let finalPassword = user.password;

    // Se o email foi alterado, checa se não existe
    if (finalEmail !== user.email) {
      const emailCheck = db.prepare('SELECT id FROM users WHERE email = ?').get(finalEmail);
      if (emailCheck) {
        req.session.error = 'Este e-mail já está em uso.';
        return res.redirect('/users/profile');
      }
    }

    // Se tentou alterar a senha
    if (current_password && new_password) {
      const match = await bcrypt.compare(current_password, user.password);
      if (!match) {
        req.session.error = 'Senha atual incorreta.';
        return res.redirect('/users/profile');
      }
      finalPassword = await bcrypt.hash(new_password, 10);
    }

    const stmt = db.prepare('UPDATE users SET name = ?, email = ?, password = ? WHERE id = ?');
    stmt.run(finalName, finalEmail, finalPassword, userId);

    // Atualiza sessão
    req.session.user.name = finalName;
    req.session.user.email = finalEmail;
    
    req.session.success = 'Perfil atualizado com sucesso!';
    res.redirect('/users/profile');

  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao atualizar perfil.';
    res.redirect('/users/profile');
  }
});

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
