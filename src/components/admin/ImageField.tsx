"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/components/providers/I18nProvider";
import { FoodImage } from "@/components/ui/FoodImage";
import { ImageIcon, TrashIcon } from "@/components/ui/icons";

/**
 * Upload (file) or paste a URL, with live preview. Posts as
 * <name>File, <name>Url and <name>Remove form fields.
 */
export function ImageField({ name, label, current, error }: { name: string; label: string; current: string | null; error?: string }) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<string | null>(current);
  const [removed, setRemoved] = useState(false);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  useEffect(() => () => {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  return (
    <div>
      <p className="mb-1.5 text-sm font-semibold text-ink-soft">{label}</p>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative w-full overflow-hidden rounded-2xl border border-line bg-sand sm:w-56">
          {preview && !removed ? (
            <FoodImage src={preview} alt="" className="aspect-[4/3] w-full" />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-muted"><ImageIcon size={36} /></div>
          )}
        </div>
        <div className="flex-1 space-y-3">
          <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-cream hover:bg-ink-soft">
            <ImageIcon size={17} /> {t.admin.menu.upload}
            <input
              type="file"
              name={`${name}File`}
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const u = URL.createObjectURL(f);
                setObjectUrl(u);
                setPreview(u);
                setRemoved(false);
              }}
            />
          </label>
          <p className="text-xs text-muted">{t.admin.menu.uploadHint}</p>
          <input
            name={`${name}Url`}
            placeholder={t.admin.menu.imageUrl}
            dir="ltr"
            onChange={(e) => {
              if (e.target.value) {
                setPreview(e.target.value);
                setRemoved(false);
              }
            }}
            className="h-10 w-full rounded-xl border border-line-strong bg-white px-3 text-sm outline-none focus:border-saffron-500"
          />
          {current && (
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-pomegranate-600">
              <input type="checkbox" name={`${name}Remove`} value="1" checked={removed} onChange={(e) => setRemoved(e.target.checked)} className="accent-pomegranate-600" />
              <TrashIcon size={15} /> {t.admin.menu.removeImage}
            </label>
          )}
          {error && <p role="alert" className="text-sm font-semibold text-pomegranate-600">{t.admin.menu.badImage}</p>}
        </div>
      </div>
    </div>
  );
}
