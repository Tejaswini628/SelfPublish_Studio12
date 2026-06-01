import { useState } from 'react';
import Header from './components/site/Header';
import Home from './sections/Home';
import Services from './sections/Services';
import Portfolio from './sections/Portfolio';
import Contact from './sections/Contact';
import Footer from './components/site/Footer';
import PublishBookModal from './components/site/PublishBookModal';

export default function App() {
    const [publishOpen, setPublishOpen] = useState(false);
    const [portfolioRefreshKey, setPortfolioRefreshKey] = useState(0);

    return (
        <div className="min-h-screen bg-[#f7f4ee] text-stone-950">
            <Header onPublish={() => setPublishOpen(true)} />
            <main>
                <Home onPublish={() => setPublishOpen(true)} />
                <Services />
                <Portfolio refreshKey={portfolioRefreshKey} />
                <Contact />
            </main>
            <Footer />
            <PublishBookModal
                open={publishOpen}
                onClose={() => setPublishOpen(false)}
                onPublished={() => setPortfolioRefreshKey(key => key + 1)}
            />
        </div>
    );
}
