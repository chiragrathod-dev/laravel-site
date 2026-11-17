import { Link } from '@inertiajs/react';

import { Button } from '@/components/ui/button';
import { CodeWindow } from '@/components/home/code-window';
import { dashboard, register } from '@/routes';

interface HeroSectionProps {
    isAuthenticated: boolean;
}

export function HeroSection({ isAuthenticated }: HeroSectionProps) {
    return (
        <section className="relative overflow-hidden bg-zinc-950">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
            >
                <div className="absolute top-[-10%] left-[10%] h-[500px] w-[500px] rounded-full bg-red-600/20 blur-3xl" />
                <div className="absolute top-[0%] right-[5%] h-[400px] w-[400px] rounded-full bg-pink-500/10 blur-3xl" />
            </div>

            <div className="relative mx-auto grid max-w-7xl gap-12 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 lg:py-32">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight text-balance text-zinc-50 sm:text-5xl lg:text-6xl">
                        Build powerful web applications, faster.
                    </h1>
                    <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
                        A modern PHP framework designed to help developers build
                        elegant, scalable, and maintainable applications.
                    </p>
                    <div className="mt-10 flex flex-wrap items-center gap-4">
                        <Button size="lg" asChild>
                            <Link
                                href={
                                    isAuthenticated ? dashboard() : register()
                                }
                            >
                                Get Started
                            </Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <a href="#dev-experience">Explore Documentation</a>
                        </Button>
                    </div>
                </div>

                <CodeWindow filename="routes/web.php">
                    <code>
                        <span className="text-sky-300">Route</span>
                        <span className="text-zinc-500">::</span>
                        <span className="text-pink-400">get</span>
                        <span className="text-zinc-500">(</span>
                        <span className="text-emerald-300">
                            &apos;/users&apos;
                        </span>
                        <span className="text-zinc-500">, </span>
                        <span className="text-pink-400">function</span>
                        <span className="text-zinc-500"> () {'{'}</span>
                        {'\n    '}
                        <span className="text-pink-400">return</span>{' '}
                        <span className="text-sky-300">User</span>
                        <span className="text-zinc-500">::</span>
                        <span className="text-pink-400">latest</span>
                        <span className="text-zinc-500">()-&gt;</span>
                        <span className="text-pink-400">get</span>
                        <span className="text-zinc-500">();</span>
                        {'\n'}
                        <span className="text-zinc-500">{'});'}</span>
                    </code>
                </CodeWindow>
            </div>
        </section>
    );
}
