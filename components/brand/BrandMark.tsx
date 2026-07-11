export function BrandMark({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[0.8rem] bg-ink text-white shadow-[0_8px_24px_rgba(25,31,40,0.16)] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 36 36" className="h-full w-full" fill="none">
        <path d="M9 10.5h9.2c4.1 0 6.3 1.9 6.3 4.8 0 1.7-.8 3-2.4 3.9 2.1.7 3.2 2.1 3.2 4.1 0 3.4-2.6 5.2-7.1 5.2H9v-18Z" fill="currentColor" />
        <path d="M14 14.5h4c1.3 0 2 .5 2 1.5s-.7 1.5-2 1.5h-4v-3Zm0 6.8h4.6c1.4 0 2.1.5 2.1 1.6 0 1.1-.7 1.6-2.1 1.6H14v-3.2Z" fill="#3182f6" />
        <circle cx="27.5" cy="8.5" r="2.5" fill="#62a3ff" />
      </svg>
    </span>
  );
}
