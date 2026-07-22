"use client";

interface DirectionControlsProps {
  disabled?: boolean;
  onDirection: (direction: "up" | "down" | "left" | "right") => void;
}

export function DirectionControls({
  disabled = false,
  onDirection,
}: DirectionControlsProps) {
  return (
    <div
      className="mx-auto w-44"
      role="group"
      aria-label="כיווני דחיפה"
      dir="ltr"
    >
      <div className="grid grid-cols-3 grid-rows-3 gap-2">
        <button
          type="button"
          className="col-start-2 row-start-1 h-12 rounded-xl bg-[#1a4d6d] text-white text-xl font-bold shadow-md disabled:opacity-40 hover:bg-[#163e57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a202]"
          aria-label="דחיפה למעלה"
          disabled={disabled}
          onClick={() => onDirection("up")}
        >
          ↑
        </button>
        <button
          type="button"
          className="col-start-1 row-start-2 h-12 rounded-xl bg-[#1a4d6d] text-white text-xl font-bold shadow-md disabled:opacity-40 hover:bg-[#163e57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a202]"
          aria-label="דחיפה שמאלה"
          disabled={disabled}
          onClick={() => onDirection("left")}
        >
          ←
        </button>
        <button
          type="button"
          className="col-start-3 row-start-2 h-12 rounded-xl bg-[#1a4d6d] text-white text-xl font-bold shadow-md disabled:opacity-40 hover:bg-[#163e57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a202]"
          aria-label="דחיפה ימינה"
          disabled={disabled}
          onClick={() => onDirection("right")}
        >
          →
        </button>
        <button
          type="button"
          className="col-start-2 row-start-3 h-12 rounded-xl bg-[#1a4d6d] text-white text-xl font-bold shadow-md disabled:opacity-40 hover:bg-[#163e57] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a202]"
          aria-label="דחיפה למטה"
          disabled={disabled}
          onClick={() => onDirection("down")}
        >
          ↓
        </button>
      </div>
    </div>
  );
}
