import React, { useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';
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
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const confettiInstanceRef = useRef<confetti.CreateTypes | null>(null);
    const hasTriggeredRef = useRef(false);

    // Rainbow colors for confetti
    const colors = [
        '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF',
        '#4B0082', '#9400D3', '#FF1493', '#00CED1', '#FFD700',
        '#FF69B4', '#00FA9A', '#1E90FF', '#FF4500', '#8A2BE2',
        '#E91E63', '#9C27B0', '#03A9F4',
    ];

    // Initialize confetti on our canvas
    useEffect(() => {
        if (canvasRef.current && !confettiInstanceRef.current) {
            confettiInstanceRef.current = confetti.create(canvasRef.current, {
                resize: true,
                useWorker: true,
            });
        }
    }, []);

    const fireConfetti = useCallback(() => {
        if (!confettiInstanceRef.current) return;

        const myConfetti = confettiInstanceRef.current;
        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 60 : 120;
        const spread = isMobile ? 55 : 70;

        // Fire confetti from left side
        myConfetti({
            particleCount,
            angle: 60,
            spread,
            origin: { x: 0, y: 0.65 },
            colors,
            ticks: 250,
            gravity: 1,
            scalar: isMobile ? 0.7 : 0.9,
            disableForReducedMotion: true,
        });

        // Fire confetti from right side
        myConfetti({
            particleCount,
            angle: 120,
            spread,
            origin: { x: 1, y: 0.65 },
            colors,
            ticks: 250,
            gravity: 1,
            scalar: isMobile ? 0.7 : 0.9,
            disableForReducedMotion: true,
        });

        // Fire from center top
        myConfetti({
            particleCount: isMobile ? 40 : 80,
            angle: 90,
            spread: isMobile ? 80 : 120,
            origin: { x: 0.5, y: 0 },
            colors,
            ticks: 280,
            gravity: 0.9,
            scalar: isMobile ? 0.8 : 1,
            disableForReducedMotion: true,
        });
    }, []);

    const startCelebration = useCallback(() => {
        console.log('🎉 PurchaseSuccessConfetti: Starting celebration!');

        // Show toast notification
        toast.success(`🎉 ${message}`, {
            description: subMessage,
            duration: duration,
        });

        // Fire confetti bursts with delays
        fireConfetti();
        setTimeout(fireConfetti, 400);
        setTimeout(fireConfetti, 800);

        // Cleanup and complete
        setTimeout(() => {
            hasTriggeredRef.current = false;
            onComplete?.();
        }, duration);
    }, [message, subMessage, duration, fireConfetti, onComplete]);

    useEffect(() => {
        if (isOpen && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            // Small delay to ensure canvas is mounted
            setTimeout(startCelebration, 50);
        }

        if (!isOpen) {
            hasTriggeredRef.current = false;
        }
    }, [isOpen, startCelebration]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (confettiInstanceRef.current) {
                confettiInstanceRef.current.reset();
            }
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                pointerEvents: 'none',
                zIndex: 2147483647, // Maximum z-index
                touchAction: 'none',
                WebkitUserSelect: 'none',
                userSelect: 'none',
            }}
        />
    );
};

export default PurchaseSuccessConfetti;
