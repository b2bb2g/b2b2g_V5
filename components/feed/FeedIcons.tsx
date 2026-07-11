type IconProps = { className?: string };

const base = "h-6 w-6 fill-none stroke-current stroke-[1.9]";

export function LikeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7.5 21H4.8A1.8 1.8 0 0 1 3 19.2v-7.4A1.8 1.8 0 0 1 4.8 10h2.7m0 11V10l3.8-7c.5-.9 1.8-.6 1.9.4l.2 3.6h4.9c1.6 0 2.8 1.5 2.4 3l-2 8.2a3.7 3.7 0 0 1-3.6 2.8H7.5Z"
      />
    </svg>
  );
}

export function CommentIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M20.5 11.5a8.5 8.5 0 0 1-8.5 8.5c-1.5 0-3-.4-4.2-1.1L3 20.5l1.6-4.8A8.5 8.5 0 1 1 20.5 11.5Z"
      />
      <path strokeLinecap="round" d="M8 10h8M8 14h5" />
    </svg>
  );
}

export function RepostIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m17 3 4 4-4 4M3 11V9a2 2 0 0 1 2-2h16M7 21l-4-4 4-4m14 0v2a2 2 0 0 1-2 2H3"
      />
    </svg>
  );
}

export function SendIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m3 11.5 18-8-7.5 17-2.6-6.4L3 11.5Z"
      />
      <path strokeLinecap="round" d="m10.9 14.1 4.7-4.7" />
    </svg>
  );
}

export function GlobeIcon({ className = base }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.3 2.5 3.5 5.5 3.5 9S14.3 18.5 12 21c-2.3-2.5-3.5-5.5-3.5-9S9.7 5.5 12 3Z" />
    </svg>
  );
}
