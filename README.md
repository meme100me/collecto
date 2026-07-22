# קולקטו - אתגר הקואורדינטות

אפליקציית ווב לשחקן יחיד המבוססת על משחק הכדורים קולקטו. השחקן צובר 5 נקודות לפי חוקי המשחק, ואז השרת חושף קואורדינטות ששמורות רק בצד השרת.

## טכנולוגיות

- Next.js (App Router)
- TypeScript (strict)
- React
- Tailwind CSS
- Route Handlers
- Vitest
- ESLint

## התקנה

```bash
npm install
```

## הגדרת סביבה

1. העתיקו את קובץ הדוגמה:

```bash
cp .env.example .env.local
```

2. ערכו את `.env.local`:

```env
CACHE_COORDINATES="N 12° 34.567 E 012° 34.567"
GAME_STATE_SECRET="הדביקו-כאן-סוד-ארוך-ואקראי"
```

### היכן להכניס את הקואורדינטות

הכניסו את הקואורדינטות האמיתיות **רק** למשתנה `CACHE_COORDINATES` בקובץ `.env.local` (או בהגדרות הסביבה של שרת הפריסה).

### אזהרה חשובה

**אל תשתמשו** במשתנה שמתחיל ב-`NEXT_PUBLIC_` עבור הקואורדינטות. משתנים כאלה נשלחים לדפדפן וכל משתמש יכול לקרוא אותם.

גם אל תשמרו קואורדינטות ב:

- רכיבי React
- קוד JavaScript של הלקוח
- Local Storage / Session Storage
- README
- בדיקות שמגיעות ללקוח

## הרצה מקומית

```bash
npm run dev
```

פתחו את [http://localhost:3000](http://localhost:3000).

## בדיקות

```bash
npm run test
```

## Lint

```bash
npm run lint
```

## Build

```bash
npm run build
```

## State Token חתום

מכיוון שאין מסד נתונים בשלב זה, מצב המשחק נשמר ב-token חתום:

1. מצב המשחק מומר ל-JSON
2. מקודד ב-Base64URL
3. נחתם ב-HMAC SHA-256 עם `GAME_STATE_SECRET`
4. הלקוח שולח את ה-token בכל מהלך
5. השרת מאמת את החתימה עם `timingSafeEqual`, מריץ את המהלך בעצמו ומחשב ניקוד

ה-token **אינו** מכיל את הקואורדינטות. הקואורדינטות מוחזרות רק בתגובת מהלך מנצח מאומתת (ניקוד ≥ 5).

## פריסה ב-Vercel

1. חברו את המאגר ל-Vercel.
2. הגדירו משתני סביבה:
   - `CACHE_COORDINATES`
   - `GAME_STATE_SECRET`
3. פרסו (`npm run build` רץ אוטומטית).

הפרויקט מתאים לכל סביבה התומכת ב-Next.js.

## החלפת צבעים וטקסטים

- תוויות צבעים בעברית: `src/lib/game/constants.ts` → `COLOR_LABELS_HE`
- צבעי CSS של הכדורים: `COLOR_CSS` באותו קובץ
- טקסטים במסכים: תחת `src/components/`

## שינוי יעד הניקוד

שנו קבוע יחיד בקובץ `src/lib/game/constants.ts`:

```ts
export const POINT_TARGET = 5;
```

כל מסכי המשחק, השרת והניקוד משתמשים בקבוע זה.

## מבנה מרכזי

```text
src/
  app/                  # עמודים ו-API
  components/           # ממשק משתמש
  lib/game/             # לוגיקת משחק טהורה
  lib/server/           # token, ולידציה, env
  tests/                # בדיקות יחידה
```
