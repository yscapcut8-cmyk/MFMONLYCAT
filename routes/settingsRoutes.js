const express = require('express');
const db = require('../database/connection');
const { ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.use(ensureAuthenticated);

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM settings WHERE id = 1');
    const settings = stmt.get();
    res.render('settings/index', { title: 'Configurações - MoneyFinance', settings });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar configurações");
  }
});

router.post('/', (req, res) => {
  const { company_pct, ortiz_pct, davi_pct } = req.body;
  
  const c = parseFloat(company_pct);
  const o = parseFloat(ortiz_pct);
  const d = parseFloat(davi_pct);
  
  if (c + o + d !== 100) {
    req.session.error = 'A soma das porcentagens deve ser exatamente 100%';
    return res.redirect('/settings');
  }
  
  try {
    const stmt = db.prepare('UPDATE settings SET company_pct = ?, ortiz_pct = ?, davi_pct = ? WHERE id = 1');
    stmt.run(c, o, d);
    req.session.success = 'Configurações atualizadas com sucesso!';
    res.redirect('/settings');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao salvar configurações';
    res.redirect('/settings');
  }
});

module.exports = router;
