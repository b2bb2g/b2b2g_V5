import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="wide space-y-4">
      <Skeleton className="h-7 w-40" />
      <ListSkeleton />
    </div>
  );
}
