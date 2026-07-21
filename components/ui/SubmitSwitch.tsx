"use client";

import { useFormStatus } from "react-dom";
import { Switch } from "@/components/ui/Switch";

// Form-submit variant of Switch for admin server-action toggles: renders the
// switch and disables it while the enclosing form action is pending. `checked`
// is the current server state; the form's hidden `value` carries the flipped
// value the action writes.
export function SubmitSwitch({
  checked,
  label,
  size,
}: {
  checked: boolean;
  label: string;
  size?: "sm" | "md";
}) {
  const { pending } = useFormStatus();
  return (
    <Switch
      type="submit"
      checked={checked}
      label={label}
      size={size}
      disabled={pending}
      aria-busy={pending}
    />
  );
}
