import { Skeleton } from "@/components/ui/Skeleton";

export function LandingPageSkeleton() {
  return (
    <div
      className="full-bleed min-h-screen overflow-hidden bg-[#f5f5f7]"
      aria-busy="true"
    >
      <div className="border-b border-black/[.06] bg-white">
        <div className="store-shell flex h-[72px] items-center justify-between gap-6">
          <Skeleton className="h-5 w-24" />
          <div className="hidden items-center gap-7 md:flex">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-4 w-20" />
            ))}
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>
        </div>
      </div>

      <section className="border-b-[12px] border-white bg-[#edf6ff]">
        <div className="flex min-h-[42rem] flex-col items-center px-5 pt-14 text-center sm:min-h-[48rem] sm:px-8 sm:pt-16 lg:min-h-[min(54rem,calc(100svh-4.5rem))] lg:pt-20">
          <Skeleton className="h-4 w-44 bg-[#1769e0]/12" />
          <Skeleton className="mt-5 h-14 w-[min(84vw,820px)] bg-black/8 sm:h-20" />
          <Skeleton className="mt-3 h-14 w-[min(72vw,700px)] bg-black/8 sm:h-20" />
          <Skeleton className="mt-6 h-6 w-[min(76vw,660px)] bg-black/8" />
          <div className="mt-8 flex gap-3">
            <Skeleton className="h-12 w-36 rounded-full bg-[#1769e0]/14" />
            <Skeleton className="h-12 w-44 rounded-full bg-black/8" />
          </div>
        </div>
      </section>

      <section className="store-shell py-20 sm:py-28">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="mt-5 h-12 w-72" />
        <Skeleton className="mt-5 h-6 w-[min(78vw,720px)]" />
        <div className="mt-12 flex gap-5 overflow-hidden py-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton
              key={index}
              className="h-[500px] w-[400px] shrink-0 rounded-[var(--store-card-radius)]"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
