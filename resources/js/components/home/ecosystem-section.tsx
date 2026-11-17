import {
    Activity,
    Box,
    Database,
    FlaskConical,
    ListTodo,
    Rocket,
    ShieldCheck,
    Webhook,
} from 'lucide-react';

import { InfoCard } from '@/components/home/info-card';
import { useReveal } from '@/hooks/use-reveal';

const ecosystemItems = [
    {
        icon: Box,
        title: 'Framework',
        description: 'The expressive core your application is built on.',
    },
    {
        icon: Database,
        title: 'ORM',
        description:
            'Query and model your data with a fluent, readable syntax.',
    },
    {
        icon: ListTodo,
        title: 'Queue',
        description: 'Run background jobs reliably, at any scale.',
    },
    {
        icon: ShieldCheck,
        title: 'Authentication',
        description:
            'Drop-in auth scaffolding for first-party and API clients.',
    },
    {
        icon: Webhook,
        title: 'API',
        description: 'Ship versioned, resourceful endpoints in minutes.',
    },
    {
        icon: FlaskConical,
        title: 'Testing',
        description: 'Write fast, expressive tests from day one.',
    },
    {
        icon: Rocket,
        title: 'Deployment',
        description: 'Ship to production with zero-downtime releases.',
    },
    {
        icon: Activity,
        title: 'Monitoring',
        description: 'Track performance and errors across every request.',
    },
];

export function EcosystemSection() {
    const { ref, isVisible } = useReveal<HTMLDivElement>();

    return (
        <section id="ecosystem" className="bg-zinc-950 py-24">
            <div
                ref={ref}
                className={`mx-auto max-w-7xl px-4 transition-all duration-700 motion-reduce:transform-none motion-reduce:opacity-100 sm:px-6 lg:px-8 ${
                    isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                }`}
            >
                <h2 className="text-center text-3xl font-semibold text-balance text-zinc-50 sm:text-4xl">
                    One ecosystem, every piece included.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-zinc-400">
                    First-party tools that work together out of the box, so
                    you&apos;re never stitching together mismatched packages.
                </p>
                <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {ecosystemItems.map((item) => (
                        <InfoCard key={item.title} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
