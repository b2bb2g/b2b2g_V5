import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="wide space-y-4">
      <Skeleton className="h-44 w-full rounded-[1.5rem]" />
      <ListSkeleton />
    </div>
  );
}
