import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface CodeWindowProps {
    filename?: string;
    className?: string;
    children: ReactNode;
}

export function CodeWindow({ filename, className, children }: CodeWindowProps) {
    return (
        <div
            className={cn(
                'overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/40 backdrop-blur',
                className,
            )}
        >
            <div className="flex items-center gap-2 border-b border-zinc-800 px-4 py-3">
                <span className="size-2.5 rounded-full bg-red-500/80" />
                <span className="size-2.5 rounded-full bg-amber-400/80" />
                <span className="size-2.5 rounded-full bg-emerald-500/80" />
                {filename && (
                    <span className="ml-3 font-mono text-xs text-zinc-500">
                        {filename}
                    </span>
                )}
            </div>
            <pre className="overflow-x-auto px-5 py-4 font-mono text-sm leading-relaxed text-zinc-300">
                {children}
            </pre>
        </div>
    );
}
