import { BookOpen, Github, GraduationCap, Newspaper, Users } from 'lucide-react';

import { InfoCard } from '@/components/home/info-card';
import { useReveal } from '@/hooks/use-reveal';

const communityItems = [
    { icon: Github, title: 'GitHub', description: 'Browse the source, open issues, and send pull requests.', href: '#' },
    { icon: BookOpen, title: 'Documentation', description: 'Guides and API references for every part of the framework.', href: '#' },
    { icon: Users, title: 'Community', description: 'Join thousands of developers building with the framework.', href: '#' },
    { icon: GraduationCap, title: 'Tutorials', description: 'Learn by building real features, step by step.', href: '#' },
    { icon: Newspaper, title: 'Blog', description: 'Release notes, deep dives, and best practices.', href: '#' },
];

export function CommunitySection() {
    const { ref, isVisible } = useReveal<HTMLDivElement>();

    return (
        <section id="community" className="bg-zinc-950 py-24">
            <div
                ref={ref}
                className={`mx-auto max-w-7xl px-4 transition-all duration-700 sm:px-6 lg:px-8 motion-reduce:transform-none motion-reduce:opacity-100 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
            >
                <h2 className="text-center text-3xl font-semibold text-balance text-zinc-50 sm:text-4xl">
                    Built in the open, by developers like you.
                </h2>
                <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    {communityItems.map((item) => (
                        <InfoCard key={item.title} {...item} />
                    ))}
                </div>
            </div>
        </section>
    );
}
