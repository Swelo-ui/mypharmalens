"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
    Pill, Camera, Search, FileText,
    Database, Shield, Zap, Heart,
    CheckCircle, Clock, Globe, Sparkles,
    BookOpen, AlertTriangle, Stethoscope, BarChart3
} from "lucide-react";

interface FeatureCard {
    id: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    backFeatures: {
        icon: React.ReactNode;
        title: string;
        description: string;
    }[];
}

const FEATURE_CARDS: FeatureCard[] = [
    {
        id: 0,
        icon: <Pill className="h-6 w-6 text-pharma-400" />,
        title: "Drug Information",
        description: "Access comprehensive drug data including uses, dosages, side effects, and precautions.",
        backFeatures: [
            {
                icon: <Database className="h-4 w-4 text-pharma-300" />,
                title: "1000+ Medications",
                description: "Verified drug database"
            },
            {
                icon: <Shield className="h-4 w-4 text-pharma-300" />,
                title: "Safety Warnings",
                description: "Contraindications & precautions"
            },
            {
                icon: <Heart className="h-4 w-4 text-pharma-300" />,
                title: "Side Effects",
                description: "Complete adverse reactions list"
            }
        ]
    },
    {
        id: 1,
        icon: <Camera className="h-6 w-6 text-pharma-400" />,
        title: "Visual Identification",
        description: "Upload an image of any medication to identify it with our AI-powered recognition system.",
        backFeatures: [
            {
                icon: <Sparkles className="h-4 w-4 text-pharma-300" />,
                title: "99% Accuracy",
                description: "AI-powered recognition"
            },
            {
                icon: <Zap className="h-4 w-4 text-pharma-300" />,
                title: "Instant Results",
                description: "Identify in seconds"
            },
            {
                icon: <CheckCircle className="h-4 w-4 text-pharma-300" />,
                title: "Shape & Imprint",
                description: "Color, shape, markings analysis"
            }
        ]
    },
    {
        id: 2,
        icon: <Search className="h-6 w-6 text-pharma-400" />,
        title: "Smart Search",
        description: "Find medications by name, category, manufacturer, or conditions they treat.",
        backFeatures: [
            {
                icon: <Globe className="h-4 w-4 text-pharma-300" />,
                title: "Brand & Generic",
                description: "Search by any name"
            },
            {
                icon: <BarChart3 className="h-4 w-4 text-pharma-300" />,
                title: "Fuzzy Matching",
                description: "Typo-tolerant search"
            },
            {
                icon: <Clock className="h-4 w-4 text-pharma-300" />,
                title: "Voice Search",
                description: "Speak to search medications"
            }
        ]
    },
    {
        id: 3,
        icon: <FileText className="h-6 w-6 text-pharma-400" />,
        title: "Educational Resources",
        description: "Access medication guides and educational content to better understand your prescriptions.",
        backFeatures: [
            {
                icon: <BookOpen className="h-4 w-4 text-pharma-300" />,
                title: "Drug Guides",
                description: "Detailed medication info"
            },
            {
                icon: <AlertTriangle className="h-4 w-4 text-pharma-300" />,
                title: "Interaction Checker",
                description: "Check drug combinations"
            },
            {
                icon: <Stethoscope className="h-4 w-4 text-pharma-300" />,
                title: "Symptom Checker",
                description: "Find medicines by symptoms"
            }
        ]
    }
];

const FlipCard = ({ card }: { card: FeatureCard }) => {
    const [isFlipped, setIsFlipped] = useState(false);

    return (
        <div
            className="h-56 sm:h-56 md:h-60 cursor-pointer perspective-1000 touch-manipulation"
            onClick={() => setIsFlipped(!isFlipped)}
        >
            <motion.div
                className="relative w-full h-full"
                style={{ transformStyle: "preserve-3d" }}
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
            >
                <div
                    className={cn(
                        "absolute inset-0 rounded-xl p-4 md:p-5 shadow-lg",
                        "bg-white dark:bg-gradient-to-br dark:from-gray-900 dark:via-gray-800 dark:to-gray-900",
                        "border border-gray-200 dark:border-gray-700/50 hover:border-pharma-500/50",
                        "flex flex-col transition-colors duration-300"
                    )}
                    style={{ backfaceVisibility: "hidden" }}
                >
                    <div className="w-10 h-10 rounded-lg bg-pharma-100 dark:bg-pharma-500/20 flex items-center justify-center mb-3">
                        <div className="text-pharma-600 dark:text-pharma-400">
                            {card.icon}
                        </div>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                        {card.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-snug flex-1 line-clamp-2">
                        {card.description}
                    </p>
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-2 flex items-center gap-1">
                        <span className="hidden sm:inline">Click to see more</span>
                        <span className="sm:hidden">Tap for more</span>
                        <span className="animate-pulse">→</span>
                    </div>
                </div>

                <div
                    className={cn(
                        "absolute inset-0 rounded-xl p-3 shadow-lg",
                        "bg-gradient-to-br from-pharma-500 via-pharma-600 to-pharma-700 dark:from-pharma-600 dark:via-pharma-700 dark:to-pharma-800",
                        "border border-pharma-400/30 dark:border-pharma-500/30",
                        "flex flex-col"
                    )}
                    style={{
                        backfaceVisibility: "hidden",
                        transform: "rotateY(180deg)"
                    }}
                >
                    <h3 className="text-sm font-bold text-white mb-1.5">
                        {card.title}
                    </h3>

                    <div className="space-y-1 flex-1">
                        {card.backFeatures.map((feature, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-white/15 dark:bg-white/10 rounded-md py-1.5 px-2">
                                <div className="text-pharma-200 dark:text-pharma-300 shrink-0">{feature.icon}</div>
                                <div>
                                    <div className="text-white text-xs font-medium leading-tight">{feature.title}</div>
                                    <div className="text-pharma-100 dark:text-pharma-200 text-xs leading-tight">{feature.description}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="text-xs text-pharma-100 dark:text-pharma-200 mt-1 flex items-center gap-1">
                        <span className="animate-pulse">←</span>
                        <span>Tap to flip</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export function FlippableFeatureGrid({ className }: { className?: string }) {
    return (
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6", className)}>
            {FEATURE_CARDS.map((card) => (
                <FlipCard key={card.id} card={card} />
            ))}
        </div>
    );
}

export default FlippableFeatureGrid;
