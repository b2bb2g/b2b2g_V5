import { ListSkeleton, Skeleton } from "@/components/ui/Skeleton";

// The fallback must occupy roughly a board's height: a short skeleton lets
// the footer paint near the top of the viewport and the arriving content
// then shoves it down (measured CLS 0.74 on phones).
export default function Loading() {
  return (
    <div className="wide min-h-[150dvh] space-y-6 py-10">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-64 w-full rounded-[1.75rem] sm:h-80" />
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-44 w-40 shrink-0 rounded-[1.4rem]" />
        ))}
      </div>
      <Skeleton className="h-8 w-56" />
      <ListSkeleton count={8} />
    </div>
  );
}
