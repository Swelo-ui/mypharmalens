import React, { useEffect, useState, useRef } from 'react';
import Confetti from 'react-confetti';
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
    // Use state for window dimensions to handle mobile properly
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const [confettiPieces, setConfettiPieces] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const hasTriggeredRef = useRef(false);

    // Calculate dimensions on mount and resize
    useEffect(() => {
        const updateDimensions = () => {
            // Use document dimensions for better mobile support
            const width = Math.max(
                document.documentElement.clientWidth || 0,
                window.innerWidth || 0
            );
            const height = Math.max(
                document.documentElement.clientHeight || 0,
                window.innerHeight || 0
            );
            setDimensions({ width, height });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        window.addEventListener('orientationchange', updateDimensions);

        return () => {
            window.removeEventListener('resize', updateDimensions);
            window.removeEventListener('orientationchange', updateDimensions);
        };
    }, []);

    const isMobile = dimensions.width <= 768;

    useEffect(() => {
        // Only trigger once when isOpen becomes true
        if (isOpen && !hasTriggeredRef.current && dimensions.width > 0) {
            hasTriggeredRef.current = true;
            console.log('🎉 PurchaseSuccessConfetti triggered!', { isMobile, dimensions });

            // Start confetti immediately
            setIsActive(true);
            // Use fewer pieces on mobile for performance
            setConfettiPieces(isMobile ? 150 : 400);

            // Show toast notification
            toast.success(`🎉 ${message}`, {
                description: subMessage,
                duration: duration,
            });

            // Gradually reduce confetti pieces for natural fade-out
            const reduceTimer = setTimeout(() => {
                setConfettiPieces(isMobile ? 50 : 150);
            }, 2000);

            // Stop generating new confetti
            const stopTimer = setTimeout(() => {
                setConfettiPieces(20);
            }, 3000);

            // Fade out completely
            const fadeTimer = setTimeout(() => {
                setConfettiPieces(0);
            }, 4000);

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
    }, [isOpen, dimensions.width]);

    // Don't render if not active or no dimensions
    if (!isActive || dimensions.width === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 99999,
                pointerEvents: 'none',
                overflow: 'hidden',
            }}
        >
            <Confetti
                width={dimensions.width}
                height={dimensions.height}
                recycle={confettiPieces > 0}
                numberOfPieces={confettiPieces}
                gravity={isMobile ? 0.3 : 0.2}
                wind={0.01}
                initialVelocityY={isMobile ? 10 : 15}
                friction={0.99}
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
                tweenDuration={3000}
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                }}
            />
        </div>
    );
};

export default PurchaseSuccessConfetti;
