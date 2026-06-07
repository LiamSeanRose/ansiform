import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { Breadcrumbs } from './Breadcrumbs';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

function render() {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(
      <MemoryRouter>
        <Breadcrumbs
          label="Breadcrumb"
          items={[
            { label: 'Home', to: '/' },
            { label: 'Routing', to: '/tasks?category=routing' },
            { label: 'BGP neighbor' },
          ]}
        />
      </MemoryRouter>,
    );
  });
  return container!;
}

describe('Breadcrumbs (#92)', () => {
  it('renders a labelled nav with a link per non-final crumb', () => {
    const el = render();
    const nav = el.querySelector('nav.breadcrumbs')!;
    expect(nav.getAttribute('aria-label')).toBe('Breadcrumb');
    const links = [...el.querySelectorAll('a.breadcrumbs__link')];
    expect(links.map((a) => a.textContent)).toEqual(['Home', 'Routing']);
    expect(links[1].getAttribute('href')).toBe('/tasks?category=routing');
  });

  it('renders the final crumb as the current page, not a link', () => {
    const el = render();
    const current = el.querySelector('.breadcrumbs__current')!;
    expect(current.textContent).toBe('BGP neighbor');
    expect(current.getAttribute('aria-current')).toBe('page');
    expect(current.tagName).toBe('SPAN');
  });
});
