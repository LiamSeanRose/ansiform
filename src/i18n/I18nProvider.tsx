import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { DEFAULT_LOCALE, createTranslator, type Locale } from './index';
import { I18nContext } from './I18nContext';

/**
 * Holds the active locale, exposes `t()`, and keeps `<html lang>` in sync so
 * assistive tech announces content in the right language (council §6).
 */
export function I18nProvider({
  children,
  initialLocale = DEFAULT_LOCALE,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocale] = useState<Locale>(initialLocale);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useMemo(() => createTranslator(locale), [locale]);
  const changeLocale = useCallback((next: Locale) => setLocale(next), []);

  const value = useMemo(
    () => ({ locale, setLocale: changeLocale, t }),
    [locale, changeLocale, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
