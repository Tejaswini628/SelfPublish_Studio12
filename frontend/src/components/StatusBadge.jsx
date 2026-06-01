const config = {
    processing: { bg: 'bg-amber-400/10 border-amber-300/20', text: 'text-amber-200', dot: 'bg-amber-300', label: 'Processing' },
    completed:  { bg: 'bg-emerald-400/10 border-emerald-300/20', text: 'text-emerald-200', dot: 'bg-emerald-300', label: 'Completed' },
    failed:     { bg: 'bg-rose-400/10 border-rose-300/20', text: 'text-rose-200', dot: 'bg-rose-300', label: 'Failed' }
};

export default function StatusBadge({ status }) {
    const c = config[status] || config.processing;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${c.bg} ${c.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${c.dot} ${status === 'processing' ? 'animate-pulse' : ''}`} />
            {c.label}
        </span>
    );
}
