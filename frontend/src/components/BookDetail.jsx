import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getBook, getBuilds, updateBook } from '../api/client';
import StatusBadge from './StatusBadge';
import FileDropzone from './FileDropzone';
import BuildMatrix from './BuildMatrix';
import LintViewer from './LintViewer';
import DiffViewer from './DiffViewer';

export default function BookDetail() {
    const { id } = useParams();
    const [book, setBook] = useState(null);
    const [builds, setBuilds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [activeTab, setActiveTab] = useState('lint');

    useEffect(() => { loadBook(); }, [id]);

    useEffect(() => {
        if (book?.status !== 'processing') return;

        const interval = setInterval(() => {
            loadBook({ showSpinner: false });
        }, 2000);

        return () => clearInterval(interval);
    }, [book?.status, id]);

    async function loadBook({ showSpinner = true } = {}) {
        try {
            if (showSpinner) setLoading(true);
            const data = await getBook(id);
            setBook(data);
            const b = await getBuilds(id, data.current_version);
            setBuilds(b || []);
        } catch (err) {
            console.error(err);
        } finally {
            if (showSpinner) setLoading(false);
        }
    }

    async function handleNewVersion(file, metadata) {
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('manuscript', file);
            if (metadata.title) formData.append('title', metadata.title);
            if (metadata.author) formData.append('author', metadata.author);
            await updateBook(id, formData);
            await loadBook();
        } catch (err) {
            console.error(err);
        } finally {
            setUploading(false);
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="w-8 h-8 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!book) {
        return (
            <div className="rounded-lg border border-white/10 bg-white/[0.03] py-32 text-center text-slate-500">
                <p className="text-xl text-slate-300">Book not found</p>
                <Link to="/" className="text-cyan-200 mt-2 inline-block font-semibold hover:text-cyan-100">Back to Dashboard</Link>
            </div>
        );
    }

    const lintBuild = builds.find(b => b.format === 'lint');
    const diffBuild = builds.find(b => b.format === 'diff');
    const inputClass = 'w-full rounded-lg border border-white/10 bg-slate-950/60 px-3.5 py-2.5 text-sm text-slate-300 outline-none';

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                <div>
                    <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-cyan-200">
                        <span aria-hidden="true">&lt;</span>
                        Projects
                    </Link>
                    <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-3xl font-semibold tracking-tight">{book.title}</h1>
                        <StatusBadge status={book.status} />
                    </div>
                    <p className="mt-2 text-slate-400">Version {book.current_version} by {book.author}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/[0.03] px-4 py-3 text-right">
                    <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Outputs ready</p>
                    <p className="mt-1 text-2xl font-semibold">{builds.length}<span className="text-sm text-slate-500">/6</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
                <div className="lg:col-span-2 space-y-6">
                    <div className="rounded-lg border border-white/10 bg-[#111827] p-5">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Project</p>
                            <h2 className="mt-1 text-lg font-semibold">Metadata</h2>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="book-title" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Title</label>
                                <input id="book-title" name="title" type="text" defaultValue={book.title} autoComplete="off" className={inputClass} readOnly />
                            </div>
                            <div>
                                <label htmlFor="book-author" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Author</label>
                                <input id="book-author" name="author" type="text" defaultValue={book.author} autoComplete="name" className={inputClass} readOnly />
                            </div>
                            <div className="grid grid-cols-1 gap-3 border-t border-white/10 pt-4 text-xs text-slate-500 sm:grid-cols-2">
                                <p><span className="block text-slate-400">Created</span>{new Date(book.created_at).toLocaleString()}</p>
                                <p><span className="block text-slate-400">Updated</span>{new Date(book.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-lg border border-white/10 bg-[#111827] p-5">
                        <div className="mb-5">
                            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Revision</p>
                            <h2 className="mt-1 text-lg font-semibold">Upload New Version</h2>
                        </div>
                        <FileDropzone
                            onSubmit={handleNewVersion}
                            uploading={uploading}
                            initialData={{ title: book.title, author: book.author }}
                        />
                    </div>
                </div>

                <div className="lg:col-span-3 space-y-6">
                    <BuildMatrix builds={builds} status={book.status} />

                    <div className="overflow-hidden rounded-lg border border-white/10 bg-[#111827]">
                        <div className="flex border-b border-white/10 bg-slate-950/30">
                            <button
                                onClick={() => setActiveTab('lint')}
                                className={`px-5 py-3 text-sm font-semibold transition-colors ${
                                    activeTab === 'lint'
                                        ? 'text-cyan-200 border-b-2 border-cyan-300'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                Lint Report
                            </button>
                            <button
                                onClick={() => setActiveTab('diff')}
                                className={`px-5 py-3 text-sm font-semibold transition-colors ${
                                    activeTab === 'diff'
                                        ? 'text-cyan-200 border-b-2 border-cyan-300'
                                        : 'text-slate-500 hover:text-slate-300'
                                }`}
                            >
                                Git Diff Review
                            </button>
                        </div>
                        <div className="p-4">
                            {activeTab === 'lint' && <LintViewer url={lintBuild?.file_url} />}
                            {activeTab === 'diff' && <DiffViewer url={diffBuild?.file_url} />}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
