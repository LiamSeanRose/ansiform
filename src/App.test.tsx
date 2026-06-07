import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from './i18n/I18nProvider';
import { App } from './App';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

function mountAt(path: string): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(
      <I18nProvider>
        <MemoryRouter initialEntries={[path]}>
          <App />
        </MemoryRouter>
      </I18nProvider>,
    );
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

// The dynamic-import resolution is React/framework behaviour proven by the build
// (each route emits its own chunk). What we verify here is that App mounts without
// error and that routes are genuinely code-split — i.e. Suspense shows the loading
// fallback for a lazy route before its chunk resolves.
describe('App route code-splitting (#68)', () => {
  it('mounts the eager shell', () => {
    const el = mountAt('/');
    expect(el.querySelector('.site-header')).not.toBeNull();
    expect(el.querySelector('main#main')).not.toBeNull();
    expect(el.querySelector('.site-nav a[href="/tasks"]')).not.toBeNull();
  });

  it('renders the Suspense fallback while a lazy route loads its chunk', () => {
    const el = mountAt('/build');
    const fallback = el.querySelector('main#main .route-loading');
    expect(fallback).not.toBeNull();
    expect(fallback?.textContent).toBe('Loading…');
  });
});
