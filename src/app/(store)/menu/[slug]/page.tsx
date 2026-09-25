import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ItemDetail } from "@/components/menu/ItemDetail";
import { MenuCard } from "@/components/menu/MenuCard";
import { ArrowIcon } from "@/components/ui/icons";
import { getCategories, getItemBySlug, getItemsByCategory } from "@/lib/data/menu";
import { pick } from "@/lib/i18n/config";
import { getI18n } from "@/lib/i18n/server";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const [{ locale }, item] = await Promise.all([getI18n(), getItemBySlug(slug)]);
  if (!item) return {};
  return {
    title: pick(item, "name", locale),
    description: pick(item, "description", locale),
    openGraph: item.imageUrl ? { images: [item.imageUrl] } : undefined,
  };
}

export default async function ItemPage({ params }: Props) {
  const { slug } = await params;
  const [{ locale, t }, item, categories] = await Promise.all([getI18n(), getItemBySlug(slug), getCategories()]);
  if (!item) notFound();
  const category = categories.find((c) => c.id === item.categoryId);
  const related = await getItemsByCategory(item.categoryId, item.id, 4);

  return (
    <div className="container-page py-6 sm:py-10">
      <Link href={category ? `/menu?category=${category.slug}` : "/menu"} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowIcon size={16} className="rotate-180" /> {t.menu.backToMenu}
      </Link>
      <ItemDetail item={item} categoryName={category ? pick(category, "name", locale) : undefined} />
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="heading-md">{t.menu.youMayLike}</h2>
          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {related.map((r) => <MenuCard key={r.id} item={r} />)}
          </div>
        </section>
      )}
    </div>
  );
}
