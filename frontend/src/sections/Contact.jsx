import { useState } from 'react';
import { Mail, Send } from 'lucide-react';
import SectionHeading from '../components/site/SectionHeading';
import { quoteBenefits } from '../data/site';
import { createQuoteRequest } from '../api/client';

const CONTACT_EMAIL = 'selfpublish57@gmail.com';

export default function Contact() {
    const [status, setStatus] = useState({ type: 'idle', message: '' });

    async function handleSubmit(event) {
        event.preventDefault();

        const form = event.currentTarget;
        setStatus({ type: 'loading', message: '' });
        const formData = new FormData(form);
        const payload = {
            name: formData.get('name') || '',
            email: formData.get('email') || '',
            genre: formData.get('genre') || '',
            timeline: formData.get('timeline') || '',
            service: formData.get('service') || '',
            message: formData.get('message') || ''
        };

        try {
            const result = await createQuoteRequest(payload);
            const wasEmailed = result.email === 'sent';
            setStatus({
                type: wasEmailed ? 'success' : 'warning',
                message: wasEmailed
                    ? `Your quote request was sent to ${result.recipient}.`
                    : `Your quote request was saved, but email sending is not configured yet.`
            });
            form.reset();
        } catch (error) {
            setStatus({
                type: 'error',
                message: error.message || 'Could not send your quote request. Please try again.'
            });
        }
    }

    return (
        <section id="contact" className="scroll-mt-16 bg-stone-950 px-4 py-20 text-white sm:px-6 lg:px-8">
            <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
                <div>
                    <SectionHeading
                        eyebrow="Contact"
                        title="Request a custom publishing quote"
                        description="Tell us about your manuscript, desired formats, and timeline. We will respond with a clear scope and next step."
                        inverse
                    />
                    <div className="mt-8 space-y-4">
                        {quoteBenefits.map(benefit => {
                            const Icon = benefit.icon;
                            return (
                                <div key={benefit.text} className="flex items-center gap-3 text-stone-300">
                                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 text-amber-200">
                                        <Icon size={17} />
                                    </span>
                                    <span className="text-sm">{benefit.text}</span>
                                </div>
                            );
                        })}
                    </div>
                    <a href={`mailto:${CONTACT_EMAIL}`} className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-amber-200 hover:text-amber-100">
                        <Mail size={18} />
                        {CONTACT_EMAIL}
                    </a>
                </div>

                <form onSubmit={handleSubmit} className="rounded-lg border border-white/10 bg-white p-5 text-stone-950 shadow-2xl shadow-black/30 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Name" name="name" autoComplete="name" placeholder="Your name" required />
                        <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required />
                    </div>
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                        <Field label="Book Genre" name="genre" autoComplete="off" placeholder="Memoir, fantasy, business..." />
                        <Field label="Timeline" name="timeline" autoComplete="off" placeholder="Launch month or deadline" />
                    </div>
                    <div className="mt-4">
                        <label htmlFor="service" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Service Needed</label>
                        <select id="service" name="service" autoComplete="off" className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none transition focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10">
                            <option>Editing</option>
                            <option>Formatting</option>
                            <option>Cover Design</option>
                            <option>Full Publishing Package</option>
                        </select>
                    </div>
                    <div className="mt-4">
                        <label htmlFor="message" className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-stone-500">Project Details</label>
                        <textarea
                            id="message"
                            name="message"
                            rows="5"
                            placeholder="Share word count, publishing goals, formats, and where you are in the process."
                            autoComplete="off"
                            className="w-full resize-none rounded-lg border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
                            required
                        />
                    </div>
                    {status.type === 'success' && (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
                            {status.message}
                        </div>
                    )}
                    {status.type === 'warning' && (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
                            {status.message}
                        </div>
                    )}
                    {status.type === 'error' && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-800">
                            {status.message}
                        </div>
                    )}
                    <button
                        type="submit"
                        disabled={status.type === 'loading'}
                        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-stone-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-500"
                    >
                        {status.type === 'loading' ? 'Sending...' : 'Send Quote Request'}
                        <Send size={18} />
                    </button>
                </form>
            </div>
        </section>
    );
}

function Field({ label, name, type = 'text', autoComplete, placeholder, required = false }) {
    return (
        <div>
            <label htmlFor={name} className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-stone-500">{label}</label>
            <input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
                autoComplete={autoComplete}
                required={required}
                className="w-full rounded-lg border border-stone-200 bg-white px-3.5 py-3 text-sm outline-none transition placeholder:text-stone-400 focus:border-emerald-700 focus:ring-4 focus:ring-emerald-700/10"
            />
        </div>
    );
}
