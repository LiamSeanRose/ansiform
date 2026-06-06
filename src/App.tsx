import { Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from './i18n/useTranslation';
import { LocaleSwitcher } from './i18n/LocaleSwitcher';
import { HomePage } from './pages/HomePage';
import { TaskPage } from './pages/TaskPage';
import { BuildPage } from './pages/BuildPage';
import { ReferencePage } from './pages/reference';
import { TemplateReaderPage } from './pages/reader';
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
        <nav className="site-nav" aria-label={t('nav.build')}>
          <Link to="/build">{t('nav.build')}</Link>
          <Link to="/reader">{t('nav.reader')}</Link>
        </nav>
        <LocaleSwitcher />
      </header>

      <main id="main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/tasks/:task" element={<TaskPage />} />
          <Route path="/build" element={<BuildPage />} />
          <Route path="/reader" element={<TemplateReaderPage />} />
          <Route path="/reference/:page" element={<ReferencePage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <footer className="site-footer">
        <p>{t('footer.tagline')}</p>
      </footer>
    </>
  );
}
