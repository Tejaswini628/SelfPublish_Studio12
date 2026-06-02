require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { UPLOAD_ROOT } = require('./services/localFiles');
const booksRouter = require('./routes/books');
const quoteRequestsRouter = require('./routes/quoteRequests');

const app = express();
const PORT = process.env.PORT || 3001;

function normalizeOrigin(value) {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    if (!trimmed) {
        return null;
    }

    try {
        return new URL(trimmed).origin;
    } catch {
        try {
            return new URL(`https://${trimmed}`).origin;
        } catch {
            return trimmed;
        }
    }
}

const configuredOrigins = (process.env.FRONTEND_URL || '')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean);

const allowedOrigins = new Set([
    ...configuredOrigins,
    'https://self-publish-studio12-lzvp.vercel.app',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://[::1]:5173'
]);

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error(`CORS blocked origin: ${origin}`));
    }
}));
app.use(express.json());
app.use('/uploads', express.static(UPLOAD_ROOT));

app.use('/api/v1/books', booksRouter);
app.use('/api/v1/quote-requests', quoteRequestsRouter);

app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, _req, res, _next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Self Publish Studio API running on port ${PORT}`);
});
