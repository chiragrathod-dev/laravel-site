import { Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { dashboard, register } from '@/routes';

interface FinalCtaSectionProps {
    isAuthenticated: boolean;
}

export function FinalCtaSection({ isAuthenticated }: FinalCtaSectionProps) {
    return (
        <section className="relative overflow-hidden bg-zinc-950 py-24">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(236,72,153,0.25),_transparent_60%)]"
            />
            <div className="relative mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
                <h2 className="text-3xl font-semibold text-balance text-zinc-50 sm:text-4xl">
                    Start building something great.
                </h2>
                <p className="mt-6 text-lg leading-relaxed text-zinc-400">
                    Build your next application with a framework designed around
                    developer productivity.
                </p>
                <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                    <Button size="lg" asChild>
                        <Link href={isAuthenticated ? dashboard() : register()}>
                            Get Started
                        </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild>
                        <a href="#dev-experience">Read the Documentation</a>
                    </Button>
                </div>
            </div>
        </section>
    );
}
