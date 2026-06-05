import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <section className="page" aria-labelledby="notfound-title">
      <h1 id="notfound-title">{t('notFound.title')}</h1>
      <p className="muted">{t('notFound.body')}</p>
      <p>
        <Link to="/">{t('notFound.backHome')}</Link>
      </p>
    </section>
  );
}
