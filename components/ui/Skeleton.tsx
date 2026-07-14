export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg bg-surface-sub ${className}`} />;
}

export function ListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="aspect-square w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-3/5" />
        </div>
      ))}
    </div>
  );
}

export function RowsSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-20 w-full" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="aspect-video w-full" />
      <Skeleton className="h-7 w-4/5" />
      <Skeleton className="h-4 w-2/5" />
      <div className="space-y-2 pt-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Loading fallback for member-area sub-pages: mirrors the WorkspacePageHeader
// card + a content card so navigation shows an instant, on-brand skeleton
// (dynamic routes without loading.tsx feel like "the app is not responding").
export function WorkspacePageSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-5">
      <div className="rounded-[1.5rem] border border-line/70 bg-white px-5 py-5 shadow-(--shadow-card) sm:px-7 sm:py-6">
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-2.5 h-4 w-72 max-w-full" />
      </div>
      <div className="rounded-[1.5rem] border border-line/70 bg-white p-4 shadow-(--shadow-card) sm:p-5">
        <div className="space-y-3">
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function EditSkeleton() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-8 w-52" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
      <div className="flex justify-end gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}
