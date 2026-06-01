import { useState, useEffect } from 'react';

export default function DiffViewer({ url }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!url) { setContent(''); return; }
        setLoading(true);
        fetch(url)
            .then(r => r.text())
            .then(setContent)
            .catch(() => setContent('Failed to load diff'))
            .finally(() => setLoading(false));
    }, [url]);

    if (!url) {
        return (
            <div className="text-center py-12 text-slate-500 text-sm">
                <p className="font-medium text-slate-400">No diff available yet.</p>
                <p className="text-xs mt-1">Generated when a new version replaces an older one.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="w-5 h-5 border-2 border-cyan-300 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const lines = content.split('\n');
    return (
        <div className="bg-slate-950 rounded-lg border border-white/10 p-4 max-h-96 overflow-auto font-mono text-xs leading-relaxed">
            {lines.map((line, i) => {
                let style = 'text-slate-400';
                let bg = '';
                if (line.startsWith('+') && !line.startsWith('+++')) {
                    style = 'text-emerald-300';
                    bg = 'bg-emerald-400/10';
                } else if (line.startsWith('-') && !line.startsWith('---')) {
                    style = 'text-rose-300';
                    bg = 'bg-rose-400/10';
                } else if (line.startsWith('@')) {
                    style = 'text-cyan-200';
                    bg = 'bg-cyan-400/10';
                } else if (line.startsWith('diff') || line.startsWith('index')) {
                    style = 'text-slate-600';
                } else if (line.startsWith('From') || line.startsWith('Date') || line.startsWith('Subject')) {
                    style = 'text-slate-500';
                }
                return (
                    <div key={i} className={`${style} ${bg} whitespace-pre-wrap px-2`}>{line}</div>
                );
            })}
        </div>
    );
}
