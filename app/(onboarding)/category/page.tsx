import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryPicker } from "@/components/onboarding/CategoryPicker";
import { getUserLanguage } from "@/lib/i18n/get-user-language";
import { translate } from "@/lib/i18n/translate";

// Secondary and Senior Secondary are a switchable group; University is a
// separate, permanent group. Keep in sync with app/api/category/route.ts.
const SWITCHABLE_SLUGS = ["secondary", "senior-secondary"];

export default async function CategoryPage() {
  let categories = await prisma.category.findMany({ orderBy: { order: "asc" } });

  // Seed sensible defaults on first run so the page is never empty.
  if (categories.length === 0) {
    await prisma.category.createMany({
      data: [
        { name: "Secondary", slug: "secondary", order: 0 },
        { name: "Senior Secondary", slug: "senior-secondary", order: 1 },
        { name: "University", slug: "university", order: 2 },
      ],
    });
    categories = await prisma.category.findMany({ orderBy: { order: "asc" } });
  }

  const session = await auth();
  const user = session?.user
    ? await prisma.user.findUnique({
        where: { id: (session.user as any).id },
        include: { category: true },
      })
    : null;

  const currentSlug = user?.category?.slug;
  const isSealed = user?.categoryLocked && !(currentSlug && SWITCHABLE_SLUGS.includes(currentSlug));

  const lang = await getUserLanguage(session?.user ? (session.user as any).id : undefined);
  const t = (key: string) => translate(lang, key);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <h1 className="text-center font-display text-2xl font-semibold text-navy">
          {user?.categoryLocked ? t("category.changeTitle") : t("category.chooseTitle")}
        </h1>
        <p className="mx-auto mt-2 max-w-md text-center text-sm text-text-secondary">
          {isSealed
            ? t("category.sealedNote")
            : user?.categoryLocked
              ? t("category.switchableNote")
              : t("category.chooseNote")}
        </p>
        <div className="mt-8">
          <CategoryPicker
            categories={categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug }))}
            currentCategoryId={user?.categoryId ?? null}
            isSealed={!!isSealed}
            lang={lang}
          />
        </div>
      </div>
    </div>
  );
}
