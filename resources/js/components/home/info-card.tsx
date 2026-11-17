import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface InfoCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    compact?: boolean;
    href?: string;
}

export function InfoCard({
    icon: Icon,
    title,
    description,
    compact,
    href,
}: InfoCardProps) {
    const content = compact ? (
        <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/60 px-4 py-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-red-500/20 to-pink-500/20 text-pink-400">
                <Icon className="size-4" aria-hidden="true" />
            </span>
            <span className="text-sm font-medium text-zinc-200">{title}</span>
        </div>
    ) : (
        <div
            className={cn(
                'group relative flex h-full flex-col gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 p-6 transition-colors',
                'motion-safe:transition-transform motion-safe:duration-300 motion-safe:hover:-translate-y-1',
                'hover:border-pink-500/50 hover:shadow-[0_0_30px_-10px_rgba(236,72,153,0.4)]',
            )}
        >
            <span className="flex size-10 items-center justify-center rounded-lg bg-gradient-to-br from-red-500/20 to-pink-500/20 text-pink-400">
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <h3 className="font-semibold text-zinc-100">{title}</h3>
            <p className="text-sm leading-relaxed text-zinc-400">
                {description}
            </p>
            {href && (
                <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-pink-400">
                    Learn more
                    <ArrowUpRight
                        className="size-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 motion-safe:transition-transform motion-safe:duration-200"
                        aria-hidden="true"
                    />
                </span>
            )}
        </div>
    );

    if (href) {
        return (
            <a
                href={href}
                className="block rounded-xl focus-visible:ring-2 focus-visible:ring-pink-500 focus-visible:outline-none"
            >
                {content}
            </a>
        );
    }

    return content;
}
