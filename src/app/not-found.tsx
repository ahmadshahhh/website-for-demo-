import Link from "next/link";
import { LogoMark } from "@/components/ui/Logo";
import { getI18n } from "@/lib/i18n/server";

export default async function NotFound() {
  const { t } = await getI18n();
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <LogoMark size={64} />
      <h1 className="heading-lg mt-6">{t.notFound.title}</h1>
      <p className="mt-2 text-muted">{t.notFound.body}</p>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-saffron-400 px-5 font-semibold text-ink hover:bg-saffron-300">{t.notFound.home}</Link>
    </div>
  );
}
