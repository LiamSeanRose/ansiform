import { createContext } from 'react';
import { DEFAULT_LOCALE, createTranslator, type Locale, type Translate } from './index';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
}

/**
 * Default context value uses the default locale so `useTranslation()` is safe
 * even outside a provider (e.g. in tests). The provider supplies real state.
 */
export const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: createTranslator(DEFAULT_LOCALE),
});
