import React, { useEffect, useRef, useCallback } from 'react';
import { Confetti, type ConfettiRef } from '@/registry/magicui/confetti';
import { toast } from 'sonner';

interface PurchaseSuccessConfettiProps {
    isOpen: boolean;
    onComplete?: () => void;
    message: string;
    subMessage?: string;
    duration?: number;
}

const PurchaseSuccessConfetti: React.FC<PurchaseSuccessConfettiProps> = ({
    isOpen,
    onComplete,
    message,
    subMessage,
    duration = 5000
}) => {
    const confettiRef = useRef<ConfettiRef>(null);
    const hasTriggeredRef = useRef(false);

    const fireCelebration = useCallback(() => {
        if (!confettiRef.current) return;

        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 80 : 150;

        // Fire confetti from left side
        confettiRef.current.fire({
            particleCount,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.65 },
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
        });

        // Fire confetti from right side
        confettiRef.current.fire({
            particleCount,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.65 },
            colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff'],
        });

        // Second burst from center
        setTimeout(() => {
            confettiRef.current?.fire({
                particleCount: isMobile ? 60 : 100,
                angle: 90,
                spread: isMobile ? 100 : 140,
                origin: { x: 0.5, y: 0.3 },
                colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#9400D3'],
            });
        }, 300);

        // Third burst
        setTimeout(() => {
            confettiRef.current?.fire({
                particleCount: isMobile ? 40 : 80,
                spread: 160,
                origin: { x: 0.5, y: 0.5 },
                colors: ['#FFD700', '#FF69B4', '#00CED1', '#FF4500', '#8A2BE2'],
            });
        }, 600);
    }, []);

    useEffect(() => {
        if (isOpen && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            console.log('🎉 PurchaseSuccessConfetti: Starting celebration!');

            // Show toast notification
            toast.success(`🎉 ${message}`, {
                description: subMessage,
                duration: duration,
            });

            // Small delay to ensure canvas is ready
            setTimeout(() => {
                fireCelebration();
            }, 100);

            // Additional bursts
            setTimeout(fireCelebration, 500);
            setTimeout(fireCelebration, 900);

            // Cleanup and complete
            setTimeout(() => {
                hasTriggeredRef.current = false;
                onComplete?.();
            }, duration);
        }

        if (!isOpen) {
            hasTriggeredRef.current = false;
        }
    }, [isOpen, message, subMessage, duration, fireCelebration, onComplete]);

    return (
        <Confetti
            ref={confettiRef}
            className="absolute top-0 left-0 z-[9999] size-full"
            manualstart
            globalOptions={{
                resize: true,
                useWorker: true,
                disableForReducedMotion: true,
            }}
        />
    );
};

export default PurchaseSuccessConfetti;
