"use client";

interface RestartDialogProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function RestartDialog({
  open,
  onCancel,
  onConfirm,
  loading = false,
}: RestartDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="restart-title"
        className="max-w-md w-full rounded-2xl bg-[#f7fbff] p-5 shadow-xl border border-[#cfe0eb]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="restart-title" className="text-xl font-bold text-[#12324a] mb-2">
          התחלה מחדש
        </h2>
        <p className="text-[#27475d] text-sm leading-relaxed">
          האם להתחיל מחדש? ההתקדמות הנוכחית תימחק.
        </p>
        <div className="mt-5 flex gap-3">
          <button
            type="button"
            className="flex-1 rounded-xl border border-[#9fb8c9] py-2.5 font-semibold text-[#1a4d6d] hover:bg-white"
            onClick={onCancel}
            disabled={loading}
          >
            ביטול
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl bg-[#c45c26] text-white py-2.5 font-semibold hover:bg-[#a84c1f] disabled:opacity-60"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "יוצר לוח..." : "התחל לוח חדש"}
          </button>
        </div>
      </div>
    </div>
  );
}
