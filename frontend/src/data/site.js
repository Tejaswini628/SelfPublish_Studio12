import { BookOpen, Check, Feather, FileText, Layers, Palette, PenTool, Send, Sparkles } from 'lucide-react';

export const navItems = [
    { label: 'Home', href: '#home' },
    { label: 'Services', href: '#services' },
    { label: 'Portfolio', href: '#portfolio' },
    { label: 'Contact', href: '#contact' }
];

export const pricingTiers = [
    {
        name: 'Free',
        price: '$0',
        description: 'A simple launch point for first drafts and early manuscript checks.',
        features: ['Project intake checklist', 'Basic file readiness review', 'Publishing roadmap template'],
        cta: 'Start Free'
    },
    {
        name: 'Pro',
        price: '$149',
        description: 'For authors who need a polished, store-ready digital release.',
        features: ['Copy edit pass', 'EPUB and print formatting', 'Metadata and launch guidance'],
        cta: 'Choose Pro',
        featured: true
    },
    {
        name: 'Premium',
        price: '$399',
        description: 'A full-service package for authors who want hands-on publishing support.',
        features: ['Developmental edit notes', 'Custom cover direction', 'Priority production schedule'],
        cta: 'Go Premium'
    }
];

export const services = [
    {
        title: 'Editing',
        description: 'Line edits, copy edits, and manuscript notes that preserve your voice while sharpening every page.',
        icon: PenTool
    },
    {
        title: 'Formatting',
        description: 'Professional EPUB, PDF, and print-ready typesetting with clean hierarchy and reader-friendly flow.',
        icon: Layers
    },
    {
        title: 'Cover Design',
        description: 'Compelling visual direction and cover systems built for online stores, print shelves, and series growth.',
        icon: Palette
    }
];

export const portfolioBooks = [
    {
        title: 'The Quiet Atlas',
        author: 'Mira Ellison',
        image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=900&q=80'
    },
    {
        title: 'Northbound Letters',
        author: 'Caleb Voss',
        image: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=900&q=80'
    },
    {
        title: 'Ink & Orchard',
        author: 'Leena Marr',
        image: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=900&q=80'
    },
    {
        title: 'Field Notes for Firelight',
        author: 'Theo Mercer',
        image: 'https://images.unsplash.com/photo-1519682337058-a94d519337bc?auto=format&fit=crop&w=900&q=80'
    },
    {
        title: 'The Paper Harbor',
        author: 'Iris Nand',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=900&q=80'
    },
    {
        title: 'After the Index',
        author: 'Rowan Hale',
        image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=900&q=80'
    }
];

export const heroStats = [
    { label: 'Books prepared', value: '420+' },
    { label: 'Store formats', value: '6' },
    { label: 'Author rating', value: '4.9' }
];

export const trustPoints = [
    { label: 'Editorial clarity', icon: Feather },
    { label: 'Print-ready files', icon: FileText },
    { label: 'Launch support', icon: Sparkles },
    { label: 'Reader-first design', icon: BookOpen }
];

export const quoteBenefits = [
    { text: 'Custom scope for your manuscript', icon: Check },
    { text: 'Production timeline estimate', icon: Check },
    { text: 'Clear next steps within one business day', icon: Send }
];
