"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { placeOrderAction } from "@/app/actions/checkout";
import { Totals } from "@/components/cart/Totals";
import { useQuote } from "@/components/cart/useQuote";
import { useCart } from "@/components/providers/CartProvider";
import { useI18n } from "@/components/providers/I18nProvider";
import { useToast } from "@/components/providers/ToastProvider";
import { Button, LinkButton } from "@/components/ui/Button";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { FoodImage } from "@/components/ui/FoodImage";
import { BagIcon, CardIcon, CashIcon, PinIcon, ShieldIcon, TruckIcon, UserIcon } from "@/components/ui/icons";
import { Spinner } from "@/components/ui/Spinner";
import type { PublicSettings } from "@/lib/data/settings";
import { fmt, pick } from "@/lib/i18n/config";
import { formatKWD } from "@/lib/money";
import { formatPhone } from "@/lib/phone";
import { cn } from "@/lib/cn";

type Area = { id: number; nameEn: string; nameAr: string };
type Address = {
  id: number;
  label: string;
  areaId: number | null;
  block: string;
  street: string;
  building: string;
  floor: string;
  apartment: string;
  instructions: string;
  isDefault: boolean;
};

const GUEST_KEY = "sy_checkout_guest";

function newKey() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function CheckoutView({
  settings: s,
  areas,
  customer,
  addresses,
}: {
  settings: PublicSettings;
  areas: Area[];
  customer: { name: string; phone: string; email: string } | null;
  addresses: Address[];
}) {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const router = useRouter();
  const { lines, hydrated, clear } = useCart();

  // The cart isn't known until hydration, so nothing depending on this renders on the server.
  const [guest, setGuest] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return sessionStorage.getItem(GUEST_KEY) === "1" || new URLSearchParams(location.search).get("guest") === "1";
    } catch {
      return false;
    }
  });
  const chooseGuest = () => {
    setGuest(true);
    try {
      sessionStorage.setItem(GUEST_KEY, "1");
    } catch {}
  };

  const [orderType, setOrderType] = useState<"delivery" | "pickup">(s.deliveryEnabled ? "delivery" : "pickup");
  const defaultAddr = addresses.find((a) => a.isDefault) ?? addresses[0];
  const [addressId, setAddressId] = useState<number | "new">(defaultAddr?.id ?? "new");
  const [form, setForm] = useState({
    name: customer?.name ?? "",
    phone: customer ? formatPhone(customer.phone).replace("+965 ", "") : "",
    email: customer?.email ?? "",
    areaId: defaultAddr?.areaId ? String(defaultAddr.areaId) : "",
    block: defaultAddr?.block ?? "",
    street: defaultAddr?.street ?? "",
    building: defaultAddr?.building ?? "",
    floor: defaultAddr?.floor ?? "",
    apartment: defaultAddr?.apartment ?? "",
    instructions: defaultAddr?.instructions ?? "",
  });
  const [saveAddress, setSaveAddress] = useState(addresses.length === 0);
  const [payment, setPayment] = useState<"cash" | "online">(s.cashEnabled ? "cash" : "online");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  // One idempotency key per checkout attempt: retries of the same submit reuse it.
  const [idemKey] = useState(newKey);

  const areaId = orderType === "delivery" && form.areaId ? Number(form.areaId) : null;
  const { quote, loading } = useQuote(orderType, areaId);

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((er) => ({ ...er, [k === "areaId" ? "areaId" : k]: "" }));
  };

  const pickAddress = (id: number | "new") => {
    setAddressId(id);
    const a = addresses.find((x) => x.id === id);
    setForm((f) => ({
      ...f,
      areaId: a?.areaId ? String(a.areaId) : "",
      block: a?.block ?? "",
      street: a?.street ?? "",
      building: a?.building ?? "",
      floor: a?.floor ?? "",
      apartment: a?.apartment ?? "",
      instructions: a?.instructions ?? "",
    }));
    setErrors({});
  };

  if (!hydrated) return <div className="flex justify-center py-24 text-muted"><Spinner size={28} /></div>;

  if (lines.length === 0 && !submitting) {
    return (
      <div className="card mx-auto max-w-md p-10 text-center">
        <p className="text-lg font-semibold">{t.checkout.emptyCart}</p>
        <LinkButton href="/menu" className="mt-5">{t.cart.browseMenu}</LinkButton>
      </div>
    );
  }

  // ── Step 1: account or guest ──
  if (!customer && !guest) {
    return (
      <div className="mx-auto max-w-3xl">
        <h2 className="mb-5 text-xl font-bold">{t.checkout.howContinue}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card flex flex-col p-6">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-saffron-100 text-saffron-700"><UserIcon size={24} /></span>
            <h3 className="mt-4 text-lg font-bold">{t.checkout.loginOrSignup}</h3>
            <p className="mt-1.5 flex-1 text-muted">{t.checkout.loginBody}</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <LinkButton href="/login?next=/checkout" variant="dark" className="flex-1">{t.nav.login}</LinkButton>
              <LinkButton href="/signup?next=/checkout" variant="outline" className="flex-1">{t.nav.signup}</LinkButton>
            </div>
          </div>
          <div className="card flex flex-col border-saffron-300 p-6 ring-4 ring-saffron-100">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-pomegranate-50 text-pomegranate-600"><BagIcon size={24} /></span>
            <h3 className="mt-4 text-lg font-bold">{t.checkout.guest}</h3>
            <p className="mt-1.5 flex-1 text-muted">{t.checkout.guestBody}</p>
            <Button className="mt-5 w-full" onClick={chooseGuest}>{t.checkout.guest}</Button>
          </div>
        </div>
      </div>
    );
  }

  const errText = (code?: string) => (code ? (t.checkout.errors as Record<string, string>)[code] ?? t.common.required : undefined);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inFlight.current) return; // hard guard against double submits
    setFormError(null);

    // Quick client-side checks (the server re-validates everything).
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = "name";
    if (form.phone.replace(/\D/g, "").length < 8) errs.phone = "phone";
    if (orderType === "delivery") {
      if (!form.areaId) errs.areaId = "area";
      if (!form.block.trim()) errs.block = "block";
      if (!form.street.trim()) errs.street = "street";
      if (!form.building.trim()) errs.building = "building";
    }
    if (Object.keys(errs).length) {
      setErrors(errs);
      setFormError(t.checkout.fixErrors);
      document.querySelector("[aria-invalid=true]")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    inFlight.current = true;
    setSubmitting(true);
    try {
      const res = await placeOrderAction({
        idempotencyKey: idemKey,
        orderType,
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        areaId,
        block: form.block,
        street: form.street,
        building: form.building,
        floor: form.floor,
        apartment: form.apartment,
        instructions: form.instructions,
        saveAddress: !!customer && orderType === "delivery" && addressId === "new" && saveAddress,
        paymentMethod: payment,
        lines: lines.map((l) => ({ itemId: l.itemId, quantity: l.quantity, optionIds: l.optionIds })),
      });
      if (res.ok) {
        clear();
        try {
          sessionStorage.removeItem(GUEST_KEY);
        } catch {}
        if (/^https?:\/\//.test(res.redirectUrl)) window.location.assign(res.redirectUrl);
        else router.push(res.redirectUrl);
        return; // keep the button locked while navigating
      }
      const map: Record<string, string> = {
        closed: t.checkout.errors.closed,
        deliveryOff: t.checkout.errors.deliveryOff,
        pickupOff: t.checkout.errors.pickupOff,
        paymentOff: t.checkout.errors.paymentOff,
        empty: t.checkout.errors.empty,
        rateLimited: t.common.tooManyAttempts,
        minimum: fmt(t.checkout.errors.minimum, { min: formatKWD(s.minimumOrder, locale) }),
        unavailable: fmt(t.checkout.errors.unavailable, { items: res.items?.join("، ") ?? "" }),
        options: fmt(t.checkout.errors.options, { item: res.items?.join("، ") ?? "" }),
        validation: t.checkout.fixErrors,
        unknown: t.common.somethingWrong,
      };
      if (res.fields) setErrors(res.fields);
      setFormError(map[res.error] ?? t.common.somethingWrong);
      toast(map[res.error] ?? t.common.somethingWrong, "error");
    } catch {
      setFormError(t.common.somethingWrong);
      toast(t.common.somethingWrong, "error");
    }
    inFlight.current = false;
    setSubmitting(false);
  };

  const closed = !s.isOpen;
  const blocked = closed || !quote || quote.hasProblems || (orderType === "delivery" && quote.belowMinimum);

  const typeBtn = (value: "delivery" | "pickup", label: string, Icon: typeof TruckIcon, enabled: boolean, sub: string) => (
    <button
      type="button"
      disabled={!enabled}
      onClick={() => setOrderType(value)}
      aria-pressed={orderType === value}
      className={cn(
        "flex flex-1 items-center gap-3 rounded-2xl border-2 p-4 text-start transition-all",
        orderType === value ? "border-saffron-500 bg-saffron-50" : "border-line bg-white hover:border-line-strong",
        !enabled && "cursor-not-allowed opacity-50",
      )}
    >
      <span className={cn("flex size-11 items-center justify-center rounded-xl", orderType === value ? "bg-saffron-400 text-ink" : "bg-sand text-ink-soft")}>
        <Icon size={22} />
      </span>
      <span>
        <span className="block font-bold">{label}</span>
        <span className="block text-sm text-muted">{sub}</span>
      </span>
    </button>
  );

  const section = "card p-5 sm:p-6";
  const h2 = "mb-4 flex items-center gap-2 text-lg font-bold";

  return (
    <form onSubmit={submit} noValidate className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-8">
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-sand px-4 py-3 text-sm">
          <span className="font-semibold">
            {customer ? fmt(t.checkout.checkingOutAs, { name: customer.name }) : t.checkout.checkingOutGuest}
          </span>
          {!customer && (
            <Link href="/login?next=/checkout" className="font-semibold text-pomegranate-600 hover:underline">{t.checkout.changeGuest}</Link>
          )}
        </div>

        {closed && <p className="rounded-2xl bg-pomegranate-50 p-4 font-semibold text-pomegranate-700">{t.checkout.closed}</p>}

        <section className={section}>
          <h2 className={h2}>{t.checkout.orderType}</h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            {typeBtn("delivery", t.checkout.delivery, TruckIcon, s.deliveryEnabled, `${s.deliveryTimeMin}–${s.deliveryTimeMax} ${t.common.minutes}`)}
            {typeBtn("pickup", t.checkout.pickup, BagIcon, s.pickupEnabled, s.pickupDiscountPercent > 0 ? fmt(t.home.pickupDiscount, { pct: s.pickupDiscountPercent }) : `~${s.pickupTime} ${t.common.minutes}`)}
          </div>
        </section>

        <section className={section}>
          <h2 className={h2}>{t.checkout.contact}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t.checkout.fullName} name="name" autoComplete="name" value={form.name} onChange={set("name")} error={errText(errors.name)} className="sm:col-span-2" />
            <div>
              <label htmlFor="phone" className="mb-1.5 block text-sm font-semibold text-ink-soft">{t.checkout.mobile}</label>
              <div className={cn("flex h-12 overflow-hidden rounded-xl border bg-white focus-within:border-saffron-500 focus-within:ring-4 focus-within:ring-saffron-100", errors.phone ? "border-pomegranate-500" : "border-line-strong")} dir="ltr">
                <span className="flex items-center border-e border-line bg-sand px-3 text-sm font-semibold text-ink-soft">+965</span>
                <input id="phone" name="phone" type="tel" inputMode="tel" autoComplete="tel-national" value={form.phone} onChange={set("phone")} placeholder="5000 1234" aria-invalid={errors.phone ? true : undefined} className="min-w-0 flex-1 px-3 outline-none" />
              </div>
              {errors.phone ? <p role="alert" className="mt-1.5 text-sm font-medium text-pomegranate-600">{errText(errors.phone)}</p> : <p className="mt-1.5 text-xs text-muted">{t.checkout.mobileHint}</p>}
            </div>
            <Input label={t.checkout.email} hint={t.common.optional} name="email" type="email" autoComplete="email" value={form.email} onChange={set("email")} error={errText(errors.email)} />
          </div>
        </section>

        {orderType === "delivery" ? (
          <section className={section}>
            <h2 className={h2}><PinIcon size={20} className="text-pomegranate-600" /> {t.checkout.address}</h2>
            {addresses.length > 0 && (
              <div className="mb-5">
                <p className="mb-2 text-sm font-semibold text-ink-soft">{t.checkout.savedAddresses}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {addresses.map((a) => {
                    const area = areas.find((x) => x.id === a.areaId);
                    return (
                      <label key={a.id} className={cn("flex cursor-pointer gap-3 rounded-xl border-2 p-3", addressId === a.id ? "border-saffron-500 bg-saffron-50" : "border-line")}>
                        <input type="radio" name="savedAddress" checked={addressId === a.id} onChange={() => pickAddress(a.id)} className="mt-1 size-4 accent-saffron-500" />
                        <span className="text-sm">
                          <span className="block font-bold">{a.label}</span>
                          <span className="text-muted">{area ? pick(area, "name", locale) : ""} · {t.checkout.block} {a.block}, {t.checkout.street} {a.street}, {a.building}</span>
                        </span>
                      </label>
                    );
                  })}
                  <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 p-3", addressId === "new" ? "border-saffron-500 bg-saffron-50" : "border-line")}>
                    <input type="radio" name="savedAddress" checked={addressId === "new"} onChange={() => pickAddress("new")} className="size-4 accent-saffron-500" />
                    <span className="text-sm font-bold">+ {t.checkout.newAddress}</span>
                  </label>
                </div>
              </div>
            )}
            <div className="grid gap-4 sm:grid-cols-6">
              <Select label={t.checkout.area} name="areaId" value={form.areaId} onChange={set("areaId")} error={errText(errors.areaId)} className="sm:col-span-6">
                <option value="">{t.checkout.selectArea}</option>
                {areas.map((a) => <option key={a.id} value={a.id}>{pick(a, "name", locale)}</option>)}
              </Select>
              <Input label={t.checkout.block} name="block" value={form.block} onChange={set("block")} error={errText(errors.block)} className="sm:col-span-2" inputMode="numeric" />
              <Input label={t.checkout.street} name="street" value={form.street} onChange={set("street")} error={errText(errors.street)} className="sm:col-span-4" />
              <Input label={t.checkout.building} name="building" value={form.building} onChange={set("building")} error={errText(errors.building)} className="sm:col-span-2" />
              <Input label={t.checkout.floor} hint={t.common.optional} name="floor" value={form.floor} onChange={set("floor")} className="sm:col-span-2" />
              <Input label={t.checkout.apartment} hint={t.common.optional} name="apartment" value={form.apartment} onChange={set("apartment")} className="sm:col-span-2" />
              <Textarea label={t.checkout.instructions} hint={t.common.optional} name="instructions" value={form.instructions} onChange={set("instructions")} placeholder={t.checkout.instructionsPlaceholder} maxLength={300} className="sm:col-span-6" />
            </div>
            {customer && addressId === "new" && (
              <Checkbox className="mt-4" label={t.checkout.saveAddress} checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />
            )}
          </section>
        ) : (
          <section className={section}>
            <h2 className={h2}><BagIcon size={20} className="text-pomegranate-600" /> {t.checkout.pickupFrom}</h2>
            <p className="font-semibold">{pick(s, "name", locale)}</p>
            <p className="text-muted">{pick(s, "address", locale)}</p>
            <p className="mt-2 text-sm text-muted">{fmt(t.checkout.pickupReady, { time: s.pickupTime })}</p>
            <Textarea label={t.checkout.pickupNotes} hint={t.common.optional} name="instructions" value={form.instructions} onChange={set("instructions")} maxLength={300} className="mt-4" />
          </section>
        )}

        <section className={section}>
          <h2 className={h2}>{t.checkout.payment}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { v: "cash" as const, on: s.cashEnabled, Icon: CashIcon, title: orderType === "pickup" ? t.checkout.cashPickup : t.checkout.cash, body: orderType === "pickup" ? t.checkout.cashPickupBody : t.checkout.cashBody },
              { v: "online" as const, on: s.onlinePaymentEnabled, Icon: CardIcon, title: t.checkout.online, body: t.checkout.onlineBody },
            ].map(({ v, on, Icon, title, body }) => (
              <label key={v} className={cn("flex cursor-pointer gap-3 rounded-2xl border-2 p-4", payment === v ? "border-saffron-500 bg-saffron-50" : "border-line bg-white", !on && "cursor-not-allowed opacity-50")}>
                <input type="radio" name="payment" value={v} checked={payment === v} disabled={!on} onChange={() => setPayment(v)} className="mt-1 size-4 accent-saffron-500" />
                <span>
                  <span className="flex items-center gap-2 font-bold"><Icon size={19} /> {title}</span>
                  <span className="mt-1 block text-sm text-muted">{body}</span>
                </span>
              </label>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-1.5 text-xs text-muted"><ShieldIcon size={15} /> {t.checkout.noCardStored}</p>
        </section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-bold">{t.checkout.summary}</h2>
          <ul className="mb-4 max-h-72 space-y-3 overflow-y-auto pe-1">
            {(quote?.lines ?? []).map((l) => (
              <li key={l.key} className="flex items-center gap-3">
                <FoodImage src={l.imageUrl} alt="" className="size-12 shrink-0 rounded-lg" />
                <div className="min-w-0 flex-1 text-sm">
                  <p className="truncate font-semibold"><span className="text-muted">{l.quantity}×</span> {pick(l, "name", locale)}</p>
                  {(locale === "ar" ? l.optionNamesAr : l.optionNamesEn).length > 0 && (
                    <p className="truncate text-xs text-muted">{(locale === "ar" ? l.optionNamesAr : l.optionNamesEn).join(" · ")}</p>
                  )}
                  {l.problem && <p className="text-xs font-semibold text-pomegranate-600">{t.common.unavailable}</p>}
                </div>
                <span className="text-sm font-semibold tabular-nums">{formatKWD(l.lineTotal, locale)}</span>
              </li>
            ))}
          </ul>
          {quote ? (
            <div className={cn("border-t border-line pt-4 transition-opacity", loading && "opacity-60")}>
              <Totals quote={quote} showDelivery={orderType === "delivery"} deliveryNote={orderType === "delivery" && !areaId ? "—" : undefined} />
              {quote.hasProblems && <p className="mt-4 rounded-xl bg-pomegranate-50 p-3 text-sm font-medium text-pomegranate-700">{t.cart.unavailableItems} <Link href="/cart" className="underline">{t.cart.viewCart}</Link></p>}
              {orderType === "delivery" && quote.belowMinimum && (
                <p className="mt-4 rounded-xl bg-saffron-50 p-3 text-sm font-medium text-saffron-700">{fmt(t.cart.minimumOrder, { min: formatKWD(quote.minimumOrder, locale) })}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 py-4 text-muted"><Spinner /> {t.cart.updating}</div>
          )}
          {formError && <p role="alert" className="mt-4 rounded-xl bg-pomegranate-50 p-3 text-sm font-semibold text-pomegranate-700">{formError}</p>}
          <Button type="submit" size="lg" className="mt-5 w-full" loading={submitting} disabled={blocked || submitting}>
            {submitting ? t.checkout.placing : payment === "online" ? t.checkout.payNow : t.checkout.placeOrder}
            {!submitting && quote && <span className="tabular-nums">· {formatKWD(quote.total, locale)}</span>}
          </Button>
          <p className="mt-3 text-center text-xs text-muted">{t.checkout.terms}</p>
        </div>
      </aside>
    </form>
  );
}
