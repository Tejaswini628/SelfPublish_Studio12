export default function SectionHeading({ eyebrow, title, description, align = 'left', inverse = false }) {
    const alignment = align === 'center' ? 'mx-auto text-center' : '';
    const titleColor = inverse ? 'text-white' : 'text-stone-950';
    const descriptionColor = inverse ? 'text-stone-300' : 'text-stone-600';

    return (
        <div className={`max-w-3xl ${alignment}`}>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-emerald-600">{eyebrow}</p>
            <h2 className={`mt-3 text-3xl font-semibold tracking-tight sm:text-4xl ${titleColor}`}>{title}</h2>
            {description && <p className={`mt-4 text-base leading-7 ${descriptionColor}`}>{description}</p>}
        </div>
    );
}
