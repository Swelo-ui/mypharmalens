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
    const hasTriggeredRef = useRef(false);
    const animationFrameRef = useRef<number | null>(null);

    // Rainbow colors for confetti
    const colors = [
        '#FF0000', // Red
        '#FF7F00', // Orange  
        '#FFFF00', // Yellow
        '#00FF00', // Green
        '#0000FF', // Blue
        '#4B0082', // Indigo
        '#9400D3', // Violet
        '#FF1493', // Deep Pink
        '#00CED1', // Dark Turquoise
        '#FFD700', // Gold
        '#FF69B4', // Hot Pink
        '#00FA9A', // Medium Spring Green
        '#1E90FF', // Dodger Blue
        '#FF4500', // Orange Red
        '#8A2BE2', // Blue Violet
        '#E91E63', // Pink
        '#9C27B0', // Purple
        '#03A9F4', // Light Blue
    ];

    const fireConfetti = useCallback(() => {
        const isMobile = window.innerWidth <= 768;
        const particleCount = isMobile ? 80 : 150;
        const spread = isMobile ? 60 : 80;

        // Fire confetti from both sides
        const fireFromSide = (originX: number) => {
            confetti({
                particleCount,
                angle: originX < 0.5 ? 60 : 120,
                spread,
                origin: { x: originX, y: 0.6 },
                colors,
                ticks: 300,
                gravity: 1.2,
                scalar: isMobile ? 0.8 : 1,
                drift: 0,
                disableForReducedMotion: true,
            });
        };

        // Fire from left
        fireFromSide(0.1);
        // Fire from right
        fireFromSide(0.9);

        // Fire from center top
        confetti({
            particleCount: isMobile ? 60 : 100,
            angle: 90,
            spread: isMobile ? 100 : 140,
            origin: { x: 0.5, y: 0.1 },
            colors,
            ticks: 350,
            gravity: 1,
            scalar: isMobile ? 0.9 : 1.1,
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

        // Fire confetti bursts
        fireConfetti();

        // Second burst after delay
        setTimeout(() => {
            fireConfetti();
        }, 500);

        // Third burst
        setTimeout(() => {
            const isMobile = window.innerWidth <= 768;
            confetti({
                particleCount: isMobile ? 50 : 80,
                angle: 90,
                spread: 160,
                origin: { x: 0.5, y: 0.4 },
                colors,
                ticks: 300,
                gravity: 0.8,
                scalar: isMobile ? 0.7 : 0.9,
                disableForReducedMotion: true,
            });
        }, 1000);

        // Cleanup and complete
        setTimeout(() => {
            hasTriggeredRef.current = false;
            onComplete?.();
        }, duration);
    }, [message, subMessage, duration, fireConfetti, onComplete]);

    useEffect(() => {
        if (isOpen && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            startCelebration();
        }

        // Reset when closed
        if (!isOpen) {
            hasTriggeredRef.current = false;
        }

        return () => {
            if (animationFrameRef.current) {
                cancelAnimationFrame(animationFrameRef.current);
            }
        };
    }, [isOpen, startCelebration]);

    // This component doesn't render any visible elements
    // canvas-confetti creates its own canvas on the document body
    return null;
};

export default PurchaseSuccessConfetti;
