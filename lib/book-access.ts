import { prisma } from "@/lib/prisma";

type BookForViewer = NonNullable<Awaited<ReturnType<typeof fetchBook>>>;

function fetchBook(bookId: string) {
  return prisma.book.findUnique({
    where: { id: bookId },
    include: { category: true, board: true },
  });
}

export type BookAccessResult =
  | { status: "NOT_FOUND" }
  | { status: "FORBIDDEN"; book: BookForViewer }
  | { status: "OK"; book: BookForViewer };

// Shared by the reader page and the file-streaming API route so the two
// never drift on what counts as "can this user open this book".
export async function getBookForViewer(
  bookId: string,
  userId: string,
  isAdmin: boolean
): Promise<BookAccessResult> {
  const book = await fetchBook(bookId);
  if (!book || book.status === "HIDDEN" || book.status === "DRAFT") {
    return { status: "NOT_FOUND" };
  }

  if (isAdmin) return { status: "OK", book };

  const grant = await prisma.bookAccessGrant.findUnique({
    where: { userId_bookId: { userId, bookId: book.id } },
  });

  return grant ? { status: "OK", book } : { status: "FORBIDDEN", book };
}
