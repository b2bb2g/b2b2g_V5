import { Skeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-4 w-80" />
      <ListSkeleton count={8} />
    </div>
  );
}
