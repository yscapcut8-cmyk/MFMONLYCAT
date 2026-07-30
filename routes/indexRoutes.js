const express = require('express');
const db = require('../database/connection');
const { ensureAuthenticated } = require('../middleware/auth');
const router = express.Router();

router.get('/', ensureAuthenticated, (req, res) => {
  try {
    // 1. Faturamento e Custos Gerais
    const incomeStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'income'");
    const expenseStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'expense'");
    const faturamento = incomeStmt.get().total;
    const custosGerais = expenseStmt.get().total;
    
    // Faturamento de Hoje (Webhook e Manual)
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIncomeStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM transactions WHERE type = 'income' AND date = ?");
    const faturamentoHoje = todayIncomeStmt.get(todayStr).total;
    
    // Buscar configurações de porcentagem
    const settingsStmt = db.prepare('SELECT * FROM settings WHERE id = 1');
    const settings = settingsStmt.get();

    // 2. Lucro a Dividir
    let lucroADividir = faturamento - custosGerais;
    if (lucroADividir < 0) lucroADividir = 0; // Evitar divisão negativa

    // 3. Divisão das Porcentagens (Baseado no Lucro a Dividir)
    const companyTheoretical = lucroADividir * (settings.company_pct / 100);
    const ortizShare = lucroADividir * (settings.ortiz_pct / 100);
    const daviShare = lucroADividir * (settings.davi_pct / 100);
    
    // 4. Caixa da Empresa e Ferramentas
    const ledgerIncomeStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM company_ledger WHERE type = 'income'");
    const ledgerExpenseStmt = db.prepare("SELECT COALESCE(SUM(amount), 0) AS total FROM company_ledger WHERE type = 'expense'");
    const companyAportes = ledgerIncomeStmt.get().total;
    const companyFerramentas = ledgerExpenseStmt.get().total; // Gastos com ferramentas e saídas manuais
    
    // 5. Saldo Real da Empresa
    const companyRealBalance = companyTheoretical + companyAportes - companyFerramentas;

    // Cálculo da porcentagem dos custos gerais em relação ao faturamento
    let expensePercent = 0;
    if (faturamento > 0) {
      expensePercent = Math.round((custosGerais / faturamento) * 100);
    }

    const recentStmt = db.prepare(`
      SELECT transactions.*, users.name as user_name 
      FROM transactions 
      LEFT JOIN users ON transactions.user_id = users.id 
      ORDER BY date DESC, id DESC LIMIT 5
    `);
    const recentTransactions = recentStmt.all();

    res.render('dashboard', {
      title: 'Dashboard - MoneyFinance',
      faturamento,
      faturamentoHoje,
      custosGerais,
      lucroADividir,
      ortizShare,
      daviShare,
      companyTheoretical,
      companyAportes,
      companyFerramentas,
      companyRealBalance,
      settings,
      expensePercent,
      recentTransactions
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Erro no servidor");
  }
});

module.exports = router;
