"use client";

import confetti, { type Options as ConfettiOptions } from "canvas-confetti";
import type { ReactNode } from "react";
import React, {
    createContext,
    forwardRef,
    useCallback,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
} from "react";

import { Button, type ButtonProps } from "@/components/ui/button";

export interface ConfettiRef {
    fire: (options?: ConfettiOptions) => void;
}

export interface ConfettiProps extends Omit<React.HTMLProps<HTMLCanvasElement>, 'ref'> {
    options?: ConfettiOptions;
    globalOptions?: {
        resize?: boolean;
        useWorker?: boolean;
        disableForReducedMotion?: boolean;
    };
    manualstart?: boolean;
    children?: ReactNode;
}

const ConfettiContext = createContext<{ fire: (options?: ConfettiOptions) => void }>({
    fire: () => { },
});

const Confetti = forwardRef<ConfettiRef, ConfettiProps>(function Confetti(
    {
        options,
        globalOptions = { resize: true, useWorker: true },
        manualstart = false,
        children,
        ...props
    },
    ref
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const confettiRef = useRef<confetti.CreateTypes | null>(null);

    // Initialize confetti instance
    useEffect(() => {
        if (!canvasRef.current) return;

        confettiRef.current = confetti.create(canvasRef.current, {
            resize: globalOptions.resize ?? true,
            useWorker: globalOptions.useWorker ?? true,
        });

        return () => {
            confettiRef.current?.reset();
        };
    }, [globalOptions.resize, globalOptions.useWorker]);

    const fire = useCallback(
        (opts: ConfettiOptions = {}) => {
            if (globalOptions.disableForReducedMotion) {
                const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                if (isReducedMotion) return;
            }

            confettiRef.current?.({
                ...options,
                ...opts,
            });
        },
        [options, globalOptions.disableForReducedMotion]
    );

    // Auto-fire on mount if not manual
    useEffect(() => {
        if (!manualstart) {
            fire();
        }
    }, [manualstart, fire]);

    // Expose fire method via ref
    useImperativeHandle(ref, () => ({
        fire,
    }));

    const contextValue = useMemo(() => ({ fire }), [fire]);

    return (
        <ConfettiContext.Provider value={contextValue}>
            <canvas
                ref={canvasRef}
                {...props}
                style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    width: "100vw",
                    height: "100vh",
                    pointerEvents: "none",
                    zIndex: 2147483647,
                    ...props.style,
                }}
            />
            {children}
        </ConfettiContext.Provider>
    );
});

interface ConfettiButtonProps extends ButtonProps {
    options?: ConfettiOptions & {
        colors?: string[];
        particleCount?: number;
        spread?: number;
        startVelocity?: number;
    };
    children?: ReactNode;
}

const ConfettiButton = forwardRef<HTMLButtonElement, ConfettiButtonProps>(
    function ConfettiButton({ options, children, ...props }, ref) {
        const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (rect.left + rect.width / 2) / window.innerWidth;
            const y = (rect.top + rect.height / 2) / window.innerHeight;

            confetti({
                particleCount: options?.particleCount ?? 100,
                spread: options?.spread ?? 70,
                origin: { x, y },
                colors: options?.colors ?? [
                    "#26ccff",
                    "#a25afd",
                    "#ff5e7e",
                    "#88ff5a",
                    "#fcff42",
                    "#ffa62d",
                    "#ff36ff",
                ],
                ...options,
            });

            props.onClick?.(e);
        };

        return (
            <Button ref={ref} onClick={handleClick} {...props}>
                {children}
            </Button>
        );
    }
);

// Hook to use confetti context
function useConfetti() {
    return useContext(ConfettiContext);
}

export { Confetti, ConfettiButton, useConfetti };
