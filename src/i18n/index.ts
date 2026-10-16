/**
 * Languages of the site. DE is the default and lives at the root. EN is prepared (under /en/) but not built yet:
 * add `src/pages/en/index.astro` and "en" blocks in the JSON files when it is wanted.
 */
export const LANGS = [
  { code: 'de', locale: 'de-DE', og: 'de_DE', name: 'Deutsch', short: 'DE' },
  { code: 'en', locale: 'en-US', og: 'en_US', name: 'English', short: 'EN' },
] as const;

export type Lang = (typeof LANGS)[number]['code'];

/** Languages that actually have pages. The language switch only shows these. */
export const LIVE_LANGS: Lang[] = ['de'];

/**
 * Texts of one dictionary file ({ de: {...}, en: {...} }) for one language.
 * Missing keys fall back to German, so a new text shows DE until it is translated.
 */
export function pick<T>(data: Record<string, T>, lang: Lang): T {
  return { ...data.de, ...(data[lang] ?? {}) } as T;
}

export function langInfo(lang: Lang) {
  return LANGS.find((l) => l.code === lang)!;
}

/** Jenomics (the company behind Amaze Genius) was founded in 2001. Computed at build time so the copy never ages. */
export const FOUNDED = 2001;
export const YEARS = new Date().getFullYear() - FOUNDED;

/** Replaces {years}, {founded} and {year} placeholders in a text. */
export function fill(text: string) {
  return text
    .replaceAll('{years}', String(YEARS))
    .replaceAll('{founded}', String(FOUNDED))
    .replaceAll('{year}', String(new Date().getFullYear()));
}
