const nodemailer = require('nodemailer');

const QUOTE_RECIPIENT = process.env.QUOTE_RECIPIENT_EMAIL || 'selfpublish57@gmail.com';

function getTransport() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS?.replace(/\s+/g, '');

    if (!host || !user || !pass) {
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass
        }
    });
}

function formatQuoteRequest(payload) {
    return [
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Book Genre: ${payload.genre || 'Not provided'}`,
        `Timeline: ${payload.timeline || 'Not provided'}`,
        `Service Needed: ${payload.service}`,
        '',
        'Project Details:',
        payload.message
    ].join('\n');
}

async function sendQuoteRequestEmail(payload) {
    const transport = getTransport();

    if (!transport) {
        return { sent: false, reason: 'Email settings are not configured.' };
    }

    await transport.sendMail({
        from: `"Self Publish Studio" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`,
        to: QUOTE_RECIPIENT,
        replyTo: payload.email,
        subject: `Publishing quote request from ${payload.name}`,
        text: formatQuoteRequest(payload)
    });

    return { sent: true, recipient: QUOTE_RECIPIENT };
}

module.exports = {
    QUOTE_RECIPIENT,
    sendQuoteRequestEmail
};
