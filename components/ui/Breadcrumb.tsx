import React from "react";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
    label: string;
    href?: string;
}

interface BreadcrumbProps {
    items: BreadcrumbItem[];
    className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items, className }) => {
    return (
        <nav
            aria-label="Breadcrumb"
            className={cn("w-full overflow-x-auto no-scrollbar", className)}
        >
            <ol className="flex flex-wrap items-center gap-1.5 py-2">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <li
                            key={index}
                            className="flex items-center gap-1.5 shrink-0"
                        >
                            {index > 0 && (
                                <ChevronRight
                                    size={16}
                                    className="text-zinc-600 shrink-0"
                                    strokeWidth={2}
                                />
                            )}

                            {isLast ? (
                                <span className="text-sm font-medium text-[#1D8751] whitespace-nowrap flex items-center">
                                    {item.label}
                                </span>
                            ) : item.href ? (
                                <Link
                                    href={item.href}
                                    className="text-sm text-zinc-400 hover:text-zinc-100 transition-colors whitespace-nowrap flex items-center"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="text-sm text-zinc-400 whitespace-nowrap flex items-center">
                                    {item.label}
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
};

export { Breadcrumb };
