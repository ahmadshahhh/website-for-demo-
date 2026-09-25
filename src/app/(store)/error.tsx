"use client";

import { ErrorView } from "@/components/ErrorView";

export default function StoreError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorView error={error} retry={retry} />;
}
