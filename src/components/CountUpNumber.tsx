import React, { useEffect, useState, useRef } from 'react';

interface CountUpNumberProps {
    end: number;
    suffix?: string;
    prefix?: string;
    duration?: number;
    decimals?: number;
    className?: string;
    delay?: number;
}

/**
 * Professional count-up animation component
 * Triggers animation only when element scrolls into view
 */
const CountUpNumber: React.FC<CountUpNumberProps> = ({
    end,
    suffix = '',
    prefix = '',
    duration = 2000,
    decimals = 0,
    className = '',
    delay = 0,
}) => {
    const [count, setCount] = useState(0);
    const hasAnimatedRef = useRef(false);
    const ref = useRef<HTMLSpanElement>(null);
    const animationRef = useRef<number | null>(null);

    useEffect(() => {
        const currentRef = ref.current;
        if (!currentRef) return;

        const startAnimation = () => {
            if (hasAnimatedRef.current) return;
            hasAnimatedRef.current = true;

            const startTime = performance.now();

            // Easing function: easeOutExpo for a professional feel
            const easeOutExpo = (t: number): number => {
                return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            };

            const animate = (currentTime: number) => {
                const elapsed = currentTime - startTime - delay;

                if (elapsed < 0) {
                    animationRef.current = requestAnimationFrame(animate);
                    return;
                }

                const progress = Math.min(elapsed / duration, 1);
                const easedProgress = easeOutExpo(progress);
                const currentValue = easedProgress * end;

                setCount(currentValue);

                if (progress < 1) {
                    animationRef.current = requestAnimationFrame(animate);
                } else {
                    setCount(end);
                }
            };

            animationRef.current = requestAnimationFrame(animate);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        startAnimation();
                        observer.disconnect();
                    }
                });
            },
            {
                threshold: 0.2,
                rootMargin: '0px 0px -50px 0px',
            }
        );

        observer.observe(currentRef);

        return () => {
            observer.disconnect();
            if (animationRef.current) {
                cancelAnimationFrame(animationRef.current);
            }
        };
    }, [end, duration, delay]);

    const formatNumber = (num: number): string => {
        if (decimals > 0) {
            return num.toFixed(decimals);
        }
        return Math.floor(num).toString();
    };

    return (
        <span
            ref={ref}
            className={`count-up-number ${className}`}
            style={{
                fontVariantNumeric: 'tabular-nums',
            }}
        >
            {prefix}{formatNumber(count)}{suffix}
        </span>
    );
};

export default CountUpNumber;
