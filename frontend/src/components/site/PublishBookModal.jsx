import { useEffect, useRef, useState } from 'react';
import { BookOpen, CheckCircle2, Loader2, Upload, X } from 'lucide-react';
import { createBook, getBook, getBuilds } from '../../api/client';

export default function PublishBookModal({ open, onClose, onPublished }) {
    const [title, setTitle] = useState('');
    const [author, setAuthor] = useState('');
    const [file, setFile] = useState(null);
    const [book, setBook] = useState(null);
    const [builds, setBuilds] = useState([]);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef(null);
    const publishedBookRef = useRef(null);

    useEffect(() => {
        if (!book || book.status !== 'processing') return;

        const interval = setInterval(async () => {
            try {
                const nextBook = await getBook(book.id);
                const nextBuilds = await getBuilds(book.id, nextBook.current_version);
                setBook(nextBook);
                setBuilds(nextBuilds || []);
            } catch (err) {
                setError(err.message);
            }
        }, 2000);

        return () => clearInterval(interval);
    }, [book]);

    useEffect(() => {
        if (book?.status !== 'completed' || publishedBookRef.current === book.id) return;

        publishedBookRef.current = book.id;
        onPublished?.(book);
    }, [book, onPublished]);

    if (!open) return null;

    async function handleSubmit(event) {
        event.preventDefault();
        if (!file) {
            setError('Please choose an .odt manuscript file.');
            return;
        }

        setSubmitting(true);
        setError('');
        setBuilds([]);

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('author', author);
            formData.append('manuscript', file);
            const created = await createBook(formData);
            setBook(created);
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    }

    function resetAndClose() {
        setTitle('');
        setAuthor('');
        setFile(null);
        setBook(null);
        setBuilds([]);
        setError('');
        setSubmitting(false);
        publishedBookRef.current = null;
        onClose();
    }

    const isProcessing = book?.status === 'processing';
    const isCompleted = book?.status === 'completed';
    const isFailed = book?.status === 'failed';

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-stone-950/70 px-4 py-8 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-lg bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Publish Book</p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight">Upload your manuscript</h2>
                        <p className="mt-1 text-sm text-stone-600">Connected to your backend build pipeline.</p>
                    </div>
                    <button type="button" onClick={resetAndClose} className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50" aria-label="Close publish form">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    {!book && (
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    id="publish-book-title"
                                    label="Book Title"
                                    name="title"
                                    value={title}
                                    onChange={setTitle}
                                    placeholder="The Quiet Atlas"
                                    autoComplete="off"
                                    required
                                />
                                <Field
                                    id="publish-book-author"
                                    label="Author"
                                    name="author"
                                    value={author}
                                    onChange={setAuthor}
                                    placeholder="Jane Doe"
                                    autoComplete="name"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="publish-manuscript" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-stone-500">ODT Manuscript</label>
                                <button
                                    type="button"
                                    onClick={() => inputRef.current?.click()}
                                    className="flex w-full flex-col items-center justify-center rounded-lg border border-dashed border-stone-300 bg-stone-50 px-5 py-10 text-center transition hover:border-emerald-700/50 hover:bg-emerald-50"
                                >
                                    <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-stone-950 text-amber-200">
                                        <Upload size={20} />
                                    </span>
                                    <span className="mt-3 text-sm font-semibold text-stone-900">{file ? file.name : 'Choose an .odt file'}</span>
                                    <span className="mt-1 text-xs text-stone-500">{file ? `${(file.size / 1024).toFixed(1)} KB` : 'LibreOffice Writer manuscripts only'}</span>
                                </button>
                                <input
                                    id="publish-manuscript"
                                    name="manuscript"
                                    ref={inputRef}
                                    type="file"
                                    accept=".odt"
                                    aria-label="ODT manuscript"
                                    className="hidden"
                                    onChange={event => setFile(event.target.files?.[0] || null)}
                                />
                            </div>

                            {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
                            >
                                {submitting ? <Loader2 className="animate-spin" size={18} /> : <BookOpen size={18} />}
                                {submitting ? 'Uploading...' : 'Publish Book'}
                            </button>
                        </form>
                    )}

                    {book && (
                        <div className="space-y-5">
                            <div className="rounded-lg border border-stone-200 bg-stone-50 p-5">
                                <div className="flex items-center gap-3">
                                    <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${
                                        isCompleted ? 'bg-emerald-100 text-emerald-700' : isFailed ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                                    }`}>
                                        {isProcessing ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                                    </span>
                                    <div>
                                        <h3 className="font-semibold text-stone-950">{book.title}</h3>
                                        <p className="text-sm text-stone-600">
                                            {isProcessing && 'Processing your manuscript. Downloads will appear automatically.'}
                                            {isCompleted && 'Build complete. Your publishing files are ready.'}
                                            {isFailed && 'Build failed. Please try another manuscript or check the backend logs.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-2">
                                {['epub', 'pdf', 'xhtml', 'tex', 'lint', 'diff'].map(format => {
                                    const build = builds.find(item => item.format === format);
                                    return (
                                        <a
                                            key={format}
                                            href={build?.file_url || '#'}
                                            target={build ? '_blank' : undefined}
                                            rel={build ? 'noopener noreferrer' : undefined}
                                            className={`rounded-lg border px-4 py-3 text-sm font-semibold uppercase tracking-[0.08em] ${
                                                build
                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                                    : 'pointer-events-none border-stone-200 bg-stone-50 text-stone-400'
                                            }`}
                                        >
                                            {format}
                                        </a>
                                    );
                                })}
                            </div>

                            {error && <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">{error}</p>}

                            <div className="flex flex-col gap-3 sm:flex-row">
                                <button type="button" onClick={() => { setBook(null); setBuilds([]); setFile(null); publishedBookRef.current = null; }} className="rounded-lg border border-stone-200 px-5 py-3 text-sm font-bold text-stone-700 hover:bg-stone-50">
                                    Publish Another
                                </button>
                                <button type="button" onClick={resetAndClose} className="rounded-lg bg-stone-950 px-5 py-3 text-sm font-bold text-white hover:bg-stone-800">
                                    Done
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function Field({ id, label, name, value, onChange, placeholder, autoComplete, required }) {
    return (
        <div>
            <label htmlFor={id} className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{label}</label>
            <input
                id={id}
                name={name}
                type="text"
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required={required}
                className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
            />
        </div>
    );
}
