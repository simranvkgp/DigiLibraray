import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { DriveLinkParts } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Accepts any of the common Google Drive share-link formats an admin might
 * paste, e.g.:
 *   https://drive.google.com/file/d/<FILE_ID>/view?usp=sharing
 *   https://drive.google.com/open?id=<FILE_ID>
 *   https://docs.google.com/document/d/<FILE_ID>/edit
 * and returns the canonical preview/download URLs the reader and admin
 * panel use. Throws with a clear message if the link can't be parsed —
 * the Add Book form surfaces that message inline rather than failing silently.
 */
export function parseDriveLink(shareUrl: string): DriveLinkParts {
  const patterns = [/\/file\/d\/([a-zA-Z0-9_-]+)/, /[?&]id=([a-zA-Z0-9_-]+)/, /\/d\/([a-zA-Z0-9_-]+)/];

  let fileId: string | null = null;
  for (const pattern of patterns) {
    const match = shareUrl.match(pattern);
    if (match) {
      fileId = match[1];
      break;
    }
  }

  if (!fileId) {
    throw new Error(
      "Couldn't extract a file ID from that Google Drive link. Make sure it's a 'Share' link with access set to 'Anyone with the link'."
    );
  }

  return {
    fileId,
    previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
    downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
  };
}

export function formatReadingTime(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const rem = minutes % 60;
  return rem ? `${hrs}h ${rem}m` : `${hrs}h`;
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const diffSec = Math.round((Date.now() - d.getTime()) / 1000);
  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  const diffWeek = Math.round(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek}w ago`;
  return `${Math.round(diffDay / 30)}mo ago`;
}

export function notificationBadgeVariant(type: string): "warning" | "success" | "accent" {
  if (type === "MAINTENANCE") return "warning";
  if (type === "NEW_BOOK") return "success";
  return "accent";
}
