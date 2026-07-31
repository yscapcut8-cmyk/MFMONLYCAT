const express = require('express');
const db = require('../database/connection');
const router = express.Router();

// Get subscription status
router.post('/status', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint is required' });
    try {
        const stmt = db.prepare('SELECT id FROM push_subscriptions WHERE endpoint = ?');
        const sub = stmt.get(endpoint);
        res.json({ isSubscribed: !!sub });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Subscribe
router.post('/subscribe', (req, res) => {
    const subscription = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
        return res.status(400).json({ error: 'Invalid subscription object' });
    }
    
    try {
        const stmt = db.prepare(`
            INSERT OR REPLACE INTO push_subscriptions (endpoint, p256dh, auth) 
            VALUES (?, ?, ?)
        `);
        stmt.run(subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth);
        res.status(201).json({ message: 'Subscribed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to subscribe' });
    }
});

// Unsubscribe
router.post('/unsubscribe', (req, res) => {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'Endpoint is required' });

    try {
        const stmt = db.prepare('DELETE FROM push_subscriptions WHERE endpoint = ?');
        stmt.run(endpoint);
        res.status(200).json({ message: 'Unsubscribed successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to unsubscribe' });
    }
});

module.exports = router;
