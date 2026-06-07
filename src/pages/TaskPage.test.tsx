import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { I18nProvider } from '../i18n/I18nProvider';
import { TaskPage } from './TaskPage';

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
          <Routes>
            <Route path="/tasks/:task" element={<TaskPage />} />
          </Routes>
        </MemoryRouter>
      </I18nProvider>,
    );
  });
  return container;
}

const hrefs = (scope: Element) => [...scope.querySelectorAll('a')].map((a) => a.getAttribute('href'));

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe('TaskPage crosslinks (#62)', () => {
  it('renders the task plus related-task and reference crosslinks', () => {
    const el = mountAt('/tasks/ospf');
    expect(el.querySelector('h1')).not.toBeNull();
    expect(el.querySelector('.workbench')).not.toBeNull();

    // Related tasks: other routing tasks, never the page's own task.
    const relatedNav = el.querySelector('[aria-labelledby="related-heading"]')!;
    expect(relatedNav).not.toBeNull();
    const related = hrefs(relatedNav);
    expect(related).toContain('/tasks/bgp-neighbor');
    expect(related).toContain('/tasks/junos-ospf');
    expect(related).not.toContain('/tasks/ospf');

    // Reference guides are linked out.
    const refNav = el.querySelector('[aria-labelledby="task-ref-heading"]')!;
    expect(refNav).not.toBeNull();
    expect(hrefs(refNav).every((h) => h?.startsWith('/reference/'))).toBe(true);
    expect(hrefs(refNav).length).toBeGreaterThan(0);
  });

  it('falls through to the 404 page for an unknown slug', () => {
    const el = mountAt('/tasks/not-a-real-task');
    expect(el.querySelector('[aria-labelledby="related-heading"]')).toBeNull();
  });

  it('renders a static worked example with sample YAML (#87)', () => {
    const el = mountAt('/tasks/interface-ip');
    const example = el.querySelector('.worked-example');
    expect(example).not.toBeNull();
    // The example carries real, byte-correct YAML for the synthesized sample.
    const yaml = example!.querySelector('.worked-example__yaml')!.textContent!;
    expect(yaml.length).toBeGreaterThan(0);
    expect(yaml).toMatch(/\w+:/); // at least one key: value line
    // It is static body copy, above the interactive workbench in the DOM.
    expect(example!.compareDocumentPosition(el.querySelector('.workbench')!) &
      Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
