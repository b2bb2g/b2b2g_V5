import { Skeleton, ListSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="full-bleed">
      <section className="bg-primary-soft/40">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div className="space-y-5 py-4"><Skeleton className="h-3 w-44" /><Skeleton className="h-14 w-full" /><Skeleton className="h-14 w-4/5" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-14 w-full rounded-2xl" /></div>
          <Skeleton className="aspect-[16/11] w-full rounded-[2rem]" />
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6"><Skeleton className="mb-6 h-8 w-48" /><ListSkeleton count={8} /></section>
    </div>
  );
}
