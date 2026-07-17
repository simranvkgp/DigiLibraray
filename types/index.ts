// Central type definitions mirrored from the Prisma schema's string-union
// "enums" (kept as strings in the DB so SQLite -> PostgreSQL needs no change).

export type Role = "USER" | "ADMIN" | "SUPER_ADMIN";

export type ApprovalStatus =
  | "INCOMPLETE" // registered via Google, hasn't filled the registration form
  | "PENDING" // registration form submitted, awaiting admin review
  | "APPROVED"
  | "REJECTED"
  | "SUSPENDED";

export type BookFileType = "PDF" | "ZIP" | "HTML" | "FLIPBOOK" | "SCORM";
export type BookStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED" | "HIDDEN";
export type ApprovalAction = "APPROVE" | "REJECT" | "SUSPEND" | "REACTIVATE" | "DELETE";
export type NotificationType = "ANNOUNCEMENT" | "NEW_BOOK" | "MAINTENANCE";

export interface DriveLinkParts {
  fileId: string;
  previewUrl: string;
  downloadUrl: string;
}

export interface SessionUserShape {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  role: Role;
  approvalStatus: ApprovalStatus;
  categoryId?: string | null;
  categoryLocked: boolean;
  boardId?: string | null;
}

export interface BookCardData {
  id: string;
  title: string;
  subject: string;
  className: string | null;
  description: string | null;
  version: string;
  boardName: string;
  categoryName: string;
  coverImageUrl: string | null;
  thumbnailUrl: string | null;
  fileType: BookFileType;
  pageCount: number | null;
  readingTimeMinutes: number | null;
  isBookmarked?: boolean;
  isFavorite?: boolean;
}
