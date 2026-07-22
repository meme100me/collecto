"use client";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        className="max-w-lg w-full max-h-[85vh] overflow-y-auto rounded-2xl bg-[#f7fbff] p-5 shadow-xl border border-[#cfe0eb]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="help-title" className="text-xl font-bold text-[#12324a] mb-3">
          עזרה מהירה
        </h2>
        <ul className="space-y-2 text-[#27475d] text-sm leading-relaxed list-disc pr-5">
          <li>גררו כדור אופקית כדי לדחוף את כל השורה עד הקצה.</li>
          <li>גררו כדור אנכית כדי לדחוף את כל העמודה עד הקצה.</li>
          <li>אפשר גם לבחור כדור ולהשתמש בחצי הכיוון.</li>
          <li>מהלך רגיל חייב ליצור לפחות שני כדורים זהים צמודים.</li>
          <li>כל שלושה כדורים מאותו צבע שנאספו שווים נקודה אחת.</li>
          <li>המטרה: להגיע ל-5 נקודות ולחשוף את הקואורדינטות.</li>
        </ul>
        <button
          type="button"
          className="mt-5 w-full rounded-xl bg-[#1a4d6d] text-white py-2.5 font-semibold hover:bg-[#163e57]"
          onClick={onClose}
        >
          סגור
        </button>
      </div>
    </div>
  );
}
