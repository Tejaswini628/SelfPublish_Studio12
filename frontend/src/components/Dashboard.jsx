import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getBooks, deleteBook, createBook } from '../api/client';
import StatusBadge from './StatusBadge';
import FileDropzone from './FileDropzone';

export default function Dashboard() {
    const [books, setBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [error, setError] = useState(null);
    const [uploading, setUploading] = useState(false);

    useEffect(() => { loadBooks(); }, []);

    useEffect(() => {
        const hasProcessingBooks = books.some(book => book.status === 'processing');
        if (!hasProcessingBooks) return;

        const interval = setInterval(() => {
            loadBooks({ showSpinner: false });
        }, 2000);

        return () => clearInterval(interval);
    }, [books]);

    async function loadBooks({ showSpinner = true } = {}) {
        try {
            if (showSpinner) setLoading(true);
            const data = await getBooks();
            setBooks(data);
        } catch (err) {
            setError(err.message);
        } finally {
            if (showSpinner) setLoading(false);
        }
    }

    async function handleCreate(file, metadata) {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('manuscript', file);
            formData.append('title', metadata.title);
            formData.append('author', metadata.author);
            await createBook(formData);
            setShowCreate(false);
            await loadBooks();
        } catch (err) {
            setError(err.message);
        } finally {
            setUploading(false);
        }
    }

    async function handleDelete(id, e) {
        e.preventDefault();
        e.stopPropagation();
        if (!confirm('Delete this book and all its builds?')) return;
        try {
            await deleteBook(id);
            await loadBooks();
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const completedCount = books.filter(book => book.status === 'completed').length;
    const processingCount = books.filter(book => book.status === 'processing').length;

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300">Production desk</p>
                    <h1 className="mt-2 text-3xl sm:text-4xl font-semibold tracking-tight">Projects</h1>
                    <p className="mt-2 text-slate-400">{books.length} book{books.length !== 1 ? 's' : ''} in your studio</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/30 transition hover:bg-cyan-200"
                >
                    <span className="text-lg leading-none">+</span>
                    New Project
                </button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-lg border border-white/10 bg-white/[0.03] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Total books</p>
                    <p className="mt-2 text-2xl font-semibold">{books.length}</p>
                </div>
                <div className="rounded-lg border border-emerald-300/15 bg-emerald-400/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-emerald-300/80">Completed</p>
                    <p className="mt-2 text-2xl font-semibold">{completedCount}</p>
                </div>
                <div className="rounded-lg border border-amber-300/15 bg-amber-400/[0.04] p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-amber-300/80">Building now</p>
                    <p className="mt-2 text-2xl font-semibold">{processingCount}</p>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-400/20 rounded-lg text-rose-200 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError(null)} className="font-semibold text-rose-100 hover:text-white">Dismiss</button>
                </div>
            )}

            {showCreate && (
                <div className="rounded-lg border border-white/10 bg-[#111827] p-5 shadow-2xl shadow-black/20">
                    <div className="mb-5">
                        <h2 className="text-lg font-semibold">Create New Project</h2>
                        <p className="mt-1 text-sm text-slate-400">Upload an ODT manuscript and start the build pipeline.</p>
                    </div>
                    <FileDropzone onSubmit={handleCreate} onCancel={() => setShowCreate(false)} uploading={uploading} />
                </div>
            )}

            {books.length === 0 ? (
                <div className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] py-24 text-center text-slate-500">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-sm font-black text-cyan-200">ODT</div>
                    <p className="text-xl font-medium mb-2 text-slate-300">No projects yet</p>
                    <p className="text-sm">Upload your first .odt manuscript to get started.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {books.map(book => (
                        <Link
                            key={book.id}
                            to={`/books/${book.id}`}
                            className="group relative block overflow-hidden rounded-lg border border-white/10 bg-[#111827] p-5 shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:border-cyan-300/30 hover:shadow-cyan-950/20"
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-300 via-emerald-300 to-amber-300 opacity-70" />
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-cyan-300/20 bg-cyan-300/10 text-lg font-black text-cyan-200">
                                    {book.title.charAt(0).toUpperCase()}
                                </div>
                                <StatusBadge status={book.status} />
                            </div>
                            <div className="mt-5">
                                <h3 className="font-semibold text-xl tracking-tight group-hover:text-cyan-200 transition-colors">{book.title}</h3>
                                <p className="mt-1 text-sm text-slate-400">{book.author}</p>
                            </div>
                            <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-500">
                                <span className="font-semibold text-slate-300">v{book.current_version}</span>
                                <span>{new Date(book.updated_at).toLocaleDateString()}</span>
                            </div>
                            <button
                                onClick={(e) => handleDelete(book.id, e)}
                                className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity rounded-md border border-rose-300/20 bg-rose-400/10 px-2 py-1 text-xs font-semibold text-rose-200 hover:bg-rose-400/20"
                                title="Delete book"
                            >
                                Delete
                            </button>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
