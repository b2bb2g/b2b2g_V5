import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-32 w-full rounded-[1.5rem]" />
      <Skeleton className="h-14 w-full rounded-2xl" />
      <div className="grid grid-cols-2 gap-3"><Skeleton className="h-24 w-full" /><Skeleton className="h-24 w-full" /></div>
      <Skeleton className="h-72 w-full rounded-[1.25rem]" />
    </div>
  );
}
