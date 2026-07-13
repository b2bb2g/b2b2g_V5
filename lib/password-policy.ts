// Supabase Auth accepts this exact symbol set when the strongest hosted
// password requirement is enabled. Keep client guidance and server validation
// aligned so a password never looks valid in the app and then fails in Auth.
export const SUPABASE_PASSWORD_SYMBOLS =
  "!@#$%^&*()_+-=[]{};'\\:\"|<>?,./`~";

export function passwordPolicyChecks(password: string, email: string) {
  const local = (email.split("@")[0] ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const normalizedPassword = password.toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    length: password.length >= 10,
    upper: /[A-Z]/.test(password),
    lower: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    symbol: [...password].some((character) =>
      SUPABASE_PASSWORD_SYMBOLS.includes(character),
    ),
    email: local.length < 4 || !normalizedPassword.includes(local),
  };
}

export function passwordMeetsPolicy(password: string, email: string) {
  return Object.values(passwordPolicyChecks(password, email)).every(Boolean);
}
