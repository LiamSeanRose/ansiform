import { describe, it, expect, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { I18nProvider } from './I18nProvider';
import { LocaleSwitcher } from './LocaleSwitcher';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

function renderSwitcher(): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(
      <I18nProvider>
        <LocaleSwitcher />
      </I18nProvider>,
    );
  });
  return container;
}

const button = (root: HTMLElement, label: string) =>
  [...root.querySelectorAll('button')].find((b) => b.textContent === label) as HTMLButtonElement;

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  document.documentElement.removeAttribute('lang');
});

describe('LocaleSwitcher', () => {
  it('renders a keyboard-operable button per locale in a labelled group', () => {
    const el = renderSwitcher();
    const group = el.querySelector('[role="group"]')!;
    expect(group.getAttribute('aria-label')).toBe('Language');
    const buttons = el.querySelectorAll('button');
    expect(buttons.length).toBe(2); // en, fr
    // Native <button>s are inherently focusable/operable via keyboard.
    buttons.forEach((b) => expect(b.tagName).toBe('BUTTON'));
    expect(button(el, 'English')).toBeTruthy();
    expect(button(el, 'Français')).toBeTruthy();
  });

  it('marks the active locale with aria-pressed (English by default)', () => {
    const el = renderSwitcher();
    expect(button(el, 'English').getAttribute('aria-pressed')).toBe('true');
    expect(button(el, 'Français').getAttribute('aria-pressed')).toBe('false');
  });

  it('switches locale and sets <html lang> when another locale is chosen', () => {
    const el = renderSwitcher();
    // Provider sets the initial lang on mount.
    expect(document.documentElement.lang).toBe('en');

    act(() => {
      button(el, 'Français').click();
    });

    expect(document.documentElement.lang).toBe('fr');
    expect(button(el, 'Français').getAttribute('aria-pressed')).toBe('true');
    expect(button(el, 'English').getAttribute('aria-pressed')).toBe('false');
  });
});
