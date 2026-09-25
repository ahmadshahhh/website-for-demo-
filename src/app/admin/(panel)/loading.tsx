import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminLoading() {
  return (
    <div aria-busy="true">
      <Skeleton className="h-9 w-48" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
      </div>
      <Skeleton className="mt-6 h-96 rounded-2xl" />
    </div>
  );
}
