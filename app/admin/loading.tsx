import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-16 w-full rounded-2xl" />
      <div className="grid gap-6 lg:grid-cols-[232px_minmax(0,1fr)]"><Skeleton className="hidden h-[34rem] w-full rounded-2xl lg:block" /><div className="space-y-3"><Skeleton className="h-36 w-full rounded-[1.5rem]" /><div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({length:5}).map((_,i)=><Skeleton key={i} className="h-28 w-full" />)}</div></div></div>
    </div>
  );
}
