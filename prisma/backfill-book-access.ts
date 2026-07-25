// One-time script: grandfather in the access users already had under the old
// implicit category/board-match rule, now that all book access requires an
// explicit BookAccessGrant. Run once via `npx tsx prisma/backfill-book-access.ts`
// right after deploying the BookAccessGrant/BookRequest schema, before users
// hit the app — otherwise everyone loses access to books they could already
// open until an admin re-grants them one by one.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    where: { categoryId: { not: null }, boardId: { not: null } },
    select: { id: true, categoryId: true, boardId: true },
  });

  let granted = 0;
  for (const user of users) {
    const books = await prisma.book.findMany({
      where: { status: "PUBLISHED", categoryId: user.categoryId!, boardId: user.boardId! },
      select: { id: true },
    });
    if (books.length === 0) continue;

    const result = await prisma.bookAccessGrant.createMany({
      data: books.map((b) => ({ userId: user.id, bookId: b.id, grantedById: null })),
      skipDuplicates: true,
    });
    granted += result.count;
  }

  console.log(`Backfill complete. Granted ${granted} book access rows across ${users.length} users.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
