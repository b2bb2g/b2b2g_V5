import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, type Locale } from "@/lib/constants";
import { getDictionary, isLocale, type Dictionary } from "@/lib/i18n";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getT(): Promise<{ t: Dictionary; locale: Locale }> {
  const locale = await getLocale();
  return { t: getDictionary(locale), locale };
}
