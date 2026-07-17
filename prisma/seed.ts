import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const categories = await Promise.all(
    [
      { name: "Secondary", slug: "secondary", order: 0 },
      { name: "Senior Secondary", slug: "senior-secondary", order: 1 },
      { name: "University", slug: "university", order: 2 },
    ].map((c) =>
      prisma.category.upsert({ where: { slug: c.slug }, update: {}, create: c })
    )
  );

  const boards = await Promise.all(
    ["CBSE", "ICSE", "Haryana Board", "Punjab Board", "Rajasthan Board", "University", "Others"].map(
      (name, i) =>
        prisma.board.upsert({
          where: { slug: name.toLowerCase().replace(/\s+/g, "-") },
          update: {},
          create: { name, slug: name.toLowerCase().replace(/\s+/g, "-"), order: i },
        })
    )
  );

  // Promote yourself to admin after your first Google sign-in by editing
  // this email, then running `npm run db:seed` again.
  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? "admin@example.com";
  await prisma.user.updateMany({
    where: { email: adminEmail },
    data: { role: "SUPER_ADMIN", approvalStatus: "APPROVED" },
  });

  await prisma.book.upsert({
    where: { id: "sample-book-1" },
    update: {},
    create: {
      id: "sample-book-1",
      title: "Sample NCERT Mathematics",
      subject: "Mathematics",
      className: "Class 10",
      description: "A sample entry showing how a Google-Drive-hosted book renders in the library.",
      categoryId: categories[0].id,
      boardId: boards[0].id,
      driveFileId: "sample-file-id",
      driveShareUrl: "https://drive.google.com/file/d/sample-file-id/view",
      drivePreviewUrl: "https://drive.google.com/file/d/sample-file-id/preview",
      driveDownloadUrl: "https://drive.google.com/uc?export=download&id=sample-file-id",
      fileType: "PDF",
      pageCount: 180,
      readingTimeMinutes: 240,
      status: "PUBLISHED",
    },
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
