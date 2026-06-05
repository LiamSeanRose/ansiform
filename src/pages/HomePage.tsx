import { useTranslation } from '../i18n/useTranslation';

export function HomePage() {
  const { t } = useTranslation();

  return (
    <section className="page" aria-labelledby="home-title">
      <h1 id="home-title">{t('home.title')}</h1>
      <p className="lede">{t('home.lede')}</p>

      <h2>{t('home.tasksHeading')}</h2>
      {/* The curated task library (council §3) is built in a later step. */}
      <p className="muted">{t('home.tasksEmpty')}</p>
    </section>
  );
}
