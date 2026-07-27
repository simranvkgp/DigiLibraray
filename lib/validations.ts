import { z } from "zod";

export const registrationSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  institutionName: z.string().trim().min(2, "Institution name is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  idCardUrl: z.string().min(1, "Please upload your ID card"),
});
export type RegistrationInput = z.infer<typeof registrationSchema>;

export const categorySelectionSchema = z.object({
  categoryId: z.string().min(1, "Choose a category to continue"),
});
export type CategorySelectionInput = z.infer<typeof categorySelectionSchema>;

export const boardSelectionSchema = z.object({
  boardId: z.string().min(1, "Choose a board to continue"),
});

export const bookFormSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  subject: z.string().trim().min(2, "Subject is required"),
  className: z.string().trim().optional(),
  description: z.string().trim().optional(),
  version: z.string().trim().default("1.0"),
  author: z.string().trim().optional(),
  keywords: z.string().trim().optional(),
  categoryId: z.string().min(1, "Category is required"),
  boardId: z.string().min(1, "Board is required"),
  driveShareUrl: z.string().url("Paste a valid Google Drive share link"),
  // Accepts either a pasted absolute URL or the Vercel Blob URL returned by
  // an upload (see app/api/admin/upload/route.ts).
  coverImageUrl: z
    .string()
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Enter a valid URL")
    .optional()
    .or(z.literal("")),
  thumbnailUrl: z
    .string()
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Enter a valid URL")
    .optional()
    .or(z.literal("")),
  fileType: z.enum(["PDF", "ZIP", "HTML", "FLIPBOOK", "SCORM"]),
  pageCount: z.coerce.number().int().positive().optional(),
  readingTimeMinutes: z.coerce.number().int().positive().optional(),
});
export type BookFormInput = z.infer<typeof bookFormSchema>;

export const bookRequestSchema = z.object({
  bookId: z.string().min(1),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
export type BookRequestInput = z.infer<typeof bookRequestSchema>;

export const bookRequestRejectSchema = z.object({
  adminNote: z.string().trim().max(500).optional().or(z.literal("")),
});
export type BookRequestRejectInput = z.infer<typeof bookRequestRejectSchema>;

export const bookSuggestionSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  author: z.string().trim().max(200).optional().or(z.literal("")),
  subject: z.string().trim().max(100).optional().or(z.literal("")),
  className: z.string().trim().max(100).optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});
export type BookSuggestionInput = z.infer<typeof bookSuggestionSchema>;

export const bookSuggestionRejectSchema = z.object({
  adminNote: z.string().trim().max(500).optional().or(z.literal("")),
});
export type BookSuggestionRejectInput = z.infer<typeof bookSuggestionRejectSchema>;
