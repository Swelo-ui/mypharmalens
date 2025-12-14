"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type Card = {
    id: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    backContent?: React.ReactNode;
    backTitle?: string;
    backDescription?: string;
    link?: string;
};

export const CardStack = ({
    items,
    offset,
    scaleFactor,
    className,
}: {
    items: Card[];
    offset?: number;
    scaleFactor?: number;
    className?: string;
}) => {
    const CARD_OFFSET = offset || 10;
    const SCALE_FACTOR = scaleFactor || 0.06;
    const [cards, setCards] = useState<Card[]>(items);
    const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

    useEffect(() => {
        // Auto-rotate cards every 5 seconds
        const interval = setInterval(() => {
            setCards((prevCards) => {
                const newArray = [...prevCards];
                newArray.unshift(newArray.pop()!);
                return newArray;
            });
        }, 5000);

        return () => clearInterval(interval);
    }, []);

    const handleCardClick = (cardId: number) => {
        setFlippedCards((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(cardId)) {
                newSet.delete(cardId);
            } else {
                newSet.add(cardId);
            }
            return newSet;
        });
    };

    const bringToFront = (index: number) => {
        setCards((prevCards) => {
            const newArray = [...prevCards];
            const [card] = newArray.splice(index, 1);
            newArray.push(card);
            return newArray;
        });
    };

    return (
        <div className={cn("relative h-72 w-80 md:h-80 md:w-96", className)}>
            <AnimatePresence>
                {cards.map((card, index) => {
                    const isFlipped = flippedCards.has(card.id);

                    return (
                        <motion.div
                            key={card.id}
                            className="absolute w-full h-full cursor-pointer"
                            style={{
                                transformOrigin: "top center",
                                perspective: "1000px",
                            }}
                            initial={{
                                y: index * -CARD_OFFSET,
                                scale: 1 - index * SCALE_FACTOR,
                                zIndex: cards.length - index,
                            }}
                            animate={{
                                y: index * -CARD_OFFSET,
                                scale: 1 - index * SCALE_FACTOR,
                                zIndex: cards.length - index,
                            }}
                            exit={{
                                y: -40,
                                opacity: 0,
                                scale: 0.9,
                            }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            onClick={() => {
                                if (index === cards.length - 1) {
                                    handleCardClick(card.id);
                                } else {
                                    bringToFront(index);
                                }
                            }}
                        >
                            {/* Card Container for 3D flip */}
                            <motion.div
                                className="relative w-full h-full"
                                style={{ transformStyle: "preserve-3d" }}
                                animate={{ rotateY: isFlipped ? 180 : 0 }}
                                transition={{ duration: 0.6, ease: "easeInOut" }}
                            >
                                {/* Front of card */}
                                <div
                                    className={cn(
                                        "absolute w-full h-full rounded-2xl p-6 shadow-xl border border-gray-200 dark:border-gray-700",
                                        "bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-gray-800 dark:via-gray-900 dark:to-gray-800",
                                        "flex flex-col justify-between"
                                    )}
                                    style={{ backfaceVisibility: "hidden" }}
                                >
                                    <div>
                                        <div className="w-12 h-12 rounded-xl bg-pharma-500/20 flex items-center justify-center mb-4">
                                            {card.icon}
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">
                                            {card.title}
                                        </h3>
                                        <p className="text-gray-300 text-sm leading-relaxed">
                                            {card.description}
                                        </p>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-4">
                                        Click to learn more →
                                    </div>
                                </div>

                                {/* Back of card */}
                                <div
                                    className={cn(
                                        "absolute w-full h-full rounded-2xl p-6 shadow-xl border border-pharma-500/30",
                                        "bg-gradient-to-br from-pharma-600 via-pharma-700 to-pharma-800",
                                        "flex flex-col justify-between"
                                    )}
                                    style={{
                                        backfaceVisibility: "hidden",
                                        transform: "rotateY(180deg)"
                                    }}
                                >
                                    <div>
                                        <h3 className="text-xl font-bold text-white mb-3">
                                            {card.backTitle || card.title}
                                        </h3>
                                        {card.backContent || (
                                            <p className="text-pharma-100 text-sm leading-relaxed">
                                                {card.backDescription || "Explore this feature in PharmaLens to learn more about how it can help you manage your medications safely."}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-xs text-pharma-200 mt-4">
                                        ← Click to flip back
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    );
                })}
            </AnimatePresence>
        </div>
    );
};

export default CardStack;
