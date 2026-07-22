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

function Mark({ color }: { color: BallColor }) {
  const stroke = color === "yellow" ? "#5d4e00" : "rgba(255,255,255,0.95)";

  switch (color) {
    case "red":
      return (
        <circle
          cx="12"
          cy="12"
          r="4.5"
          fill="none"
          stroke={stroke}
          strokeWidth="2"
        />
      );
    case "blue":
      return (
        <line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
          stroke={stroke}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      );
    case "green":
      return <circle cx="12" cy="12" r="2.8" fill={stroke} />;
    case "yellow":
      return (
        <polygon
          points="12,4 14.2,9.5 20,10 15.5,13.8 17,19.5 12,16.5 7,19.5 8.5,13.8 4,10 9.8,9.5"
          fill={stroke}
        />
      );
    case "purple":
      return (
        <polygon points="12,5 19,18 5,18" fill="none" stroke={stroke} strokeWidth="2" />
      );
    case "orange":
      return (
        <>
          <line
            x1="5"
            y1="9"
            x2="19"
            y2="9"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1="5"
            y1="15"
            x2="19"
            y2="15"
            stroke={stroke}
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      );
    default:
      return null;
  }
}

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
      <svg viewBox="0 0 24 24" className="w-[70%] h-[70%]" aria-hidden="true">
        <Mark color={color} />
      </svg>
      <span
        className="pointer-events-none absolute top-[14%] left-[18%] h-[22%] w-[28%] rounded-full bg-white/50"
        aria-hidden="true"
      />
    </span>
  );
}
