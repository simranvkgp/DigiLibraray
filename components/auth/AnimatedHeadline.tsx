"use client";

import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";

export function AnimatedHeadline({ text, className }: { text: string; className?: string }) {
  const prefersReducedMotion = useReducedMotion();
  const words = text.split(" ");

  return (
    <h1 className={cn("font-display font-bold tracking-tight text-navy", className)}>
      {words.map((word, i) => (
        <motion.span
          key={`${word}-${i}`}
          className="inline-block"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: i * 0.09, ease: "easeOut" }}
        >
          {word}
          {i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </h1>
  );
}
