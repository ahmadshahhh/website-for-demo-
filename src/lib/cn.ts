import { extendTailwindMerge } from "tailwind-merge";

const merge = extendTailwindMerge({
  extend: { classGroups: { "font-family": [{ font: ["sans", "display", "arabic"] }] } },
});

/** Join class names; later Tailwind utilities override conflicting earlier ones. */
export function cn(...parts: (string | false | null | undefined)[]) {
  return merge(parts.filter(Boolean).join(" "));
}
