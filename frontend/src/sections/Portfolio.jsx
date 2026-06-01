import { useEffect, useState } from 'react';
import { Download, ExternalLink, X } from 'lucide-react';
import SectionHeading from '../components/site/SectionHeading';
import PortfolioCard from '../components/site/PortfolioCard';
import { portfolioBooks } from '../data/site';
import { getBooks } from '../api/client';

function mapPublishedBook(book, index) {
    return {
        id: book.id,
        title: book.title,
        author: book.author,
        image: portfolioBooks[index % portfolioBooks.length].image,
        status: book.status,
        currentVersion: book.current_version,
        updatedAt: book.updated_at,
        manuscriptUrl: book.manuscript_url,
        manuscriptPath: book.manuscript_path,
        builds: book.builds || []
    };
}

export default function Portfolio({ refreshKey = 0 }) {
    const [publishedBooks, setPublishedBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);

    useEffect(() => {
        let cancelled = false;

        async function loadPublishedBooks() {
            try {
                const books = await getBooks();
                if (cancelled) return;

                setPublishedBooks(
                    (books || [])
                        .filter(book => book.status === 'completed')
                        .map(mapPublishedBook)
                );
            } catch {
                if (!cancelled) {
                    setPublishedBooks([]);
                }
            }
        }

        loadPublishedBooks();

        return () => {
            cancelled = true;
        };
    }, [refreshKey]);

    const books = publishedBooks.length > 0 ? publishedBooks : portfolioBooks;

    return (
        <section id="portfolio" className="scroll-mt-16 bg-[#efe8dc] px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <SectionHeading
                    eyebrow="Portfolio"
                    title="Recently published books"
                    description="A sample shelf of author projects across fiction, essays, memoir, and practical nonfiction."
                />
                <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {books.map(book => (
                        <PortfolioCard
                            key={`${book.title}-${book.author}`}
                            book={book}
                            onOpen={book.id ? () => setSelectedBook(book) : undefined}
                        />
                    ))}
                </div>
            </div>

            {selectedBook && (
                <BookAccessModal book={selectedBook} onClose={() => setSelectedBook(null)} />
            )}
        </section>
    );
}

function BookAccessModal({ book, onClose }) {
    const builds = ['pdf', 'epub', 'xhtml', 'tex', 'lint', 'diff']
        .map(format => book.builds.find(build => build.format === format))
        .filter(Boolean);

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-stone-950/70 px-4 py-8 backdrop-blur-sm">
            <div className="max-h-[92vh] w-full max-w-xl overflow-auto rounded-lg bg-white shadow-2xl">
                <div className="flex items-start justify-between gap-4 border-b border-stone-200 p-5">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">Published Book</p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-tight">{book.title}</h2>
                        <p className="mt-1 text-sm text-stone-600">Version {book.currentVersion} by {book.author}</p>
                    </div>
                    <button type="button" onClick={onClose} className="rounded-lg border border-stone-200 p-2 text-stone-500 hover:bg-stone-50" aria-label="Close book files">
                        <X size={18} />
                    </button>
                </div>

                <div className="p-5">
                    {builds.length > 0 ? (
                        <div className="grid gap-3 sm:grid-cols-2">
                            {builds.map(build => (
                                <a
                                    key={build.format}
                                    href={build.file_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-bold uppercase tracking-[0.08em] text-stone-800 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
                                >
                                    <span className="inline-flex items-center gap-2">
                                        <Download size={16} />
                                        {build.format}
                                    </span>
                                    <ExternalLink size={15} />
                                </a>
                            ))}
                        </div>
                    ) : (
                        <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                            This book is published, but its downloadable files are not available yet.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
