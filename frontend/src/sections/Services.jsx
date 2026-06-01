import SectionHeading from '../components/site/SectionHeading';
import ServiceCard from '../components/site/ServiceCard';
import { services } from '../data/site';

export default function Services() {
    return (
        <section id="services" className="scroll-mt-16 bg-white px-4 py-20 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <SectionHeading
                    eyebrow="Services"
                    title="Everything your manuscript needs before release"
                    description="Bring us a rough draft, revised manuscript, or nearly finished book. We shape the editorial and production path around your goals."
                    align="center"
                />
                <div className="mt-12 grid gap-5 md:grid-cols-3">
                    {services.map(service => <ServiceCard key={service.title} service={service} />)}
                </div>
            </div>
        </section>
    );
}
