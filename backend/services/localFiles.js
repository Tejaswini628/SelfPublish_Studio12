const fs = require('fs/promises');
const path = require('path');

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

function publicBaseUrl() {
    return process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 3001}`;
}

function normalizeStoragePath(filePath) {
    return filePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

function resolveUploadPath(filePath) {
    const normalized = normalizeStoragePath(filePath);
    const resolved = path.resolve(UPLOAD_ROOT, normalized);
    const root = path.resolve(UPLOAD_ROOT);

    if (!resolved.startsWith(root)) {
        throw new Error('Invalid upload path');
    }

    return resolved;
}

async function saveLocalFile(filePath, content) {
    const normalized = normalizeStoragePath(filePath);
    const target = resolveUploadPath(normalized);

    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content);

    return normalized;
}

async function readLocalFile(filePath) {
    return fs.readFile(resolveUploadPath(filePath));
}

async function deleteLocalFiles(filePaths) {
    await Promise.all(
        filePaths.map(async filePath => {
            try {
                await fs.rm(resolveUploadPath(filePath), { force: true });
            } catch {
                // Best-effort cleanup.
            }
        })
    );
}

function isLocalFilePath(filePath) {
    return typeof filePath === 'string' && (filePath.startsWith('manuscripts/') || filePath.startsWith('builds/'));
}

function getLocalFileUrl(filePath) {
    return `${publicBaseUrl()}/uploads/${encodeURI(normalizeStoragePath(filePath)).replace(/#/g, '%23')}`;
}

module.exports = {
    UPLOAD_ROOT,
    deleteLocalFiles,
    getLocalFileUrl,
    isLocalFilePath,
    readLocalFile,
    saveLocalFile
};
