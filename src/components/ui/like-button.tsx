"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface LikeButtonProps {
    className?: string;
    iconCount?: number;
}

interface HeartParticle {
    id: number;
    x: number;
    y: number;
    scale: number;
    rotation: number;
}

export function LikeButton({ className, iconCount = 12 }: LikeButtonProps) {
    const [liked, setLiked] = React.useState(false);
    const [likeCount, setLikeCount] = React.useState(0);
    const [particles, setParticles] = React.useState<HeartParticle[]>([]);

    const handleClick = () => {
        setLiked(true);
        setLikeCount((prev) => prev + 1);

        // Generate random heart particles
        const newParticles: HeartParticle[] = Array.from(
            { length: iconCount },
            (_, i) => ({
                id: Date.now() + i,
                x: (Math.random() - 0.5) * 120,
                y: -Math.random() * 80 - 20,
                scale: Math.random() * 0.5 + 0.5,
                rotation: (Math.random() - 0.5) * 90,
            })
        );

        setParticles(newParticles);

        // Clear particles after animation
        setTimeout(() => {
            setParticles([]);
        }, 1000);
    };

    return (
        <div className={cn("relative inline-flex items-center gap-1", className)}>
            <button
                onClick={handleClick}
                className="relative flex items-center justify-center focus:outline-none group"
                aria-label="Like this"
            >
                {/* Main Heart Icon */}
                <motion.div
                    animate={
                        liked
                            ? {
                                scale: [1, 1.3, 1],
                            }
                            : {}
                    }
                    transition={{ duration: 0.3 }}
                >
                    <Heart
                        className={cn(
                            "h-4 w-4 transition-colors duration-200 cursor-pointer",
                            liked
                                ? "text-red-500 fill-red-500"
                                : "text-red-500 group-hover:fill-red-500/30"
                        )}
                    />
                </motion.div>

                {/* Heart Burst Particles */}
                <AnimatePresence>
                    {particles.map((particle) => (
                        <motion.div
                            key={particle.id}
                            initial={{
                                opacity: 1,
                                x: 0,
                                y: 0,
                                scale: 0,
                                rotate: 0,
                            }}
                            animate={{
                                opacity: 0,
                                x: particle.x,
                                y: particle.y,
                                scale: particle.scale,
                                rotate: particle.rotation,
                            }}
                            exit={{ opacity: 0 }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut",
                            }}
                            className="absolute pointer-events-none"
                        >
                            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </button>

            {/* Like Count Display */}
            <AnimatePresence mode="wait">
                {likeCount > 0 && (
                    <motion.span
                        key={likeCount}
                        initial={{ opacity: 0, y: 5, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -5, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="text-xs text-red-500 font-medium min-w-[1rem] text-center"
                    >
                        {likeCount}
                    </motion.span>
                )}
            </AnimatePresence>
        </div>
    );
}

export default LikeButton;
