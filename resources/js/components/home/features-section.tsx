import {
    Bell,
    Clock,
    Database,
    FlaskConical,
    ListTodo,
    Radio,
    Route,
    ShieldCheck,
    Webhook,
    Zap,
} from 'lucide-react';

import { InfoCard } from '@/components/home/info-card';
import { useReveal } from '@/hooks/use-reveal';

const features = [
    {
        icon: Route,
        title: 'Routing',
        description:
            'Expressive, declarative routes that map cleanly to your application.',
    },
    {
        icon: Database,
        title: 'Database & ORM',
        description:
            'A fluent query builder and expressive model relationships.',
    },
    {
        icon: ShieldCheck,
        title: 'Authentication',
        description: 'Session and token-based auth with sensible defaults.',
    },
    {
        icon: ListTodo,
        title: 'Queues & Jobs',
        description:
            'Offload slow work to background workers with retries built in.',
    },
    {
        icon: Webhook,
        title: 'APIs',
        description: 'Build versioned, resourceful APIs without boilerplate.',
    },
    {
        icon: FlaskConical,
        title: 'Testing',
        description:
            'A fast, expressive testing toolkit baked into the framework.',
    },
    {
        icon: Zap,
        title: 'Caching',
        description:
            'Swap cache drivers without touching your application code.',
    },
    {
        icon: Radio,
        title: 'Events',
        description:
            'Decouple side effects with a lightweight event/listener system.',
    },
    {
        icon: Bell,
        title: 'Notifications',
        description: 'Send notifications across mail, SMS, and other channels.',
    },
    {
        icon: Clock,
        title: 'Task Scheduling',
        description:
            'Define your recurring tasks directly in code, no crontab.',
    },
];

export function FeaturesSection() {
    const { ref, isVisible } = useReveal<HTMLDivElement>();

    return (
        <section id="features" className="bg-zinc-950 py-24">
            <div
                ref={ref}
                className={`mx-auto max-w-7xl px-4 transition-all duration-700 motion-reduce:transform-none motion-reduce:opacity-100 sm:px-6 lg:px-8 ${
                    isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                }`}
            >
                <h2 className="text-center text-3xl font-semibold text-balance text-zinc-50 sm:text-4xl">
                    Everything you need. Nothing you don&apos;t.
                </h2>
                <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((item) => (
                        <InfoCard key={item.title} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
