import { z } from "zod";

export const registrationSchema = z.object({
  mobileNumber: z
    .string()
    .trim()
    .regex(/^[0-9]{10}$/, "Enter a valid 10-digit mobile number"),
  institutionName: z.string().trim().min(2, "Institution name is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
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
