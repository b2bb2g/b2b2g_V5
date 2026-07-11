import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-7">
      <Skeleton className="h-52 w-full rounded-[1.5rem]" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-36 w-full rounded-[1.35rem]" />
        <Skeleton className="h-36 w-full rounded-[1.35rem]" />
        <Skeleton className="h-36 w-full rounded-[1.35rem]" />
      </div>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-32 w-full rounded-[1.25rem]" />
        ))}
      </div>
      <Skeleton className="h-72 w-full rounded-[1.5rem]" />
    </div>
  );
}
