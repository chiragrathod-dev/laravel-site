import { CodeWindow } from '@/components/home/code-window';
import { useReveal } from '@/hooks/use-reveal';

export function DevExperienceSection() {
    const { ref, isVisible } = useReveal<HTMLDivElement>();

    return (
        <section id="dev-experience" className="bg-zinc-950 py-24">
            <div
                ref={ref}
                className={`mx-auto grid max-w-7xl gap-12 px-4 transition-all duration-700 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8 motion-reduce:transform-none motion-reduce:opacity-100 ${
                    isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                }`}
            >
                <div>
                    <h2 className="text-3xl font-semibold text-balance text-zinc-50 sm:text-4xl">
                        Designed for developers.
                    </h2>
                    <p className="mt-6 max-w-lg text-lg leading-relaxed text-zinc-400">
                        Expressive syntax and productive tooling mean less time
                        wiring things together and more time shipping features
                        that matter. Every API is designed to read like the
                        problem you&apos;re solving, not the framework underneath
                        it.
                    </p>
                </div>

                <CodeWindow filename="app/Models/Order.php">
                    <code>
                        <span className="text-pink-400">class</span>{' '}
                        <span className="text-sky-300">Order</span>{' '}
                        <span className="text-pink-400">extends</span>{' '}
                        <span className="text-sky-300">Model</span>
                        <span className="text-zinc-500">{' {'}</span>
                        {'\n    '}
                        <span className="text-pink-400">protected</span>{' '}
                        <span className="text-pink-400">function</span>{' '}
                        <span className="text-sky-300">customer</span>
                        <span className="text-zinc-500">()</span>
                        {'\n    '}
                        <span className="text-zinc-500">{'{'}</span>
                        {'\n        '}
                        <span className="text-pink-400">return</span>{' '}
                        <span className="text-zinc-500">$</span>
                        <span className="text-zinc-300">this</span>
                        <span className="text-zinc-500">-&gt;</span>
                        <span className="text-pink-400">belongsTo</span>
                        <span className="text-zinc-500">(</span>
                        <span className="text-sky-300">Customer</span>
                        <span className="text-zinc-500">::</span>
                        <span className="text-pink-400">class</span>
                        <span className="text-zinc-500">);</span>
                        {'\n    '}
                        <span className="text-zinc-500">{'}'}</span>
                        {'\n'}
                        <span className="text-zinc-500">{'}'}</span>
                    </code>
                </CodeWindow>
            </div>
        </section>
    );
}
