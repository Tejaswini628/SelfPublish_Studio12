import { useState, useRef } from 'react';

export default function FileDropzone({ onSubmit, onCancel, uploading, initialData }) {
    const [file, setFile] = useState(null);
    const [dragOver, setDragOver] = useState(false);
    const [title, setTitle] = useState(initialData?.title || '');
    const [author, setAuthor] = useState(initialData?.author || '');
    const inputRef = useRef();

    function handleDrop(e) {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files[0];
        if (f && f.name.endsWith('.odt')) setFile(f);
    }

    function handleFileSelect(e) {
        const f = e.target.files[0];
        if (f) setFile(f);
    }

    function handleSubmit(e) {
        e.preventDefault();
        if (!file || !title || !author) return;
        onSubmit(file, { title, author });
    }

    const inputClass = 'w-full rounded-lg border border-white/10 bg-slate-950/70 px-3.5 py-2.5 text-sm text-slate-100 outline-none transition placeholder:text-slate-600 focus:border-cyan-300/60 focus:ring-4 focus:ring-cyan-300/10';

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                    <label htmlFor="file-title" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Title</label>
                    <input
                        id="file-title"
                        name="title"
                        type="text"
                        value={title}
                        onChange={e => setTitle(e.target.value)}
                        autoComplete="off"
                        className={inputClass}
                        placeholder="My Novel"
                        required
                    />
                </div>
                <div>
                    <label htmlFor="file-author" className="block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500 mb-2">Author</label>
                    <input
                        id="file-author"
                        name="author"
                        type="text"
                        value={author}
                        onChange={e => setAuthor(e.target.value)}
                        autoComplete="name"
                        className={inputClass}
                        placeholder="Jane Doe"
                        required
                    />
                </div>
            </div>

            <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => inputRef.current?.click()}
                className={`cursor-pointer rounded-lg border border-dashed p-7 text-center transition ${
                    dragOver
                        ? 'border-cyan-300 bg-cyan-300/10'
                        : 'border-white/15 bg-slate-950/40 hover:border-cyan-300/40 hover:bg-slate-950/60'
                }`}
            >
                <input
                    id="file-manuscript"
                    name="manuscript"
                    ref={inputRef}
                    type="file"
                    accept=".odt"
                    aria-label="ODT manuscript"
                    onChange={handleFileSelect}
                    className="hidden"
                />
                {file ? (
                    <div>
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-xs font-black text-emerald-200">ODT</div>
                        <p className="font-semibold text-slate-100">{file.name}</p>
                        <p className="text-sm text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                        <button type="button" onClick={() => setFile(null)} className="mt-3 text-xs font-semibold text-cyan-200 hover:text-cyan-100">
                            Remove file
                        </button>
                    </div>
                ) : (
                    <div>
                        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] text-xs font-black text-cyan-200">ODT</div>
                        <p className="text-sm font-medium text-slate-300">Drop your manuscript here or click to browse</p>
                        <p className="text-xs text-slate-600 mt-1">LibreOffice Writer format only</p>
                    </div>
                )}
            </div>

            <div className="flex justify-end gap-3">
                {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-400 transition hover:text-slate-100">
                        Cancel
                    </button>
                )}
                <button
                    type="submit"
                    disabled={!file || !title || !author || uploading}
                    className="inline-flex min-w-36 items-center justify-center rounded-lg bg-cyan-300 px-5 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500"
                >
                    {uploading ? (
                        <span className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                            Uploading
                        </span>
                    ) : (
                        'Upload & Build'
                    )}
                </button>
            </div>
        </form>
    );
}
