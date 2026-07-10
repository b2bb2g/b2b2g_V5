import en from "./locales/en";
import ko from "./locales/ko";
import { DEFAULT_LOCALE, LOCALES, type Locale } from "@/lib/constants";

export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = { en, ko };

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
