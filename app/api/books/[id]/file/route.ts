import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getBookForViewer } from "@/lib/book-access";

// Google Drive shows an HTML "can't scan this file for viruses" interstitial
// instead of the raw bytes for files it can't quickly scan (common for
// textbook-sized PDFs, >~25MB). The real download link is embedded in that
// page as a `confirm=<token>` query param — this follows it once.
async function fetchDriveFile(downloadUrl: string): Promise<Response> {
  const res = await fetch(downloadUrl);
  const contentType = res.headers.get("content-type") ?? "";
  if (!contentType.includes("text/html")) return res;

  const html = await res.text();
  const match = html.match(/confirm=([0-9A-Za-z_-]+)/);
  if (!match) return res;

  return fetch(`${downloadUrl}&confirm=${match[1]}`);
}

// Streams the PDF bytes for the in-app canvas viewer. Never expose
// book.driveDownloadUrl to the client directly — this route is the only
// place that URL is used, gated by the same access check as the reader page.
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const isAdmin = user.role === "ADMIN" || user.role === "SUPER_ADMIN";
  const result = await getBookForViewer(params.id, user.id, isAdmin);

  if (result.status === "NOT_FOUND") return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (result.status === "FORBIDDEN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (result.book.fileType !== "PDF") return NextResponse.json({ error: "Not a PDF" }, { status: 400 });

  const driveRes = await fetchDriveFile(result.book.driveDownloadUrl);
  if (!driveRes.ok) {
    return NextResponse.json({ error: "Failed to fetch file" }, { status: 502 });
  }

  const bytes = await driveRes.arrayBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": "inline",
      "Cache-Control": "private, no-store",
    },
  });
}
