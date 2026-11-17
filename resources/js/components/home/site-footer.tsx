import { Github } from 'lucide-react';

const footerLinks = [
    { label: 'Documentation', href: '#dev-experience' },
    { label: 'Features', href: '#features' },
    { label: 'Ecosystem', href: '#ecosystem' },
    { label: 'Community', href: '#community' },
];

const linkClassName =
    'text-sm text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-sm';

export function SiteFooter() {
    return (
        <footer className="border-t border-zinc-800 bg-zinc-950">
            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
                    <div className="max-w-sm">
                        <a href="#" className="text-lg font-bold tracking-tight text-zinc-50">
                            Forge<span className="text-pink-500">.</span>
                        </a>
                        <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                            A modern PHP framework for building elegant, scalable
                            web applications.
                        </p>
                    </div>

                    <nav className="flex flex-wrap gap-x-8 gap-y-3">
                        {footerLinks.map((item) => (
                            <a key={item.label} href={item.href} className={linkClassName}>
                                {item.label}
                            </a>
                        ))}
                        <a
                            href="#"
                            className={`inline-flex items-center gap-1.5 ${linkClassName}`}
                        >
                            <Github className="size-4" aria-hidden="true" />
                            GitHub
                        </a>
                    </nav>
                </div>

                <div className="mt-10 border-t border-zinc-800 pt-6 text-sm text-zinc-500">
                    © {new Date().getFullYear()} Forge. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
