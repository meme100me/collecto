import type { Metadata } from "next";
import { Heebo, IBM_Plex_Mono } from "next/font/google";
import {
  MIN_SCORING_COLORS,
  MOVE_LIMIT,
  POINT_TARGET,
} from "@/lib/game/constants";
import "./globals.css";

const heebo = Heebo({
  variable: "--font-heebo",
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "קולקטו - אתגר הקואורדינטות",
  description: `משחק קולקטו לשחקן יחיד: אספו כדורים, צברו ${POINT_TARGET} נקודות מלפחות ${MIN_SCORING_COLORS} צבעים בתוך ${MOVE_LIMIT} ניסיונות, וחשפו את הקואורדינטות.`,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="he"
      dir="rtl"
      className={`${heebo.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-[#12324a]">{children}</body>
    </html>
  );
}
