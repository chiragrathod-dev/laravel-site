import { CodeWindow } from '@/components/home/code-window';
import { useReveal } from '@/hooks/use-reveal';

export function CodeExampleSection() {
    const { ref, isVisible } = useReveal<HTMLDivElement>();

    return (
        <section className="bg-zinc-950 py-24">
            <div
                ref={ref}
                className={`mx-auto max-w-4xl px-4 transition-all duration-700 motion-reduce:transform-none motion-reduce:opacity-100 sm:px-6 lg:px-8 ${
                    isVisible
                        ? 'translate-y-0 opacity-100'
                        : 'translate-y-4 opacity-0'
                }`}
            >
                <h2 className="text-center text-3xl font-semibold text-balance text-zinc-50 sm:text-4xl">
                    Simple code. Powerful applications.
                </h2>

                <div className="mt-12">
                    <CodeWindow filename="routes/api.php">
                        <code>
                            <span className="text-sky-300">Route</span>
                            <span className="text-zinc-500">::</span>
                            <span className="text-pink-400">post</span>
                            <span className="text-zinc-500">(</span>
                            <span className="text-emerald-300">
                                &apos;/orders&apos;
                            </span>
                            <span className="text-zinc-500">, </span>
                            <span className="text-pink-400">function</span>
                            <span className="text-zinc-500"> (</span>
                            <span className="text-sky-300">Request</span>{' '}
                            <span className="text-zinc-300">$request</span>
                            <span className="text-zinc-500">) {'{'}</span>
                            {'\n    '}
                            <span className="text-zinc-500">$</span>
                            <span className="text-zinc-300">order</span>
                            <span className="text-zinc-500"> = </span>
                            <span className="text-sky-300">Order</span>
                            <span className="text-zinc-500">::</span>
                            <span className="text-pink-400">create</span>
                            <span className="text-zinc-500">(</span>
                            {'\n        '}
                            <span className="text-zinc-500">$</span>
                            <span className="text-zinc-300">request</span>
                            <span className="text-zinc-500">-&gt;</span>
                            <span className="text-pink-400">validate</span>
                            <span className="text-zinc-500">([</span>
                            {'\n            '}
                            <span className="text-emerald-300">
                                &apos;product_id&apos;
                            </span>
                            <span className="text-zinc-500"> =&gt; [</span>
                            <span className="text-emerald-300">
                                &apos;required&apos;
                            </span>
                            <span className="text-zinc-500">],</span>
                            {'\n            '}
                            <span className="text-emerald-300">
                                &apos;quantity&apos;
                            </span>
                            <span className="text-zinc-500"> =&gt; [</span>
                            <span className="text-emerald-300">
                                &apos;required&apos;
                            </span>
                            <span className="text-zinc-500">, </span>
                            <span className="text-emerald-300">
                                &apos;integer&apos;
                            </span>
                            <span className="text-zinc-500">],</span>
                            {'\n        '}
                            <span className="text-zinc-500">])</span>
                            {'\n    '}
                            <span className="text-zinc-500">);</span>
                            {'\n\n    '}
                            <span className="text-pink-400">return</span>{' '}
                            <span className="text-pink-400">response</span>
                            <span className="text-zinc-500">()-&gt;</span>
                            <span className="text-pink-400">json</span>
                            <span className="text-zinc-500">(</span>
                            <span className="text-zinc-300">$order</span>
                            <span className="text-zinc-500">);</span>
                            {'\n'}
                            <span className="text-zinc-500">{'});'}</span>
                        </code>
                    </CodeWindow>
                </div>
            </div>
        </section>
    );
}
