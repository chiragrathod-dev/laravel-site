import { Head, usePage } from '@inertiajs/react';

import { CodeExampleSection } from '@/components/home/code-example-section';
import { CommunitySection } from '@/components/home/community-section';
import { DevExperienceSection } from '@/components/home/dev-experience-section';
import { EcosystemSection } from '@/components/home/ecosystem-section';
import { FeaturesSection } from '@/components/home/features-section';
import { FinalCtaSection } from '@/components/home/final-cta-section';
import { HeroSection } from '@/components/home/hero-section';
import { SiteFooter } from '@/components/home/site-footer';
import { SiteNavbar } from '@/components/home/site-navbar';
import { TrustSection } from '@/components/home/trust-section';

const pageDescription =
    'A modern PHP framework designed to help developers build elegant, scalable, and maintainable applications.';

export default function Welcome() {
    const { auth } = usePage().props;
    const isAuthenticated = Boolean(auth.user);

    return (
        <>
            <Head title="Build Modern PHP Applications">
                <meta name="description" content={pageDescription} />
                <meta property="og:title" content="Build Modern PHP Applications" />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:type" content="website" />
            </Head>
            <div className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
                <SiteNavbar isAuthenticated={isAuthenticated} />
                <HeroSection isAuthenticated={isAuthenticated} />
                <TrustSection />
                <FeaturesSection />
                <DevExperienceSection />
                <EcosystemSection />
                <CodeExampleSection />
                <CommunitySection />
                <FinalCtaSection isAuthenticated={isAuthenticated} />
                <SiteFooter />
            </div>
        </>
    );
}
