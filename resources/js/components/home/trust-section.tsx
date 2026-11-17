import { Layers, ShieldCheck, Sparkles, Webhook } from 'lucide-react';

import { InfoCard } from '@/components/home/info-card';
import { useReveal } from '@/hooks/use-reveal';

const trustItems = [
    {
        icon: Sparkles,
        title: 'Elegant syntax',
        description: 'Expressive, readable code that stays enjoyable to write.',
    },
    {
        icon: Webhook,
        title: 'Powerful APIs',
        description: 'First-class tools for building and consuming APIs.',
    },
    {
        icon: ShieldCheck,
        title: 'Built-in authentication',
        description: 'Secure auth flows ready out of the box.',
    },
    {
        icon: Layers,
        title: 'Scalable architecture',
        description: 'Grows cleanly from a prototype to production.',
    },
];

export function TrustSection() {
    const { ref, isVisible } = useReveal<HTMLDivElement>();

    return (
        <section className="bg-zinc-950 py-20">
            <div
                ref={ref}
                className={`mx-auto max-w-7xl px-4 transition-all duration-700 motion-reduce:transform-none motion-reduce:opacity-100 sm:px-6 lg:px-8 ${
                    isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                }`}
            >
                <h2 className="text-center text-2xl font-semibold text-balance text-zinc-50 sm:text-3xl">
                    Everything you need to build modern PHP applications.
                </h2>
                <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {trustItems.map((item) => (
                        <InfoCard key={item.title} compact {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
