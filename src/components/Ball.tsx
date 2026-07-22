"use client";

import type { BallColor } from "@/lib/game/types";
import { COLOR_CSS, COLOR_LABELS_HE } from "@/lib/game/constants";

interface BallProps {
  color: BallColor;
  size?: "sm" | "md" | "lg";
  selected?: boolean;
  highlighted?: boolean;
  collecting?: boolean;
  className?: string;
}

const SIZE_CLASS = {
  sm: "w-7 h-7",
  md: "w-9 h-9 sm:w-10 sm:h-10",
  lg: "w-12 h-12",
};

export function Ball({
  color,
  size = "md",
  selected = false,
  highlighted = false,
  collecting = false,
  className = "",
}: BallProps) {
  return (
    <span
      className={[
        "relative inline-flex items-center justify-center rounded-full",
        SIZE_CLASS[size],
        selected ? "ring-2 ring-offset-2 ring-[#1a4d6d] scale-105" : "",
        highlighted ? "animate-pulse-group" : "",
        collecting ? "animate-collect-out" : "",
        className,
      ].join(" ")}
      style={{
        background: `radial-gradient(circle at 30% 28%, #ffffffaa, ${COLOR_CSS[color]} 42%, #00000055 100%)`,
        boxShadow:
          "inset 0 -3px 6px rgba(0,0,0,0.28), inset 0 3px 5px rgba(255,255,255,0.35), 0 2px 4px rgba(0,0,0,0.2)",
      }}
      aria-hidden="true"
      title={COLOR_LABELS_HE[color]}
    >
      <span
        className="pointer-events-none absolute top-[14%] left-[18%] h-[22%] w-[28%] rounded-full bg-white/50"
        aria-hidden="true"
      />
    </span>
  );
}
