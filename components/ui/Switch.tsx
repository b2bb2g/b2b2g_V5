import type { ButtonHTMLAttributes } from "react";

// The single on/off switch used across the dashboard and admin console. Purely
// presentational (no hooks), so it works both as a client toggle (pass onClick)
// and as a form submit button (pass type="submit"). `checked` reflects the
// current state; `label` is the accessible name (state is announced via
// aria-checked). Matches the marketing-consent toggle design.
type SwitchProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  checked: boolean;
  label: string;
  size?: "sm" | "md";
};

export function Switch({
  checked,
  label,
  size = "md",
  className,
  type,
  ...props
}: SwitchProps) {
  const track = size === "sm" ? "h-5 w-9" : "h-6 w-11";
  const knob =
    size === "sm"
      ? `h-4 w-4 ${checked ? "left-[1.125rem]" : "left-0.5"}`
      : `h-5 w-5 ${checked ? "left-[1.375rem]" : "left-0.5"}`;
  return (
    <button
      type={type ?? "button"}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      {...props}
      className={`relative shrink-0 rounded-full transition-colors disabled:opacity-60 ${track} ${
        checked ? "bg-primary" : "bg-line"
      } ${className ?? ""}`}
    >
      <span
        className={`absolute top-0.5 rounded-full bg-white shadow transition-all ${knob}`}
      />
    </button>
  );
}
