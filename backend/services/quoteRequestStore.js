const fs = require('fs/promises');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { UPLOAD_ROOT } = require('./localFiles');

const QUOTE_REQUESTS_FILE = path.join(UPLOAD_ROOT, 'quote-requests.jsonl');

async function saveQuoteRequestLocally(payload) {
    await fs.mkdir(UPLOAD_ROOT, { recursive: true });

    const record = {
        id: uuidv4(),
        created_at: new Date().toISOString(),
        ...payload
    };

    await fs.appendFile(QUOTE_REQUESTS_FILE, `${JSON.stringify(record)}\n`, 'utf8');
    return record;
}

module.exports = {
    saveQuoteRequestLocally
};
