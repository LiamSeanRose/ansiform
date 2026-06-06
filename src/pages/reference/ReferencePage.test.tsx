import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '../../i18n/I18nProvider';
import { ReferencePage } from './ReferencePage';
import { mount, type Mounted } from '../../components/form/test-harness';

function at(path: string) {
  return mount(
    <I18nProvider>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/reference/:page" element={<ReferencePage />} />
        </Routes>
      </MemoryRouter>
    </I18nProvider>,
  );
}

let view: Mounted | undefined;
afterEach(() => {
  view?.unmount();
  view = undefined;
});

describe('ReferencePage', () => {
  it('renders H1, lede, a TOC, and section headings for a known page', () => {
    view = at('/reference/ansible-jinja2-filters-cheatsheet');
    const { container } = view;

    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Ansible Jinja2 filters cheatsheet');

    // Table of contents is a labelled nav with one link per section.
    const toc = container.querySelector('nav.reference__toc');
    expect(toc).not.toBeNull();
    expect(toc!.querySelectorAll('a').length).toBeGreaterThan(1);

    // Sections render with h2 headings and stable anchor ids.
    const sections = container.querySelectorAll('section.reference__section');
    expect(sections.length).toBeGreaterThan(1);
    expect(container.querySelector('section#basics h2')?.textContent).toBe('How a filter works');
  });

  it('sets the document title and a canonical link', () => {
    view = at('/reference/ansible-variable-precedence');
    expect(document.title).toBe('Ansible variable precedence, explained · Ansiform');
    const canonical = document.head.querySelector('link[rel="canonical"]');
    expect(canonical?.getAttribute('href')).toBeTruthy();
  });

  it('renders inline code spans from backtick markup', () => {
    view = at('/reference/ansible-jinja2-filters-cheatsheet');
    // The lede references `{{ value | filter }}` in backticks → a <code> element.
    expect(view.container.querySelector('.lede code')).not.toBeNull();
  });

  it('falls through to the 404 page for an unknown slug', () => {
    view = at('/reference/nope');
    expect(view.container.textContent).toContain('Page not found');
    expect(view.container.querySelector('section.reference__section')).toBeNull();
  });
});
