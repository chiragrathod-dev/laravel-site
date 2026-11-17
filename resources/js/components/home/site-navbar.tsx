import { Link } from '@inertiajs/react';
import { Menu } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { dashboard, login, register } from '@/routes';

const navLinks = [
    { label: 'Documentation', href: '#dev-experience' },
    { label: 'Features', href: '#features' },
    { label: 'Ecosystem', href: '#ecosystem' },
    { label: 'Community', href: '#community' },
    { label: 'Pricing', href: '#' },
    { label: 'GitHub', href: '#' },
];

const navLinkClassName =
    'text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-50 focus-visible:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-500 rounded-sm';

interface SiteNavbarProps {
    isAuthenticated: boolean;
}

export function SiteNavbar({ isAuthenticated }: SiteNavbarProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <a href="#" className="text-lg font-bold tracking-tight text-zinc-50">
                    Forge<span className="text-pink-500">.</span>
                </a>

                <nav className="hidden items-center gap-8 lg:flex">
                    {navLinks.map((item) => (
                        <a key={item.label} href={item.href} className={navLinkClassName}>
                            {item.label}
                        </a>
                    ))}
                </nav>

                <div className="hidden items-center gap-3 lg:flex">
                    {isAuthenticated ? (
                        <Button asChild>
                            <Link href={dashboard()}>Dashboard</Link>
                        </Button>
                    ) : (
                        <>
                            <Link href={login()} className={navLinkClassName}>
                                Log in
                            </Link>
                            <Button asChild>
                                <Link href={register()}>Get Started</Link>
                            </Button>
                        </>
                    )}
                </div>

                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" aria-label="Open navigation menu">
                                <Menu className="size-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent
                            side="right"
                            className="flex w-72 flex-col gap-1 border-zinc-800 bg-zinc-950 text-zinc-50"
                        >
                            <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                            <nav className="mt-10 flex flex-col gap-1">
                                {navLinks.map((item) => (
                                    <SheetClose asChild key={item.label}>
                                        <a
                                            href={item.href}
                                            className="rounded-md px-3 py-2.5 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-900 hover:text-zinc-50"
                                        >
                                            {item.label}
                                        </a>
                                    </SheetClose>
                                ))}
                            </nav>
                            <div className="mt-4 flex flex-col gap-2 px-3">
                                {isAuthenticated ? (
                                    <SheetClose asChild>
                                        <Button asChild>
                                            <Link href={dashboard()}>Dashboard</Link>
                                        </Button>
                                    </SheetClose>
                                ) : (
                                    <>
                                        <SheetClose asChild>
                                            <Link
                                                href={login()}
                                                className="rounded-md px-3 py-2.5 text-center text-sm font-medium text-zinc-300 hover:bg-zinc-900 hover:text-zinc-50"
                                            >
                                                Log in
                                            </Link>
                                        </SheetClose>
                                        <SheetClose asChild>
                                            <Button asChild>
                                                <Link href={register()}>Get Started</Link>
                                            </Button>
                                        </SheetClose>
                                    </>
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
        </header>
    );
}
