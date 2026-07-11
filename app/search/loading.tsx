import { Skeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="wide space-y-5">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-11 w-full" />
      <ListSkeleton count={8} />
    </div>
  );
}
