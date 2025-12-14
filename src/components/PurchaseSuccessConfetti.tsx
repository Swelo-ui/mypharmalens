import React, { useEffect, useState, useRef } from 'react';
import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';
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
    const { width, height } = useWindowSize();
    const [confettiPieces, setConfettiPieces] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const hasTriggeredRef = useRef(false);
    const isMobile = (width || 0) <= 480;

    useEffect(() => {
        // Only trigger once when isOpen becomes true
        if (isOpen && !hasTriggeredRef.current) {
            hasTriggeredRef.current = true;
            console.log('🎉 PurchaseSuccessConfetti triggered!');

            // Start confetti immediately
            setIsActive(true);
            setConfettiPieces(isMobile ? 300 : 600);

            // Show toast notification
            toast.success(`🎉 ${message}`, {
                description: subMessage,
                duration: duration,
            });

            // Gradually reduce confetti pieces for natural fade-out
            const reduceTimer = setTimeout(() => {
                setConfettiPieces(isMobile ? 100 : 250);
            }, 2000);

            // Stop generating new confetti
            const stopTimer = setTimeout(() => {
                setConfettiPieces(50);
            }, 3500);

            // Fade out completely
            const fadeTimer = setTimeout(() => {
                setConfettiPieces(0);
            }, 4500);

            // Complete callback
            const completeTimer = setTimeout(() => {
                setIsActive(false);
                hasTriggeredRef.current = false;
                onComplete?.();
            }, duration);

            return () => {
                clearTimeout(reduceTimer);
                clearTimeout(stopTimer);
                clearTimeout(fadeTimer);
                clearTimeout(completeTimer);
            };
        }

        // Reset when closed
        if (!isOpen) {
            hasTriggeredRef.current = false;
        }
    }, [isOpen]);

    // Always render but with 0 pieces when not active
    if (!isActive && confettiPieces === 0) return null;

    return (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
            <Confetti
                width={width}
                height={height}
                recycle={confettiPieces > 0}
                numberOfPieces={confettiPieces}
                gravity={0.2}
                wind={0.02}
                initialVelocityY={15}
                colors={[
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
                ]}
                tweenDuration={4000}
            />
        </div>
    );
};

export default PurchaseSuccessConfetti;
