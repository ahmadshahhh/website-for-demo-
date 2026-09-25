"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { LinkButton } from "@/components/ui/Button";
import { CartIcon, CloseIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/cn";

export function Header({ name, logoUrl, isOpen, signedIn }: { name: string; logoUrl: string | null; isOpen: boolean; signedIn: boolean }) {
  const { t } = useI18n();
  const { count, hydrated } = useCart();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [bump, setBump] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile drawer on navigation.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Little bounce on the cart badge when items are added.
  const [lastCount, setLastCount] = useState(count);
  if (lastCount !== count) {
    setLastCount(count);
    if (hydrated && count > lastCount) setBump(true);
  }
  useEffect(() => {
    if (!bump) return;
    const id = setTimeout(() => setBump(false), 400);
    return () => clearTimeout(id);
  }, [bump]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const links = [
    { href: "/menu", label: t.nav.menu },
    { href: "/track", label: t.nav.track },
    { href: "/about", label: t.nav.about },
    { href: "/contact", label: t.nav.contact },
  ];
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-cream/90 backdrop-blur-md transition-shadow no-print",
        scrolled ? "border-line shadow-[0_6px_20px_-14px_rgb(74_45_20/0.45)]" : "border-transparent",
      )}
    >
      <div className="container-page flex h-16 items-center gap-2 sm:gap-3 lg:h-[72px]">
        <button
          className="-ms-2 flex size-10 items-center justify-center rounded-xl text-ink hover:bg-sand lg:hidden"
          onClick={() => setOpen(true)}
          aria-label={t.nav.openMenu}
          aria-expanded={open}
        >
          <MenuIcon size={22} />
        </button>

        <Link href="/" className="shrink-0" aria-label={name}>
          <Logo name={name} logoUrl={logoUrl} size={38} />
        </Link>

        <nav className="ms-6 hidden items-center gap-1 lg:flex" aria-label="Main">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "rounded-lg px-3 py-2 text-[0.95rem] font-semibold transition-colors",
                active(l.href) ? "text-pomegranate-600" : "text-ink-soft hover:bg-sand hover:text-ink",
              )}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-1 sm:gap-1.5">
          <span
            className={cn(
              "me-1 hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold xl:inline-flex",
              isOpen ? "bg-leaf-50 text-leaf" : "bg-pomegranate-50 text-pomegranate-600",
            )}
          >
            <span className={cn("size-2 rounded-full", isOpen ? "bg-leaf" : "bg-pomegranate-500")} />
            {isOpen ? t.status.open : t.status.closed}
          </span>
          <LanguageSwitcher className="hidden md:inline-flex" />
          <LanguageSwitcher variant="compact" className="md:hidden" />
          <Link href="/search" className="flex size-9 items-center sm:size-10 justify-center rounded-xl text-ink hover:bg-sand" aria-label={t.nav.search}>
            <SearchIcon size={21} />
          </Link>
          <Link
            href={signedIn ? "/account" : "/login"}
            className="hidden size-10 items-center justify-center rounded-xl text-ink hover:bg-sand sm:flex"
            aria-label={signedIn ? t.nav.account : t.nav.login}
          >
            <UserIcon size={21} />
          </Link>
          <Link href="/cart" className="relative flex size-9 items-center sm:size-10 justify-center rounded-xl text-ink hover:bg-sand" aria-label={`${t.nav.cart} (${count})`}>
            <CartIcon size={22} />
            {hydrated && count > 0 && (
              <span
                className={cn(
                  "absolute -end-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-pomegranate-600 px-1 text-[0.7rem] font-bold text-white ring-2 ring-cream",
                  bump && "animate-pop",
                )}
              >
                {count}
              </span>
            )}
          </Link>
          <LinkButton href="/menu" size="sm" className="ms-1 hidden h-10 px-4 sm:inline-flex">
            {t.nav.orderNow}
          </LinkButton>
        </div>
      </div>

      {/* Mobile drawer */}
      <div className={cn("fixed inset-0 z-50 overflow-hidden lg:hidden", open ? "visible" : "invisible")} aria-hidden={!open}>
        <div className={cn("absolute inset-0 bg-ink/50 transition-opacity", open ? "opacity-100" : "opacity-0")} onClick={() => setOpen(false)} />
        <div
          className={cn(
            "absolute inset-y-0 start-0 flex w-[86%] max-w-sm flex-col bg-cream shadow-2xl transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full rtl:translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-4">
            <Logo name={name} logoUrl={logoUrl} size={34} />
            <button onClick={() => setOpen(false)} className="flex size-10 items-center justify-center rounded-xl hover:bg-sand" aria-label={t.nav.closeMenu}>
              <CloseIcon size={22} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Mobile">
            {[{ href: "/", label: t.nav.home }, ...links, { href: "/search", label: t.nav.search }].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-xl px-4 py-3 text-lg font-semibold",
                  (l.href === "/" ? pathname === "/" : active(l.href)) ? "bg-saffron-100 text-ink" : "text-ink-soft hover:bg-sand",
                )}
              >
                {l.label}
              </Link>
            ))}
            <div className="my-3 h-px bg-line" />
            {signedIn ? (
              <>
                <Link href="/account" className="rounded-xl px-4 py-3 text-lg font-semibold text-ink-soft hover:bg-sand">{t.nav.account}</Link>
                <Link href="/account/orders" className="rounded-xl px-4 py-3 text-lg font-semibold text-ink-soft hover:bg-sand">{t.nav.orders}</Link>
              </>
            ) : (
              <>
                <Link href="/login" className="rounded-xl px-4 py-3 text-lg font-semibold text-ink-soft hover:bg-sand">{t.nav.login}</Link>
                <Link href="/signup" className="rounded-xl px-4 py-3 text-lg font-semibold text-ink-soft hover:bg-sand">{t.nav.signup}</Link>
              </>
            )}
          </nav>
          <div className="space-y-3 border-t border-line p-4">
            <LanguageSwitcher className="w-full justify-center" />
            <LinkButton href="/menu" className="w-full" size="lg">
              {t.nav.orderNow}
            </LinkButton>
          </div>
        </div>
      </div>
    </header>
  );
}
