import { Check } from 'lucide-react';

export default function PricingCard({ tier }) {
    return (
        <article className={`rounded-lg border p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
            tier.featured
                ? 'border-stone-950 bg-stone-950 text-white shadow-stone-300'
                : 'border-stone-200 bg-white text-stone-950'
        }`}>
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h3 className="text-xl font-semibold">{tier.name}</h3>
                    <p className={`mt-2 text-sm leading-6 ${tier.featured ? 'text-stone-300' : 'text-stone-600'}`}>{tier.description}</p>
                </div>
                {tier.featured && <span className="rounded-full bg-amber-300 px-3 py-1 text-xs font-bold text-stone-950">Popular</span>}
            </div>
            <p className="mt-6 text-4xl font-semibold tracking-tight">{tier.price}</p>
            <ul className="mt-6 space-y-3">
                {tier.features.map(feature => (
                    <li key={feature} className={`flex gap-3 text-sm ${tier.featured ? 'text-stone-200' : 'text-stone-700'}`}>
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>
            <a
                href="#contact"
                className={`mt-8 inline-flex w-full justify-center rounded-lg px-4 py-3 text-sm font-bold transition ${
                    tier.featured
                        ? 'bg-amber-300 text-stone-950 hover:bg-amber-200'
                        : 'bg-stone-950 text-white hover:bg-stone-800'
                }`}
            >
                {tier.cta}
            </a>
        </article>
    );
}
