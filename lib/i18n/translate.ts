import { common } from "./dictionaries/common";
import { onboarding } from "./dictionaries/onboarding";
import { user } from "./dictionaries/user";
import { admin } from "./dictionaries/admin";

export type Lang = "en" | "hi";

const dictionaries = [common, onboarding, user, admin];

const translations: Record<Lang, Record<string, string>> = {
  en: Object.assign({}, ...dictionaries.map((d) => d.en)),
  hi: Object.assign({}, ...dictionaries.map((d) => d.hi)),
};

export function translate(lang: Lang, key: string): string {
  return translations[lang]?.[key] ?? translations.en[key] ?? key;
}
