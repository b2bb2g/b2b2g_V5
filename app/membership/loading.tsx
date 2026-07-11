import { Skeleton } from "@/components/ui/Skeleton";
import { ListSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="wide space-y-10">
      <Skeleton className="h-72 w-full rounded-[2rem]" />
      <div className="mx-auto max-w-5xl"><Skeleton className="mx-auto mb-8 h-8 w-72" /><ListSkeleton count={2} /></div>
      <Skeleton className="mx-auto h-56 w-full max-w-5xl rounded-[1.5rem]" />
    </div>
  );
}
