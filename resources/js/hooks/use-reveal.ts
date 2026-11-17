import { useEffect, useRef, useState } from 'react';

export function useReveal<T extends HTMLElement = HTMLDivElement>(): {
    ref: React.RefObject<T | null>;
    isVisible: boolean;
} {
    const prefersReducedMotion =
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const ref = useRef<T>(null);
    const [isVisible, setIsVisible] = useState(prefersReducedMotion);

    useEffect(() => {
        if (prefersReducedMotion) {
            return;
        }

        const element = ref.current;

        if (!element) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15 },
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, [prefersReducedMotion]);

    return { ref, isVisible };
}
