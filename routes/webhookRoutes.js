const express = require('express');
const crypto = require('crypto');
const db = require('../database/connection');

// We need the raw body to verify the HMAC signature correctly
const router = express.Router();

router.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

router.post('/', (req, res) => {
    try {
        const signature = req.headers['x-webhook-signature'];
        const secret = process.env.WEBHOOK_SECRET;

        console.log('--- NOVO WEBHOOK RECEBIDO ---');
        console.log('Headers:', req.headers);
        console.log('Body:', req.body);

        if (secret && signature) {
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(req.rawBody).digest('hex');
            
            if (digest !== signature) {
                console.error('Assinatura do webhook inválida!', { expected: digest, received: signature });
                // We'll still process it for now during testing
            } else {
                console.log('Assinatura validada com sucesso!');
            }
        } else {
            console.warn('Webhook recebido mas WEBHOOK_SECRET ou assinatura ausente. Processando mesmo assim (apenas para teste).');
        }

        const payload = req.body;
        // Extract amount from specific platform payload
        let amount = 0;
        if (payload.data && payload.data.transaction && payload.data.transaction.amount) {
            amount = parseFloat(payload.data.transaction.amount);
        } else if (payload.amount) amount = parseFloat(payload.amount);
        else if (payload.data && payload.data.amount) amount = parseFloat(payload.data.amount);
        else if (payload.value) amount = parseFloat(payload.value);

        // Try to get a description or product name
        let description = 'Venda Automática (Webhook)';
        if (payload.data && payload.data.transaction && payload.data.transaction.plan_name) {
            description = `Venda: ${payload.data.transaction.plan_name}`;
            if (payload.data.flow && payload.data.flow.name) {
                description += ` (Fluxo: ${payload.data.flow.name})`;
            }
        } else if (payload.product) description = `Venda: ${payload.product}`;
        else if (payload.data && payload.data.product) description = `Venda: ${payload.data.product}`;

        // Ensure amount is valid
        if (isNaN(amount) || amount <= 0) {
            console.error('Não foi possível extrair um valor válido do webhook.', payload);
            return res.status(200).send('OK, mas sem valor detectado.');
        }

        // Pega a data de São Paulo (UTC-3)
        const d = new Date();
        const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
        const spDate = new Date(utc + (3600000 * -3));
        const dateStr = spDate.toISOString().split('T')[0];

        // Insert into transactions (this will increase the total revenue automatically)
        const stmt = db.prepare(`
            INSERT INTO transactions (description, type, amount, date, user_id)
            VALUES (?, 'income', ?, ?, NULL)
        `);
        
        stmt.run(description, amount, dateStr);

        console.log(`Venda de R$ ${amount} registrada com sucesso!`);
        res.status(200).send('Webhook processado com sucesso');

    } catch (error) {
        console.error('Erro ao processar webhook:', error);
        res.status(500).send('Internal Server Error');
    }
});

module.exports = router;
