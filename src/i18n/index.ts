/**
 * Minimal, dependency-free i18n scaffold (council §6).
 *
 * Goals for v1: strings are externalized (never hard-coded in components),
 * `<html lang>` switches with the active locale, and adding a locale is just a
 * new catalogue object that satisfies `Messages`. No runtime i18n library is
 * pulled in — that keeps the bundle small and the zero-egress story simple.
 */
import { en, type Messages, type MessageKey } from './locales/en';

export type Locale = 'en';

export const DEFAULT_LOCALE: Locale = 'en';

/** Locale → catalogue. New locales (e.g. `fr`) are registered here. */
export const catalogues: Record<Locale, Messages> = {
  en,
};

/** Locales available in the UI, in display order. */
export const SUPPORTED_LOCALES: Locale[] = ['en'];

export type Translate = (key: MessageKey, vars?: Record<string, string | number>) => string;

/** Build a `t()` function bound to a locale, with `{placeholder}` interpolation. */
export function createTranslator(locale: Locale): Translate {
  const catalogue = catalogues[locale] ?? catalogues[DEFAULT_LOCALE];
  return (key, vars) => {
    const template = catalogue[key] ?? en[key] ?? key;
    if (!vars) return template;
    return template.replace(/\{(\w+)\}/g, (match, name: string) =>
      name in vars ? String(vars[name]) : match,
    );
  };
}

export type { Messages, MessageKey };
