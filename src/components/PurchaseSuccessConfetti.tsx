import React, { useEffect, useState, useCallback } from 'react';
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
    const [showConfetti, setShowConfetti] = useState(false);
    const [confettiPieces, setConfettiPieces] = useState(0);
    const isMobile = (width || 0) <= 480;

    useEffect(() => {
        if (isOpen) {
            // Start confetti immediately
            setShowConfetti(true);
            setConfettiPieces(isMobile ? 200 : 500);

            // Show toast notification
            toast.success(`🎉 ${message}`, {
                description: subMessage,
                duration: duration,
                className: 'purchase-success-toast',
            });

            // Gradually reduce confetti pieces for natural fade-out
            const reduceTimer = setTimeout(() => {
                setConfettiPieces(isMobile ? 80 : 200);
            }, 2500);

            // Stop generating new confetti
            const stopTimer = setTimeout(() => {
                setConfettiPieces(0);
            }, 4000);

            // Complete callback
            const completeTimer = setTimeout(() => {
                setShowConfetti(false);
                onComplete?.();
            }, duration);

            return () => {
                clearTimeout(reduceTimer);
                clearTimeout(stopTimer);
                clearTimeout(completeTimer);
            };
        }
    }, [isOpen, duration, onComplete, message, subMessage, isMobile]);

    if (!showConfetti) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none">
            <Confetti
                width={width}
                height={height}
                recycle={true}
                numberOfPieces={confettiPieces}
                gravity={0.15}
                wind={0.01}
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
                ]}
                tweenDuration={5000}
                confettiSource={{
                    x: 0,
                    y: 0,
                    w: width || 0,
                    h: 0
                }}
            />
        </div>
    );
};

export default PurchaseSuccessConfetti;
