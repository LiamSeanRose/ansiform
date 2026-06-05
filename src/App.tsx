import { Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from './i18n/useTranslation';
import { HomePage } from './pages/HomePage';
import { TaskPage } from './pages/TaskPage';
import { NotFoundPage } from './pages/NotFoundPage';

/**
 * App shell: skip link, header, routed main, footer. The structural landmarks
 * and focus affordances here are the WCAG AA baseline the form engine builds on
 * (council §6).
 */
export function App() {
  const { t } = useTranslation();

  return (
    <>
      <a className="skip-link" href="#main">
        {t('nav.skipToContent')}
      </a>

      <header className="site-header">
        <Link className="brand" to="/">
          {t('app.name')}
        </Link>
        <span className="brand-tagline">{t('app.tagline')}</span>
      </header>

      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks/:task" element={<TaskPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>{t('footer.tagline')}</p>
      </footer>
    </>
  );
}
