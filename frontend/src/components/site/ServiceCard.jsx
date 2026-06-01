export default function ServiceCard({ service }) {
    const Icon = service.icon;

    return (
        <article className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-emerald-700/30 hover:shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-700 text-white">
                <Icon size={22} />
            </div>
            <h3 className="mt-5 text-xl font-semibold text-stone-950">{service.title}</h3>
            <p className="mt-3 text-sm leading-7 text-stone-600">{service.description}</p>
        </article>
    );
}
