"use client";

import React, { useState, useEffect, useMemo } from "react";

interface FloatingParticlesProps {
    count?: number;
    delay?: number;
    className?: string;
    color?: string;
    size?: number | { min: number; max: number };
}

const FloatingParticles = ({
    count = 12,
    delay = 1000,
    className = "",
    color = "#1D8751",
    size = 4,
}: FloatingParticlesProps) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setMounted(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    const particles = useMemo(() => {
        return Array.from({ length: count }).map((_, i) => {
            let particleSize;
            if (typeof size === "number") {
                particleSize = size;
            } else {
                particleSize = Math.random() * (size.max - size.min) + size.min;
            }

            return {
                id: i,
                size: particleSize,
                duration: Math.random() * 20 + 10, // Duration between 10s and 30s
                left: Math.random() * 100, // Random position from 0 to 100%
                top: Math.random() * 100, // Random position from 0 to 100%
            };
        });
    }, [count, size]);

    if (!mounted) return null;

    return (
        <div
            className={`pointer-events-none absolute inset-0 overflow-hidden transition-opacity duration-1000 opacity-100 ${className}`}
        >
            {particles.map((p) => (
                <span
                    key={p.id}
                    className="absolute rounded-full animate-floatSlow"
                    style={{
                        backgroundColor: color,
                        opacity: 0.5,
                        width: `${p.size}px`,
                        height: `${p.size}px`,
                        left: `${p.left}%`,
                        top: `${p.top}%`,
                        animationDuration: `${p.duration}s`,
                    }}
                />
            ))}
        </div>
    );
};

export default FloatingParticles;
