export function MediaPlaceholder({ className = "" }: { className?: string }) {
  return (
    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-soft via-surface-sub to-line/70 ${className}`}>
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-surface/80 text-primary shadow-sm">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="9" cy="9" r="2" />
          <path d="m21 15-4-4a2 2 0 0 0-3 0L6 19" />
        </svg>
      </span>
    </div>
  );
}
