const express = require('express');
const db = require('../database/connection');
const { ensureAuthenticated } = require('../middleware/auth');
const { ensureAdmin } = require('../middleware/adminAuth');
const router = express.Router();

router.use(ensureAuthenticated);

// 1. Visão Geral do Caixa da Empresa
router.get('/', (req, res) => {
  try {
    // Cálculo do fundo teórico da empresa (Baseado no saldo global)
    const incomeStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'income'");
    const expenseStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'expense'");
    
    const globalIncome = incomeStmt.get().total;
    const globalExpense = expenseStmt.get().total;
    const globalBalance = globalIncome - globalExpense;
    const safeBalance = globalBalance > 0 ? globalBalance : 0;
    
    const settingsStmt = db.prepare('SELECT company_pct FROM settings WHERE id = 1');
    const settings = settingsStmt.get();
    
    const theoreticalCompanyFund = safeBalance * (settings.company_pct / 100);
    
    // Ledgers específicos da Empresa (aportes, retiradas, assinaturas)
    const ledgerStmt = db.prepare(`
      SELECT company_ledger.*, subscriptions.name as sub_name 
      FROM company_ledger 
      LEFT JOIN subscriptions ON company_ledger.subscription_id = subscriptions.id 
      ORDER BY date DESC, id DESC
    `);
    const ledgers = ledgerStmt.all();
    
    const ledgerIncomeStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM company_ledger WHERE type = 'income'");
    const ledgerExpenseStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM company_ledger WHERE type = 'expense'");
    const ledgerIncome = ledgerIncomeStmt.get().total;
    const ledgerExpense = ledgerExpenseStmt.get().total;
    
    const companyFund = theoreticalCompanyFund + ledgerIncome - ledgerExpense;

    // Assinaturas ativas
    const subStmt = db.prepare("SELECT * FROM subscriptions WHERE status = 'active'");
    const subscriptions = subStmt.all();

    res.render('company/index', {
      title: 'Caixa da Empresa - MoneyFinance',
      theoreticalCompanyFund,
      companyFund,
      ledgers,
      subscriptions
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro ao carregar o caixa da empresa");
  }
});

// 2. Adicionar/Remover valor manualmente no Caixa da Empresa
router.post('/ledger', (req, res) => {
  const { description, amount, type, date } = req.body;
  try {
    let finalType = type;
    let finalAmount = parseFloat(amount);
    let finalDesc = description;

    if (type === 'set_balance') {
      // Calcular a diferença para atingir o valor
      const incomeStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'income'");
      const expenseStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'expense'");
      const globalIncome = incomeStmt.get().total;
      const globalExpense = expenseStmt.get().total;
      const safeBalance = Math.max(0, globalIncome - globalExpense);
      
      const settingsStmt = db.prepare('SELECT company_pct FROM settings WHERE id = 1');
      const settings = settingsStmt.get();
      const theoreticalCompanyFund = safeBalance * (settings.company_pct / 100);
      
      const ledgerIncomeStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM company_ledger WHERE type = 'income'");
      const ledgerExpenseStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM company_ledger WHERE type = 'expense'");
      const currentBalance = theoreticalCompanyFund + ledgerIncomeStmt.get().total - ledgerExpenseStmt.get().total;
      
      const targetAmount = parseFloat(amount);
      const diff = targetAmount - currentBalance;
      
      if (diff === 0) {
         req.session.success = 'O saldo já é exatamente esse valor.';
         return res.redirect('/company');
      }
      
      finalAmount = Math.abs(diff);
      finalType = diff > 0 ? 'income' : 'expense';
      finalDesc = `Ajuste de Saldo para R$ ${targetAmount.toFixed(2)}`;
    }

    const stmt = db.prepare('INSERT INTO company_ledger (description, amount, type, date) VALUES (?, ?, ?, ?)');
    stmt.run(finalDesc, finalAmount, finalType, date);
    req.session.success = 'Movimentação adicionada ao Caixa da Empresa!';
    res.redirect('/company');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao adicionar movimentação ao Caixa da Empresa';
    res.redirect('/company');
  }
});

// 3. Criar Assinatura e Debitar
router.post('/subscriptions', (req, res) => {
  const { name, amount, date, renewal_date } = req.body;
  try {
    const stmt = db.prepare('INSERT INTO subscriptions (name, amount, renewal_date) VALUES (?, ?, ?)');
    const info = stmt.run(name, parseFloat(amount), renewal_date || null);
    
    // Já debita o primeiro mês agora mesmo usando a data fornecida
    const ledgerStmt = db.prepare('INSERT INTO company_ledger (description, amount, type, date, subscription_id) VALUES (?, ?, ?, ?, ?)');
    const subDate = date || new Date().toISOString().split('T')[0];
    ledgerStmt.run(`Pagamento: ${name}`, parseFloat(amount), 'expense', subDate, info.lastInsertRowid);
    
    req.session.success = 'Assinatura criada e primeiro pagamento debitado do caixa da empresa!';
    res.redirect('/company');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao criar assinatura';
    res.redirect('/company');
  }
});

// 4. Cancelar Assinatura
router.post('/subscriptions/:id/cancel', (req, res) => {
  try {
    const stmt = db.prepare("UPDATE subscriptions SET status = 'cancelled' WHERE id = ?");
    stmt.run(req.params.id);
    req.session.success = 'Assinatura cancelada com sucesso!';
    res.redirect('/company');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao cancelar assinatura';
    res.redirect('/company');
  }
});

// 5. Resetar Extrato da Empresa
router.post('/ledger/reset', ensureAdmin, (req, res) => {
  try {
    const stmt = db.prepare('DELETE FROM company_ledger');
    stmt.run();
    req.session.success = 'Extrato resetado com sucesso!';
    res.redirect('/company');
  } catch (err) {
    console.error(err);
    req.session.error = 'Erro ao resetar o extrato';
    res.redirect('/company');
  }
});

module.exports = router;
