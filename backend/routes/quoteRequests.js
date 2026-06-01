const express = require('express');
const supabase = require('../config/supabase');
const { QUOTE_RECIPIENT, sendQuoteRequestEmail } = require('../services/email');
const { saveQuoteRequestLocally } = require('../services/quoteRequestStore');

const router = express.Router();

const SERVICES = new Set([
    'Editing',
    'Formatting',
    'Cover Design',
    'Full Publishing Package'
]);

function clean(value) {
    return typeof value === 'string' ? value.trim() : '';
}

router.post('/', async (req, res, next) => {
    try {
        const payload = {
            name: clean(req.body.name),
            email: clean(req.body.email),
            genre: clean(req.body.genre),
            timeline: clean(req.body.timeline),
            service: clean(req.body.service),
            message: clean(req.body.message)
        };

        if (!payload.name || !payload.email || !payload.message) {
            res.status(400).json({ error: 'Name, email, and project details are required.' });
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
            res.status(400).json({ error: 'Enter a valid email address.' });
            return;
        }

        if (!SERVICES.has(payload.service)) {
            res.status(400).json({ error: 'Choose a valid service.' });
            return;
        }

        let emailResult;
        try {
            emailResult = await sendQuoteRequestEmail(payload);
        } catch (error) {
            console.warn('Quote request email could not be sent:', error.message);
            emailResult = { sent: false, reason: error.message };
        }
        const { data, error } = await supabase
            .from('quote_requests')
            .insert(payload)
            .select('id, created_at')
            .single();

        if (error) {
            console.warn('Saving quote request locally because Supabase insert failed:', error.message);
            const localRecord = await saveQuoteRequestLocally(payload);
            res.status(201).json({
                id: localRecord.id,
                createdAt: localRecord.created_at,
                storedIn: 'local',
                email: emailResult.sent ? 'sent' : 'not_sent',
                recipient: QUOTE_RECIPIENT,
                message: 'Quote request received.'
            });
            return;
        }

        res.status(201).json({
            id: data.id,
            createdAt: data.created_at,
            storedIn: 'supabase',
            email: emailResult.sent ? 'sent' : 'not_sent',
            recipient: QUOTE_RECIPIENT,
            message: 'Quote request received.'
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
