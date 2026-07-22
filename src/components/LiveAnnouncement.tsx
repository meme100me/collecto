"use client";

interface LiveAnnouncementProps {
  message: string;
}

export function LiveAnnouncement({ message }: LiveAnnouncementProps) {
  return (
    <div className="sr-only" aria-live="polite" aria-atomic="true">
      {message}
    </div>
  );
}
