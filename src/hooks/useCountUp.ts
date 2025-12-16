import { useState, useEffect, useRef, useCallback } from 'react';

interface UseCountUpOptions {
    start?: number;
    end: number;
    duration?: number;
    delay?: number;
    decimals?: number;
    suffix?: string;
    prefix?: string;
    enableScrollSpy?: boolean;
    scrollSpyOnce?: boolean;
}

interface UseCountUpReturn {
    count: number;
    displayValue: string;
    ref: React.RefObject<HTMLDivElement>;
    isAnimating: boolean;
    reset: () => void;
}

/**
 * Custom hook for count-up animation effect with scroll spy support
 * Professionally animates numbers when they come into view
 */
export function useCountUp({
    start = 0,
    end,
    duration = 2000,
    delay = 0,
    decimals = 0,
    suffix = '',
    prefix = '',
    enableScrollSpy = true,
    scrollSpyOnce = true,
}: UseCountUpOptions): UseCountUpReturn {
    const [count, setCount] = useState(start);
    const [isAnimating, setIsAnimating] = useState(false);
    const [hasAnimated, setHasAnimated] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    const animationRef = useRef<number | null>(null);

    const animate = useCallback(() => {
        if (hasAnimated && scrollSpyOnce) return;

        setIsAnimating(true);
        setHasAnimated(true);

        const startTime = performance.now();
        const startValue = start;
        const endValue = end;

        const easeOutQuart = (t: number): number => {
            return 1 - Math.pow(1 - t, 4);
        };

        const updateCount = (currentTime: number) => {
            const elapsed = currentTime - startTime - delay;

            if (elapsed < 0) {
                animationRef.current = requestAnimationFrame(updateCount);
                return;
            }

            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeOutQuart(progress);
            const currentValue = startValue + (endValue - startValue) * easedProgress;

            setCount(currentValue);

            if (progress < 1) {
                animationRef.current = requestAnimationFrame(updateCount);
            } else {
                setCount(endValue);
                setIsAnimating(false);
            }
        };

        animationRef.current = requestAnimationFrame(updateCount);
    }, [start, end, duration, delay, hasAnimated, scrollSpyOnce]);

    const reset = useCallback(() => {
        if (animationRef.current) {
            cancelAnimationFrame(animationRef.current);
        }
        setCount(start);
        setIsAnimating(false);
        setHasAnimated(false);
    }, [start]);

    useEffect(() => {
        if (!enableScrollSpy) {
            animate();
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        animate();
                    }
                });
            },
            {
                threshold: 0.3,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        const currentRef = ref.current;
        if (currentRef) {
            observer.observe(currentRef);
        }

        return () => {
            if (currentRef) {
                observer.unobserve(currentRef);
            }
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [enableScrollSpy, animate]);

    const displayValue = `${prefix}${count.toFixed(decimals)}${suffix}`;

    return { count, displayValue, ref, isAnimating, reset };
}

export default useCountUp;
