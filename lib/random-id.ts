// crypto.randomUUID only exists in secure contexts (https/localhost);
// storage filenames need uniqueness, not cryptographic strength, so fall
// back to a timestamped random slug on plain-http dev hosts.
export function randomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
