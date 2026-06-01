export default function Footer() {
    return (
        <footer className="border-t border-stone-200 bg-stone-950 text-stone-400">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <p>Self Publish Studio. Built for independent authors.</p>
                <div className="flex gap-4">
                    <a href="#services" className="hover:text-amber-200">Services</a>
                    <a href="#portfolio" className="hover:text-amber-200">Portfolio</a>
                    <a href="#contact" className="hover:text-amber-200">Contact</a>
                </div>
            </div>
        </footer>
    );
}
