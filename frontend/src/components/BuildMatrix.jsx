const FORMATS = [
    { key: 'epub', label: 'EPUB', short: 'EP', accent: 'emerald' },
    { key: 'pdf', label: 'PDF', short: 'PF', accent: 'rose' },
    { key: 'xhtml', label: 'XHTML', short: 'XH', accent: 'sky' },
    { key: 'tex', label: 'LaTeX', short: 'TX', accent: 'amber' },
    { key: 'lint', label: 'Lint', short: 'LN', accent: 'violet' },
    { key: 'diff', label: 'Diff', short: 'DF', accent: 'cyan' }
];

const accents = {
    emerald: 'border-emerald-300/15 bg-emerald-400/[0.04] text-emerald-200',
    rose: 'border-rose-300/15 bg-rose-400/[0.04] text-rose-200',
    sky: 'border-sky-300/15 bg-sky-400/[0.04] text-sky-200',
    amber: 'border-amber-300/15 bg-amber-400/[0.04] text-amber-200',
    violet: 'border-violet-300/15 bg-violet-400/[0.04] text-violet-200',
    cyan: 'border-cyan-300/15 bg-cyan-400/[0.04] text-cyan-200'
};

export default function BuildMatrix({ builds, status }) {
    return (
        <div>
            <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Build outputs</p>
                    <h2 className="mt-1 text-lg font-semibold">Compilation Targets</h2>
                </div>
                <p className="text-xs text-slate-500">{builds.length}/6 ready</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FORMATS.map(({ key, label, short, accent }) => {
                    const build = builds.find(b => b.format === key);
                    const ready = !!build;
                    const building = status === 'processing' && !ready;

                    return (
                        <div
                            key={key}
                            className={`rounded-lg border p-4 transition ${accents[accent]} ${!ready && !building ? 'opacity-55' : ''}`}
                        >
                            <div className="flex items-center justify-between gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white/10 text-xs font-black">{short}</div>
                                {building && <span className="h-3 w-3 rounded-full border-2 border-current border-t-transparent animate-spin" />}
                            </div>
                            <h3 className="mt-4 font-semibold text-sm text-slate-100">{label}</h3>

                            {building ? (
                                <div className="mt-3 text-xs font-semibold text-amber-200">Building</div>
                            ) : ready ? (
                                <a
                                    href={build.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-3 inline-flex rounded-md border border-white/10 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-100 transition hover:bg-white/15"
                                >
                                    Download
                                </a>
                            ) : (
                                <span className="mt-3 inline-flex text-xs text-slate-600">Pending</span>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
