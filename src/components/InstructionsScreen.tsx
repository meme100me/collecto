"use client";

interface InstructionsScreenProps {
  onStart: () => void;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

function RuleCard({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon: string;
}) {
  return (
    <article className="rounded-2xl bg-white/80 border border-[#d2e2ec] p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span
          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#e7f2f8] text-lg"
          aria-hidden="true"
        >
          {icon}
        </span>
        <h3 className="font-bold text-[#12324a]">{title}</h3>
      </div>
      <div className="text-sm leading-relaxed text-[#2f4d60] space-y-2">
        {children}
      </div>
    </article>
  );
}

export function InstructionsScreen({
  onStart,
  loading = false,
  error = null,
  onRetry,
}: InstructionsScreenProps) {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="text-center mb-8">
        <p className="text-sm font-semibold tracking-wide text-[#2f80a8] mb-2">
          אתגר לשחקן יחיד
        </p>
        <h1 className="font-display text-4xl sm:text-5xl font-black text-[#12324a] leading-tight">
          קולקטו
          <span className="block text-2xl sm:text-3xl font-bold text-[#2f80a8] mt-1">
            אתגר הקואורדינטות
          </span>
        </h1>
        <p className="mt-4 text-[#35556a] leading-relaxed max-w-xl mx-auto">
          המטרה היא לאסוף כדורים בצבעים זהים ולצבור 5 נקודות. לאחר שתצבור 5
          נקודות, הקואורדינטות ייחשפו.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        <RuleCard title="מבנה הלוח" icon="▦">
          <ul className="list-disc pr-5 space-y-1">
            <li>הלוח כולל 7 שורות ו-7 עמודות.</li>
            <li>על הלוח נמצאים 48 כדורים.</li>
            <li>קיימים שישה צבעים שונים.</li>
            <li>מכל צבע יש בדיוק 8 כדורים.</li>
            <li>המשבצת המרכזית מתחילה ריקה.</li>
            <li>
              בתחילת המשחק אין שני כדורים מאותו צבע הצמודים אופקית או אנכית.
            </li>
            <li>הצמדה אלכסונית אינה נחשבת.</li>
          </ul>
        </RuleCard>

        <RuleCard title="כיצד מזיזים" icon="↔">
          <ul className="list-disc pr-5 space-y-1">
            <li>גוררים כדור ימינה או שמאלה כדי לדחוף את כל השורה שלו.</li>
            <li>גוררים כדור למעלה או למטה כדי לדחוף את כל העמודה שלו.</li>
            <li>כל הכדורים בשורה או בעמודה נדחסים עד לקצה שנבחר.</li>
            <li>המשבצות הריקות נשארות בצד הנגדי.</li>
            <li>לא מזיזים כדור בודד בלבד.</li>
            <li>
              מהלך רגיל חוקי רק כאשר הוא יוצר לפחות שני כדורים מאותו צבע
              הצמודים אופקית או אנכית.
            </li>
          </ul>
          <p className="pt-1 font-semibold text-[#12324a]">בלי גרירה:</p>
          <ul className="list-disc pr-5 space-y-1">
            <li>לחיצה על כדור תבחר אותו.</li>
            <li>לאחר הבחירה יוצגו ארבעה כפתורי חצים.</li>
            <li>חץ ימינה או שמאלה ידחוף את השורה.</li>
            <li>חץ למעלה או למטה ידחוף את העמודה.</li>
          </ul>
        </RuleCard>

        <RuleCard title="איסוף כדורים" icon="●">
          <ul className="list-disc pr-5 space-y-1">
            <li>
              כאשר מהלך יוצר שני כדורים זהים או יותר המחוברים אופקית או
              אנכית, כל הקבוצה נאספת.
            </li>
            <li>חיבור אלכסוני בלבד אינו מספיק.</li>
            <li>
              קבוצה יכולה להיות קו, צורת L או כל צורה אחרת המחוברת דרך צלעות
              המשבצות.
            </li>
            <li>
              אם נוצרות באותו מהלך כמה קבוצות חוקיות, כל הקבוצות נאספות יחד.
            </li>
            <li>
              הכדורים שנאספו נעלמים מהלוח ונוספים למונה הצבע שלהם.
            </li>
          </ul>
        </RuleCard>

        <RuleCard title="חישוב הנקודות" icon="★">
          <ul className="list-disc pr-5 space-y-1">
            <li>
              עבור כל שלושה כדורים שנאספו מאותו צבע מתקבלת נקודה אחת.
            </li>
            <li>הניקוד מחושב בנפרד לכל צבע.</li>
            <li>כדורים עודפים נשמרים להמשך.</li>
          </ul>
          <ul className="mt-2 rounded-xl bg-[#eef6fb] p-3 space-y-1">
            <li>2 כדורים כחולים = 0 נקודות</li>
            <li>3 כדורים כחולים = נקודה אחת</li>
            <li>5 כדורים כחולים = נקודה אחת ושני כדורים עודפים</li>
            <li>6 כדורים כחולים = 2 נקודות</li>
          </ul>
        </RuleCard>

        <RuleCard title="מצב שני מהלכים" icon="2">
          <p>
            אם אין שום מהלך שיכול ליצור מיד זוג כדורים זהים, המשחק יאפשר מהלך
            הכנה ולאחריו מהלך נוסף. המהלך השני חייב ליצור קבוצה חוקית.
          </p>
        </RuleCard>

        <RuleCard title="סיום המשחק" icon="✓">
          <ul className="list-disc pr-5 space-y-1">
            <li>
              המשחק מסתיים בהצלחה כאשר השחקן מגיע ל-5 נקודות.
            </li>
            <li>
              אם לא ניתן ליצור קבוצה גם באמצעות שני מהלכים רצופים, המשחק
              מסתיים ללא הצלחה וניתן להתחיל לוח חדש.
            </li>
          </ul>
        </RuleCard>
      </div>

      {error && (
        <div
          className="mt-6 rounded-xl border border-red-200 bg-red-50 text-red-800 px-4 py-3 text-sm"
          role="alert"
        >
          <p>{error}</p>
          {onRetry && (
            <button
              type="button"
              className="mt-2 font-semibold underline"
              onClick={onRetry}
            >
              נסה שוב
            </button>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          type="button"
          onClick={onStart}
          disabled={loading}
          className="rounded-2xl bg-[#c45c26] hover:bg-[#a84c1f] text-white text-lg font-bold px-10 py-4 shadow-lg disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0a202]"
        >
          {loading ? "יוצר לוח..." : "התחל משחק"}
        </button>
      </div>
    </div>
  );
}
