import { cn } from "@/lib/utils";
import { Star, Quote } from "lucide-react";

interface TestimonialCardProps {
    name: string;
    role: string;
    content: string;
    rating: number;
    avatar?: string;
    className?: string;
}

export function TestimonialCard({
    name,
    role,
    content,
    rating,
    avatar,
    className,
}: TestimonialCardProps) {
    return (
        <div
            className={cn(
                "relative w-[350px] shrink-0 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-md transition-transform hover:scale-[1.02]",
                className
            )}
        >
            {/* Quote Icon */}
            <Quote className="absolute top-4 right-4 h-8 w-8 text-pharma-200 dark:text-pharma-800" />

            {/* Rating Stars */}
            <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                        key={i}
                        className={cn(
                            "h-4 w-4",
                            i < rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "fill-gray-200 text-gray-200 dark:fill-gray-600 dark:text-gray-600"
                        )}
                    />
                ))}
            </div>

            {/* Content */}
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-4 line-clamp-4">
                "{content}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 mt-auto pt-4 border-t border-gray-100 dark:border-gray-700">
                <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                    {avatar ? (
                        <img
                            src={avatar}
                            alt={name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-pharma-400 to-pharma-600 flex items-center justify-center text-white font-semibold text-sm">
                            {name.charAt(0).toUpperCase()}
                        </div>
                    )}
                </div>
                <div>
                    <p className="font-medium text-sm text-gray-900 dark:text-white">{name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{role}</p>
                </div>
            </div>
        </div>
    );
}

// PharmaLens testimonials data
export const pharmaLensTestimonials = [
    {
        name: "Dr. Priya Sharma",
        role: "General Physician, Mumbai",
        content: "PharmaLens has been a game-changer for my practice. The AI identification is incredibly accurate, and it helps me quickly verify medications that patients bring in. Highly recommended for healthcare professionals!",
        rating: 5,
        avatar: "/images/testimonials/priya-sharma.png"
    },
    {
        name: "Rahul Verma",
        role: "B.Pharm Student, Delhi",
        content: "As a pharmacy student, I use PharmaLens daily for learning. The detailed drug information and visual identification feature have made studying so much easier. Best educational tool for pharma students!",
        rating: 5,
        avatar: "/images/testimonials/rahul-verma.png"
    },
    {
        name: "Anjali Patel",
        role: "Pharmacist, Ahmedabad",
        content: "The drug interaction checker is exceptionally useful. It has helped me catch potential interactions several times. The interface is intuitive and the database is comprehensive.",
        rating: 5,
        avatar: "/images/testimonials/anjali-patel.png"
    },
    {
        name: "Vikram Singh",
        role: "Caregiver, Jaipur",
        content: "Managing my parents' medications was confusing until I found PharmaLens. Now I can easily identify and track all their pills. The symptom checker feature is also very helpful!",
        rating: 4,
        avatar: "/images/testimonials/vikram-singh.png"
    },
    {
        name: "Dr. Meena Iyer",
        role: "Clinical Pharmacologist, Chennai",
        content: "I'm impressed by the accuracy of the AI identification system. Even for newer medications, PharmaLens provides accurate results. A must-have tool for any healthcare setting.",
        rating: 5,
        avatar: "/images/testimonials/meena-iyer.png"
    },
    {
        name: "Arjun Reddy",
        role: "Hospital Administrator, Hyderabad",
        content: "We've implemented PharmaLens across our nursing staff and it has reduced medication identification errors significantly. The Pro plan is worth every rupee for institutional use.",
        rating: 5,
        avatar: "/images/testimonials/arjun-reddy.png"
    },
    {
        name: "Sneha Gupta",
        role: "Home Nurse, Bangalore",
        content: "Working with elderly patients, I encounter many unlabeled medications. PharmaLens helps me identify them quickly and safely. The app is fast and reliable even in remote areas.",
        rating: 4,
        avatar: "/images/testimonials/sneha-gupta.png"
    },
    {
        name: "Karan Mehta",
        role: "D.Pharm Graduate, Pune",
        content: "Excellent platform for anyone in the pharmaceutical field. The comprehensive database and easy-to-use interface make it my go-to resource for medication information.",
        rating: 5,
        avatar: "/images/testimonials/karan-mehta.png"
    },
];

export default TestimonialCard;
