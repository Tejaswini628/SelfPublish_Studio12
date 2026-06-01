import { ArrowRight } from 'lucide-react';
import PricingCard from '../components/site/PricingCard';
import { heroStats, pricingTiers, trustPoints } from '../data/site';

export default function Home({ onPublish }) {
    return (
        <section id="home" className="scroll-mt-16">
            <div className="relative min-h-[86vh] overflow-hidden bg-stone-950 pt-16 text-white">
                <img
                    src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1800&q=85"
                    alt="Author workspace with manuscript pages"
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-stone-950/70" />
                <div className="relative mx-auto flex min-h-[calc(86vh-4rem)] max-w-7xl flex-col justify-center px-4 py-20 sm:px-6 lg:px-8">
                    <div className="max-w-3xl">
                        <p className="text-xs font-bold uppercase tracking-[0.24em] text-amber-200">Editing. Formatting. Covers. Launch.</p>
                        <h1 className="mt-5 text-4xl font-semibold tracking-tight sm:text-6xl lg:text-7xl">Publish Your Book Today</h1>
                        <p className="mt-6 max-w-2xl text-lg leading-8 text-stone-200">
                            A refined publishing studio for independent authors who want expert editing, elegant typesetting, memorable covers, and a clear path from manuscript to market.
                        </p>
                        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                            <button type="button" onClick={onPublish} className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-300 px-5 py-3 text-sm font-bold text-stone-950 transition hover:bg-amber-200">
                                Publish Book
                                <ArrowRight size={18} />
                            </button>
                            <a href="#portfolio" className="inline-flex items-center justify-center rounded-lg border border-white/20 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/10">
                                View Published Work
                            </a>
                        </div>
                    </div>

                    <div className="mt-14 grid max-w-3xl grid-cols-3 gap-3">
                        {heroStats.map(stat => (
                            <div key={stat.label} className="rounded-lg border border-white/10 bg-white/10 p-4 backdrop-blur">
                                <p className="text-2xl font-semibold">{stat.value}</p>
                                <p className="mt-1 text-xs text-stone-300">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-[#f7f4ee] px-4 py-12 sm:px-6 lg:px-8">
                <div className="mx-auto grid max-w-7xl gap-4 md:grid-cols-4">
                    {trustPoints.map(point => {
                        const Icon = point.icon;
                        return (
                            <div key={point.label} className="flex items-center gap-3 rounded-lg border border-stone-200 bg-white p-4">
                                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-950 text-amber-200">
                                    <Icon size={18} />
                                </span>
                                <span className="text-sm font-semibold text-stone-800">{point.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-4 pb-20 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-700">Pricing</p>
                            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950 sm:text-4xl">Choose the support your book needs</h2>
                        </div>
                        <p className="max-w-xl text-sm leading-6 text-stone-600">Start light, go deep, or let us manage the full publishing production path.</p>
                    </div>
                    <div className="grid gap-5 lg:grid-cols-3">
                        {pricingTiers.map(tier => <PricingCard key={tier.name} tier={tier} />)}
                    </div>
                </div>
            </div>
        </section>
    );
}
