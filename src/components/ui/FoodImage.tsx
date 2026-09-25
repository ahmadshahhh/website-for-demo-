"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { LogoMark } from "./Logo";

/**
 * Menu/food image with a branded fallback when the image is missing or fails.
 * Uses a plain <img> so admin-uploaded images and external URLs both work.
 */
export function FoodImage({
  src,
  alt,
  className,
  priority = false,
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const ref = useRef<HTMLImageElement>(null);
  // An image can fail before hydration attaches onError — detect that case too.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) img.dispatchEvent(new Event("error"));
  }, [src]);
  if (!src || failed) {
    return (
      <div className={cn("flex items-center justify-center bg-gradient-to-br from-saffron-100 to-sand-dark", className)} role="img" aria-label={alt}>
        <LogoMark size={56} className="opacity-60" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
