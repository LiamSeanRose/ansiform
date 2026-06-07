import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../i18n/I18nProvider';
import { BuildPage } from './BuildPage';

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
          <BuildPage />
        </MemoryRouter>
      </I18nProvider>,
    );
  });
  return container;
}

function setSelect(el: HTMLSelectElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value')!.set!.call(el, value);
  act(() => el.dispatchEvent(new Event('change', { bubbles: true })));
}

function setInput(el: HTMLInputElement, value: string) {
  Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(el, value);
  act(() => el.dispatchEvent(new Event('input', { bubbles: true })));
}

function addTask(el: HTMLElement, slug: string) {
  setSelect(el.querySelector('.build__picker select')!, slug);
  act(() => el.querySelector<HTMLButtonElement>('.build__add')!.click());
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('BuildPage (composition session)', () => {
  it('starts empty and lists the available tasks in the picker', () => {
    const el = mount();
    expect(el.querySelector('h1')!.textContent).toBe('Build a var-file set');
    expect(el.querySelector('.build__instances')).toBeNull();
    const options = [...el.querySelectorAll('.build__picker option')].map((o) => o.textContent);
    expect(options).toContain('Cisco IOS device hardening');
  });

  it('adds a task and composes its var-file (device-hardening needs no required input)', () => {
    const el = mount();
    addTask(el, 'device-hardening');
    // An instance card appears with the task's form + preview.
    expect(el.querySelectorAll('.build__instance')).toHaveLength(1);
    expect(el.querySelector('.build__instance .preview__cli')).not.toBeNull();
    // The composed file appears with the baseline hardening vars.
    const file = el.querySelector('.build__file')!;
    expect(file.querySelector('.build__file-path')!.textContent).toBe('group_vars/all.yml');
    expect(file.querySelector('.build__yaml')!.textContent).toContain(
      'service_password_encryption: true',
    );
  });

  it('surfaces a key collision visibly when two tasks target the same file/keys', () => {
    const el = mount();
    addTask(el, 'device-hardening');
    addTask(el, 'device-hardening'); // same default scope (group_vars/all) + same keys
    const collision = el.querySelector('.build__collision');
    expect(collision).not.toBeNull();
    expect(collision!.getAttribute('role')).toBe('status');
    expect(collision!.textContent).toContain('service_password_encryption');
    // names only — never the values
    expect(collision!.textContent).not.toContain('true');
  });

  it('downloads a composed file as a Blob (never persisted/URL-encoded)', () => {
    const created: Blob[] = [];
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((b: Blob) => {
        created.push(b);
        return 'blob:mock';
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const el = mount();
    addTask(el, 'device-hardening');
    act(() => el.querySelector<HTMLButtonElement>('.build__download')!.click());
    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(Blob);
    expect(created[0].type).toBe('text/yaml');
  });

  it('emits an inventory skeleton once a non-all scope is named (#81)', () => {
    const el = mount();
    addTask(el, 'device-hardening');
    // Default scope is group_vars/all — implicit, so nothing to place yet.
    expect(el.textContent).not.toContain('hosts.ini');
    // Retarget the instance to a host.
    setSelect(el.querySelector('.build__scope select')!, 'host');
    setInput(el.querySelector('.build__scope input')!, 'router1');
    const paths = [...el.querySelectorAll('.build__file-path')].map((p) => p.textContent);
    expect(paths).toContain('hosts.ini');
    const inv = [...el.querySelectorAll('.build__yaml')].find(
      (p) => p.getAttribute('aria-label') === 'hosts.ini',
    );
    expect(inv!.textContent).toContain('router1');
  });

  it('includes the inventory file as a plain-text Blob download (#81)', () => {
    const created: Blob[] = [];
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((b: Blob) => {
        created.push(b);
        return 'blob:mock';
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const el = mount();
    addTask(el, 'device-hardening');
    setSelect(el.querySelector('.build__scope select')!, 'host');
    setInput(el.querySelector('.build__scope input')!, 'router1');
    const invBtn = [...el.querySelectorAll<HTMLButtonElement>('.build__download-all')].find((b) =>
      b.textContent!.includes('inventory'),
    );
    act(() => invBtn!.click());
    expect(created).toHaveLength(1);
    expect(created[0].type).toBe('text/plain');
  });

  it('removes a task from the session', () => {
    const el = mount();
    addTask(el, 'device-hardening');
    expect(el.querySelectorAll('.build__instance')).toHaveLength(1);
    act(() => el.querySelector<HTMLButtonElement>('.build__remove')!.click());
    expect(el.querySelectorAll('.build__instance')).toHaveLength(0);
  });

  it('never writes form state to storage (spine: no persistence)', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem');
    const el = mount();
    addTask(el, 'device-hardening');
    expect(setItem).not.toHaveBeenCalled();
  });
});
