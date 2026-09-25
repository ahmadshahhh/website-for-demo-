import { CardGridSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function StoreLoading() {
  return (
    <div className="container-page py-8 sm:py-10">
      <Skeleton className="h-10 w-56" />
      <Skeleton className="mt-3 h-5 w-80 max-w-full" />
      <Skeleton className="mt-8 h-12 w-full rounded-2xl" />
      <div className="mt-8"><CardGridSkeleton /></div>
    </div>
  );
}
