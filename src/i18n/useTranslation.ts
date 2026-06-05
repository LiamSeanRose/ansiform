import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from './I18nContext';

/** Access the active locale, `setLocale`, and the `t()` translate function. */
export function useTranslation(): I18nContextValue {
  return useContext(I18nContext);
}
