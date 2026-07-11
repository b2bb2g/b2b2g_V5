export function DefaultAvatar({
  className = "h-12 w-12",
  editable = false,
}: {
  className?: string;
  editable?: boolean;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 items-center justify-center rounded-full border border-[#cfd3d7] bg-[#e7e8e9] ${className}`}
      aria-hidden="true"
    >
      <svg viewBox="0 0 64 64" className="h-[72%] w-[72%] fill-white">
        <circle cx="32" cy="23" r="12" />
        <path d="M12 58c1.7-15 9-22 20-22s18.3 7 20 22H12Z" />
      </svg>
      {editable && (
        <span className="absolute -bottom-1 -right-1 flex h-[38%] w-[38%] min-h-7 min-w-7 items-center justify-center rounded-full border-2 border-white bg-white text-[#6c7176] shadow-sm">
          <svg viewBox="0 0 24 24" className="h-[58%] w-[58%] fill-current">
            <path d="m19.14 12.94.04-.94-.04-.94 2.03-1.58-1.92-3.32-2.39.96a7.7 7.7 0 0 0-1.63-.95L14.87 3h-3.84l-.36 3.17c-.58.24-1.13.56-1.63.95l-2.39-.96-1.92 3.32 2.03 1.58-.04.94.04.94-2.03 1.58 1.92 3.32 2.39-.96c.5.39 1.05.71 1.63.95l.36 3.17h3.84l.36-3.17c.58-.24 1.13-.56 1.63-.95l2.39.96 1.92-3.32-2.03-1.58ZM12.95 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z" />
          </svg>
        </span>
      )}
    </span>
  );
}
