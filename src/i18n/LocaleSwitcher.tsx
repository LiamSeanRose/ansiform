/**
 * Language switcher (issue #16).
 *
 * A small group of native <button>s — inherently keyboard-operable (Tab to
 * focus, Enter/Space to activate) — one per supported locale, with `aria-pressed`
 * marking the active one and a `role="group"` label for assistive tech. Choosing
 * a locale calls `setLocale`, which re-renders the app and (via `I18nProvider`)
 * updates `<html lang>` (§6).
 *
 * Locale is an in-memory UI preference: it is not written to the URL or storage
 * (route-prefix + hreflang SEO is a deliberate future enhancement, not v1).
 */
import { useTranslation } from './useTranslation';
import { SUPPORTED_LOCALES, LOCALE_LABELS } from './index';

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="locale-switcher" role="group" aria-label={t('nav.language')}>
      {SUPPORTED_LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          className="locale-switcher__option"
          lang={loc}
          aria-pressed={loc === locale}
          onClick={() => setLocale(loc)}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  );
}
