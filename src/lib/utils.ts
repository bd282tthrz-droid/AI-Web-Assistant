import { clsx } from "clsx";
import type { ClassValue } from "clsx";

/**
 * Utility function for conditionally joining class names.
 * 使用 clsx 而非 tailwind-merge，因为本项目使用 Tailwind CSS v4。
 */
export const cn = (...inputs: ClassValue[]): string => clsx(inputs);