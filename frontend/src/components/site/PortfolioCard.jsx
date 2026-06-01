export default function PortfolioCard({ book, onOpen }) {
    const isInteractive = typeof onOpen === 'function';
    const Element = isInteractive ? 'button' : 'article';

    return (
        <Element
            type={isInteractive ? 'button' : undefined}
            onClick={onOpen}
            className={`group relative aspect-[4/5] overflow-hidden rounded-lg bg-stone-900 text-left shadow-sm ${
                isInteractive ? 'cursor-pointer focus:outline-none focus:ring-4 focus:ring-emerald-700/25' : ''
            }`}
        >
            <img src={book.image} alt={`${book.title} book visual`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/20 to-transparent opacity-80" />
            <div className="absolute inset-x-0 bottom-0 translate-y-2 p-5 text-white opacity-90 transition group-hover:translate-y-0 group-hover:opacity-100">
                <p className="text-lg font-semibold">{book.title}</p>
                <p className="mt-1 text-sm text-stone-300">{book.author}</p>
                {isInteractive && <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-amber-200">Open files</p>}
            </div>
        </Element>
    );
}
