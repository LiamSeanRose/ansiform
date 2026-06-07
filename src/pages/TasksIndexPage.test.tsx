import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/I18nProvider';
import { TasksIndexPage } from './TasksIndexPage';
import { listTaskSummaries } from '../tasks/registry';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

function mount(): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(
      <I18nProvider>
        <MemoryRouter>
          <TasksIndexPage />
        </MemoryRouter>
      </I18nProvider>,
    );
  });
  return container;
}

function typeSearch(el: HTMLElement, value: string) {
  const input = el.querySelector<HTMLInputElement>('.tasks-index__search input')!;
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
  act(() => input.dispatchEvent(new Event('input', { bubbles: true })));
}

const linkFor = (el: HTMLElement, slug: string) => el.querySelector(`a[href="/tasks/${slug}"]`);

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe('TasksIndexPage', () => {
  it('links every registered task, grouped under function headings', () => {
    const el = mount();
    expect(el.querySelector('h1')!.textContent).toBe('Task library');
    for (const { slug } of listTaskSummaries()) {
      expect(linkFor(el, slug), slug).not.toBeNull();
    }
    const headings = [...el.querySelectorAll('.tasks-index__group h2')].map((h) => h.textContent);
    expect(headings).toContain('Routing');
    expect(headings).toContain('Management & hardening');
  });

  it('shows the vendors a task renders as badges', () => {
    const el = mount();
    const card = linkFor(el, 'interface-ip')!.closest('.task-list__item')!;
    const badges = [...card.querySelectorAll('.tasks-index__badge')].map((b) => b.textContent);
    expect(badges).toContain('Cisco IOS');
    // interface-ip renders the full line-CLI family, so more than one badge.
    expect(badges.length).toBeGreaterThan(1);
  });

  it('filters live, narrowing the list and the result count', () => {
    const el = mount();
    const total = listTaskSummaries().length;
    expect(el.querySelector('.tasks-index__count')!.textContent).toBe(`${total} task(s)`);

    typeSearch(el, 'ospf');
    expect(linkFor(el, 'ospf')).not.toBeNull();
    expect(linkFor(el, 'interface-ip')).toBeNull();
    expect(el.querySelector('.tasks-index__count')!.textContent).not.toBe(`${total} task(s)`);
  });

  it('shows an empty state when nothing matches', () => {
    const el = mount();
    typeSearch(el, 'zzz-no-such-task-zzz');
    expect(el.querySelector('.tasks-index__count')!.textContent).toBe('0 task(s)');
    expect(el.querySelectorAll('.task-list__item')).toHaveLength(0);
    expect(el.querySelector('.muted')!.textContent).toBe('No tasks match your search.');
  });
});
