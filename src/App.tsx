import { lazy, Suspense } from 'react';
import { Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from './i18n/useTranslation';
import { LocaleSwitcher } from './i18n/LocaleSwitcher';

// Route-level code-splitting (#68): each page is its own chunk, loaded on demand,
// so the heavy `/reader` parser, `/build` composer, and `/reference` content stay
// out of the initial load and the bundle stops growing as one monolith. Plain
// same-origin dynamic imports — `script-src 'self'` allows them and `connect-src
// 'none'` is untouched (an import is not a network request), so the zero-egress
// spine holds. The pages are named exports, hence the `.then` default mapping.
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const TasksIndexPage = lazy(() =>
  import('./pages/TasksIndexPage').then((m) => ({ default: m.TasksIndexPage })),
);
const TaskPage = lazy(() => import('./pages/TaskPage').then((m) => ({ default: m.TaskPage })));
const BuildPage = lazy(() => import('./pages/BuildPage').then((m) => ({ default: m.BuildPage })));
const ReferencePage = lazy(() =>
  import('./pages/reference').then((m) => ({ default: m.ReferencePage })),
);
const TemplateReaderPage = lazy(() =>
  import('./pages/reader').then((m) => ({ default: m.TemplateReaderPage })),
);
const ArgSpecImportPage = lazy(() =>
  import('./pages/import/ArgSpecImportPage').then((m) => ({ default: m.ArgSpecImportPage })),
);
const NotFoundPage = lazy(() =>
  import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

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
        <nav className="site-nav" aria-label={t('nav.primary')}>
          <Link to="/tasks">{t('nav.tasks')}</Link>
          <Link to="/build">{t('nav.build')}</Link>
          <Link to="/import">{t('nav.import')}</Link>
          <Link to="/reader">{t('nav.reader')}</Link>
        </nav>
        <LocaleSwitcher />
      </header>

      <main id="main">
        <Suspense
          fallback={
            <p className="route-loading" role="status" aria-live="polite">
              {t('app.loading')}
            </p>
          }
        >
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/tasks" element={<TasksIndexPage />} />
            <Route path="/tasks/:task" element={<TaskPage />} />
            <Route path="/build" element={<BuildPage />} />
            <Route path="/reader" element={<TemplateReaderPage />} />
            <Route path="/import" element={<ArgSpecImportPage />} />
            <Route path="/reference/:page" element={<ReferencePage />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </main>

      <footer className="site-footer">
        <p>{t('footer.tagline')}</p>
      </footer>
    </>
  );
}
