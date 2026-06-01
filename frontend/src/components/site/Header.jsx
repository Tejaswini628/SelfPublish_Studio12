import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { navItems } from '../../data/site';

export default function Header({ onPublish }) {
    const [open, setOpen] = useState(false);

    function closeMenu() {
        setOpen(false);
    }

    return (
        <header className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-stone-950/80 text-white backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <a href="#home" onClick={closeMenu} className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-300 text-sm font-black text-stone-950">SP</span>
                    <span>
                        <span className="block text-base font-semibold tracking-tight">Self Publish Studio</span>
                        <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Author services</span>
                    </span>
                </a>

                <nav className="hidden items-center gap-7 md:flex">
                    {navItems.map(item => (
                        <a key={item.href} href={item.href} className="text-sm font-semibold text-stone-300 transition hover:text-amber-200">
                            {item.label}
                        </a>
                    ))}
                    <button type="button" onClick={onPublish} className="rounded-lg bg-amber-300 px-4 py-2 text-sm font-bold text-stone-950 transition hover:bg-amber-200">
                        Publish Book
                    </button>
                </nav>

                <button
                    type="button"
                    onClick={() => setOpen(value => !value)}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 text-stone-200 md:hidden"
                    aria-label="Toggle navigation menu"
                    aria-expanded={open}
                >
                    {open ? <X size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {open && (
                <div className="border-t border-white/10 bg-stone-950 px-4 py-4 md:hidden">
                    <nav className="mx-auto flex max-w-7xl flex-col gap-2">
                        {navItems.map(item => (
                            <a
                                key={item.href}
                                href={item.href}
                                onClick={closeMenu}
                                className="rounded-lg px-3 py-3 text-sm font-semibold text-stone-200 transition hover:bg-white/10"
                            >
                                {item.label}
                            </a>
                        ))}
                        <button
                            type="button"
                            onClick={() => {
                                closeMenu();
                                onPublish();
                            }}
                            className="rounded-lg bg-amber-300 px-3 py-3 text-left text-sm font-bold text-stone-950"
                        >
                            Publish Book
                        </button>
                    </nav>
                </div>
            )}
        </header>
    );
}
