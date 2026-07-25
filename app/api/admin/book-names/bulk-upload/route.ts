import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  const user = session?.user as any;
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPER_ADMIN")) return null;
  return user;
}

// These catalogs are exported from publisher spreadsheets that vary sheet to
// sheet: column order differs, and the same header text ("Title"/"Author")
// reappears later as a revision-tracking checkbox column. We only search the
// leading columns of the header row, where the core fields always live.
const TITLE_ALIASES = ["titles", "title"];
const CLASS_ALIASES = ["class"];
const MEDIUM_ALIASES = ["medium"];
const AUTHOR_ALIASES = ["author", "authors"];
const UNIVERSITY_ALIASES = ["uni", "university"];
const HEADER_SEARCH_COLUMNS = 8;
const HEADER_SCAN_ROWS = 6;

function normalize(value: unknown): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function findHeaderColumn(headerRow: unknown[], aliases: string[]): number {
  const limit = Math.min(headerRow.length, HEADER_SEARCH_COLUMNS);
  for (let i = 0; i < limit; i++) {
    if (aliases.includes(normalize(headerRow[i]).toLowerCase())) return i;
  }
  return -1;
}

// Each sheet opens with a merged banner row naming the course/university
// (e.g. "B.A./B.Com.(HPU) 2025-26  ANNUAL SYSTEM"). Strip the session/year
// noise so what's left reads as the institution name.
function cleanInstitutionName(raw: string): string {
  let s = raw;
  s = s.replace(/\b(19|20)\d{2}\s*[-–]\s*\d{2,4}\b/g, " ");
  s = s.replace(/\b(19|20)\d{2}\b/g, " ");
  s = s.replace(/\bJune\s*[-–]?\s*July\b/gi, " ");
  s = s.replace(/\bSession\b/gi, " ");
  s = s.replace(/\bAnnual\s*System\b/gi, " ");
  s = s.replace(/\s{2,}/g, " ").trim();
  s = s.replace(/^[-–,\s]+|[-–,\s]+$/g, "");
  return s;
}

function sheetFallbackName(sheetName: string): string {
  return sheetName.replace(/&amp;/gi, "&").replace(/_/g, " ").replace(/\s{2,}/g, " ").trim();
}

interface ParsedRow {
  name: string;
  className: string;
  medium: string;
  author: string;
  institutionName: string;
}

function dedupeKey(name: string, className: string | null, medium: string | null, institutionId: string | null) {
  return [name.toLowerCase(), className?.toLowerCase() ?? "", medium?.toLowerCase() ?? "", institutionId ?? ""].join("|");
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  const categoryId = form.get("categoryId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (typeof categoryId !== "string" || !categoryId) {
    return NextResponse.json({ error: "Pick a category for this import first" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) return NextResponse.json({ error: "That category doesn't exist" }, { status: 400 });

  let workbook: XLSX.WorkBook;
  try {
    const buffer = await file.arrayBuffer();
    workbook = XLSX.read(buffer, { type: "array" });
  } catch {
    return NextResponse.json(
      { error: "Couldn't read that file — make sure it's a valid .xlsx, .xls or .ods file" },
      { status: 400 }
    );
  }

  const parsedRows: ParsedRow[] = [];
  const errors: { row: number; reason: string }[] = [];
  const sheetsSkipped: string[] = [];

  for (const sheetName of workbook.SheetNames) {
    const grid: unknown[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1, defval: "" });
    if (grid.length === 0) continue;

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(grid.length, HEADER_SCAN_ROWS); i++) {
      if (findHeaderColumn(grid[i], TITLE_ALIASES) !== -1) {
        headerRowIdx = i;
        break;
      }
    }
    if (headerRowIdx === -1) {
      sheetsSkipped.push(sheetName);
      continue;
    }

    const headerRow = grid[headerRowIdx];
    const titleCol = findHeaderColumn(headerRow, TITLE_ALIASES);
    const classCol = findHeaderColumn(headerRow, CLASS_ALIASES);
    const mediumCol = findHeaderColumn(headerRow, MEDIUM_ALIASES);
    const authorCol = findHeaderColumn(headerRow, AUTHOR_ALIASES);
    const uniCol = findHeaderColumn(headerRow, UNIVERSITY_ALIASES);

    if (titleCol === -1 || classCol === -1) {
      sheetsSkipped.push(sheetName);
      continue;
    }

    const bannerCell = grid[0].find((c) => normalize(c) !== "");
    const sheetInstitution = cleanInstitutionName(normalize(bannerCell)) || sheetFallbackName(sheetName);

    for (let r = headerRowIdx + 1; r < grid.length; r++) {
      const row = grid[r];
      const title = normalize(row[titleCol]);
      const className = normalize(row[classCol]);
      const author = authorCol !== -1 ? normalize(row[authorCol]) : "";
      const medium = mediumCol !== -1 ? normalize(row[mediumCol]) : "";
      const rowUniversity = uniCol !== -1 ? normalize(row[uniCol]) : "";

      if (!title && !className && !author) continue; // blank filler / section-header row (e.g. "Ist Year")

      if (!title) {
        errors.push({ row: r + 1, reason: `${sheetName}: missing title` });
        continue;
      }

      parsedRows.push({
        name: title,
        className,
        medium,
        author,
        institutionName: rowUniversity || sheetInstitution,
      });
    }
  }

  if (parsedRows.length === 0) {
    return NextResponse.json(
      {
        error:
          sheetsSkipped.length > 0
            ? `Couldn't find any recognizable book rows. Sheets skipped (no Title/Class header found): ${sheetsSkipped.join(", ")}`
            : "That file has no rows",
      },
      { status: 400 }
    );
  }

  // Resolve each row's institution name to an Institution record, creating new
  // ones as needed (same find-or-create pattern used at user registration).
  const institutionCache = new Map<string, string>();
  const existingInstitutions = await prisma.institution.findMany({ select: { id: true, name: true } });
  for (const inst of existingInstitutions) institutionCache.set(inst.name.toLowerCase(), inst.id);

  async function resolveInstitutionId(name: string): Promise<string | null> {
    if (!name) return null;
    const key = name.toLowerCase();
    const cached = institutionCache.get(key);
    if (cached) return cached;
    const created = await prisma.institution.create({ data: { name } });
    institutionCache.set(key, created.id);
    return created.id;
  }

  const existing = await prisma.requestableBookName.findMany({
    where: { categoryId },
    select: { name: true, className: true, medium: true, institutionId: true },
  });
  const existingKeys = new Set(existing.map((e) => dedupeKey(e.name, e.className, e.medium, e.institutionId)));

  const toCreate: {
    name: string;
    className: string | null;
    medium: string | null;
    author: string | null;
    institutionId: string | null;
    categoryId: string;
  }[] = [];
  let skippedDuplicates = 0;

  for (const row of parsedRows) {
    const institutionId = await resolveInstitutionId(row.institutionName);
    const key = dedupeKey(row.name, row.className || null, row.medium || null, institutionId);
    if (existingKeys.has(key)) {
      skippedDuplicates++;
      continue;
    }
    existingKeys.add(key);
    toCreate.push({
      name: row.name,
      className: row.className || null,
      medium: row.medium || null,
      author: row.author || null,
      institutionId,
      categoryId,
    });
  }

  if (toCreate.length > 0) {
    await prisma.requestableBookName.createMany({ data: toCreate, skipDuplicates: true });
  }

  return NextResponse.json({
    created: toCreate.length,
    skippedDuplicates,
    sheetsSkipped,
    errors,
  });
}
