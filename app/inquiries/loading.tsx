import { Skeleton } from "@/components/ui/Skeleton";
import { RowsSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-52" />
      <RowsSkeleton count={6} />
    </div>
  );
}
