const express = require('express');
const multer = require('multer');
const path = require('path');
const supabase = require('../config/supabase');
const { triggerBuild } = require('../services/buildPipeline');
const { deleteLocalFiles, getLocalFileUrl, isLocalFilePath, saveLocalFile } = require('../services/localFiles');

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 50 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (ext !== '.odt') {
            return cb(new Error('Only .odt files are allowed'));
        }
        cb(null, true);
    }
});

function getPublicUrl(bucket, filePath) {
    if (isLocalFilePath(filePath)) {
        return getLocalFileUrl(filePath);
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return data.publicUrl;
}

function isValidOdt(buffer) {
    const signature = buffer.subarray(0, 4).toString('utf8');
    const sample = buffer.subarray(0, Math.min(buffer.length, 4096)).toString('latin1');

    return signature === 'PK\u0003\u0004' && (
        sample.includes('application/vnd.oasis.opendocument.text') ||
        buffer.includes(Buffer.from('content.xml'))
    );
}

function withManuscriptUrl(book) {
    if (!book?.manuscript_path) return book;

    return {
        ...book,
        manuscript_url: getPublicUrl('manuscripts', book.manuscript_path)
    };
}

// POST /api/v1/books — Create a new book with manuscript upload
router.post('/', upload.single('manuscript'), async (req, res) => {
    try {
        const { title, author } = req.body;
        if (!title || !author || !req.file) {
            return res.status(400).json({ error: 'title, author, and manuscript file are required' });
        }

        if (!isValidOdt(req.file.buffer)) {
            return res.status(400).json({ error: 'The uploaded file is not a valid .odt document. Open it in LibreOffice Writer and save/export it as ODT, then upload that file.' });
        }

        const filePath = await saveLocalFile(`manuscripts/${Date.now()}_${req.file.originalname}`, req.file.buffer);

        const { data: book, error: dbError } = await supabase
            .from('books')
            .insert({
                title,
                author,
                status: 'processing',
                current_version: 1,
                manuscript_path: filePath
            })
            .select()
            .single();

        if (dbError) throw dbError;

        triggerBuild(book.id, 1, filePath);

        res.status(201).json(withManuscriptUrl(book));
    } catch (err) {
        console.error('POST /books error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/books — List all books with their latest builds
router.get('/', async (_req, res) => {
    try {
        const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        const booksWithBuilds = await Promise.all(
            (books || []).map(async (book) => {
                const { data: builds } = await supabase
                    .from('builds')
                    .select('format, file_url, created_at')
                    .eq('book_id', book.id)
                    .eq('version', book.current_version);
                return { ...withManuscriptUrl(book), builds: builds || [] };
            })
        );

        res.json(booksWithBuilds);
    } catch (err) {
        console.error('GET /books error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/books/:id — Get a single book with its current-version builds
router.get('/:id', async (req, res) => {
    try {
        const { data: book, error } = await supabase
            .from('books')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!book) return res.status(404).json({ error: 'Book not found' });

        const { data: builds } = await supabase
            .from('builds')
            .select('*')
            .eq('book_id', book.id)
            .eq('version', book.current_version)
            .order('created_at', { ascending: true });

        res.json({ ...withManuscriptUrl(book), builds: builds || [] });
    } catch (err) {
        console.error('GET /books/:id error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/v1/books/:id/builds — Get all builds, optionally filtered by version
router.get('/:id/builds', async (req, res) => {
    try {
        const { version } = req.query;

        let query = supabase
            .from('builds')
            .select('*')
            .eq('book_id', req.params.id);

        if (version) {
            query = query.eq('version', version);
        }

        const { data: builds, error } = await query.order('created_at', { ascending: true });

        if (error) throw error;

        res.json(builds || []);
    } catch (err) {
        console.error('GET /books/:id/builds error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/v1/books/:id — Update metadata and/or upload a new manuscript version
router.put('/:id', upload.single('manuscript'), async (req, res) => {
    try {
        const { title, author } = req.body;
        const bookId = req.params.id;

        const { data: book, error: fetchError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (fetchError) throw fetchError;
        if (!book) return res.status(404).json({ error: 'Book not found' });

        const updates = {};
        if (title) updates.title = title;
        if (author) updates.author = author;

        if (req.file) {
            if (!isValidOdt(req.file.buffer)) {
                return res.status(400).json({ error: 'The uploaded file is not a valid .odt document. Open it in LibreOffice Writer and save/export it as ODT, then upload that file.' });
            }

            const newVersion = book.current_version + 1;
            const filePath = await saveLocalFile(`manuscripts/${Date.now()}_v${newVersion}_${req.file.originalname}`, req.file.buffer);

            updates.current_version = newVersion;
            updates.manuscript_path = filePath;
            updates.status = 'processing';
        }

        if (Object.keys(updates).length === 0) {
            return res.json(withManuscriptUrl(book));
        }

        const { data: updatedBook, error: updateError } = await supabase
            .from('books')
            .update(updates)
            .eq('id', bookId)
            .select()
            .single();

        if (updateError) throw updateError;

        if (req.file) {
            triggerBuild(bookId, updatedBook.current_version, updatedBook.manuscript_path);
        }

        res.json(withManuscriptUrl(updatedBook));
    } catch (err) {
        console.error('PUT /books/:id error:', err);
        res.status(500).json({ error: err.message });
    }
});

// DELETE /api/v1/books/:id — Delete book and all associated files
router.delete('/:id', async (req, res) => {
    try {
        const bookId = req.params.id;

        const { data: book, error: bookError } = await supabase
            .from('books')
            .select('*')
            .eq('id', bookId)
            .single();

        if (bookError) throw bookError;
        if (!book) return res.status(404).json({ error: 'Book not found' });

        const { data: builds, error: buildsError } = await supabase
            .from('builds')
            .select('file_url')
            .eq('book_id', bookId);

        if (buildsError) throw buildsError;

        const pathsToDelete = [];

        if (book.manuscript_path) {
            pathsToDelete.push(book.manuscript_path);
        }

        (builds || []).forEach(b => {
            try {
                const url = new URL(b.file_url);
                const p = decodeURIComponent(url.pathname.split('/').slice(3).join('/'));
                if (p) pathsToDelete.push(p);
            } catch {
                // skip malformed URLs
            }
        });

        const localPaths = pathsToDelete.filter(isLocalFilePath);
        if (localPaths.length > 0) {
            await deleteLocalFiles(localPaths);
        }

        const remotePaths = pathsToDelete.filter(filePath => !isLocalFilePath(filePath));
        if (remotePaths.length > 0) {
            const { error: storageError } = await supabase.storage
                .from('manuscripts')
                .remove(remotePaths);

            if (storageError) {
                console.error('Storage cleanup error:', storageError);
            }
        }

        const { error: deleteError } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);

        if (deleteError) throw deleteError;

        res.json({ message: 'Book and all associated assets deleted' });
    } catch (err) {
        console.error('DELETE /books/:id error:', err);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
