import { useState, useEffect } from 'react';

export default function LintViewer({ url }) {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!url) { setContent(''); return; }
        setLoading(true);
        fetch(url)
            .then(r => r.text())
            .then(setContent)
            .catch(() => setContent('Failed to load lint report'))
            .finally(() => setLoading(false));
    }, [url]);

    if (!url) {
        return (
            <div className="text-center py-12 text-slate-500 text-sm">
                <p className="font-medium text-slate-400">No lint report available yet.</p>
                <p className="text-xs mt-1">Generated after the build completes.</p>
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
                if (line.startsWith('  [W')) style = 'text-amber-300';
                else if (line.startsWith('[ERROR]')) style = 'text-rose-300';
                else if (line.startsWith('[PASS]')) style = 'text-emerald-300';
                else if (line.match(/^[A-Z\s]{4,}$/)) style = 'text-cyan-200 font-bold';
                else if (line.includes('---')) style = 'text-slate-700';
                return (
                    <div key={i} className={`${style} whitespace-pre-wrap`}>{line}</div>
                );
            })}
        </div>
    );
}
