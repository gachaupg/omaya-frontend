import { clsx, type ClassValue } from "clsx";

/**
 * Utility function to merge tailwind classes.
 * Note: tailwind-merge is not installed yet, so this only uses clsx.
 */
export function cn(...inputs: ClassValue[]) {
    return clsx(inputs);
}
