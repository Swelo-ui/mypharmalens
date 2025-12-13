"use client";

import { useCallback, useRef } from "react";
import { Moon, Sun } from "lucide-react";
import { flushSync } from "react-dom";
import { useTheme } from "next-themes";

import { cn } from "@/lib/utils";
import { playThemeSwitchSound } from "@/utils/audioService";

interface AnimatedThemeTogglerProps
    extends React.ComponentPropsWithoutRef<"button"> {
    duration?: number;
    iconSize?: string;
}

export const AnimatedThemeToggler = ({
    className,
    duration = 400,
    iconSize = "h-5 w-5",
    ...props
}: AnimatedThemeTogglerProps) => {
    const { setTheme, theme, resolvedTheme } = useTheme();
    const buttonRef = useRef<HTMLButtonElement>(null);

    const isDark = resolvedTheme === "dark" || theme === "dark";

    const toggleTheme = useCallback(async () => {
        if (!buttonRef.current) return;

        // Play sound effect
        playThemeSwitchSound();

        const newTheme = isDark ? "light" : "dark";

        // Check if View Transitions API is supported
        if (!document.startViewTransition) {
            // Fallback for browsers without View Transitions API
            setTheme(newTheme);
            return;
        }

        // Use View Transitions API for smooth animation
        await document.startViewTransition(() => {
            flushSync(() => {
                setTheme(newTheme);
            });
        }).ready;

        const { top, left, width, height } =
            buttonRef.current.getBoundingClientRect();
        const x = left + width / 2;
        const y = top + height / 2;
        const maxRadius = Math.hypot(
            Math.max(left, window.innerWidth - left),
            Math.max(top, window.innerHeight - top)
        );

        document.documentElement.animate(
            {
                clipPath: [
                    `circle(0px at ${x}px ${y}px)`,
                    `circle(${maxRadius}px at ${x}px ${y}px)`,
                ],
            },
            {
                duration,
                easing: "ease-in-out",
                pseudoElement: "::view-transition-new(root)",
            }
        );
    }, [isDark, duration, setTheme]);

    return (
        <button
            ref={buttonRef}
            onClick={toggleTheme}
            className={cn(
                "p-2 text-gray-600 dark:text-gray-300 hover:text-pharma-600 dark:hover:text-pharma-400 transition-colors",
                className
            )}
            aria-label="Toggle theme"
            {...props}
        >
            {isDark ? (
                <Sun className={iconSize} />
            ) : (
                <Moon className={iconSize} />
            )}
            <span className="sr-only">Toggle theme</span>
        </button>
    );
};

export default AnimatedThemeToggler;
