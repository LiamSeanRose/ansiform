/**
 * Dependency-free React render helpers for the form tests (issue #4).
 *
 * The project deliberately avoids extra runtime/test dependencies (the i18n
 * scaffold is dependency-free by design), so component tests drive React 19's
 * own `act` + `react-dom/client` instead of pulling in a testing library. This
 * file is test-only; nothing in the app imports it, so it is tree-shaken out of
 * the production bundle.
 */
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// React's `act` requires this flag to be set in a non-browser environment.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

export interface Mounted {
  container: HTMLElement;
  unmount: () => void;
  rerender: (el: ReactElement) => void;
}

export function mount(el: ReactElement): Mounted {
  const container = document.createElement('div');
  document.body.appendChild(container);
  let root!: Root;
  act(() => {
    root = createRoot(container);
    root.render(el);
  });
  return {
    container,
    rerender(next: ReactElement) {
      act(() => {
        root.render(next);
      });
    },
    unmount() {
      act(() => {
        root.unmount();
      });
      container.remove();
    },
  };
}

/** Set a controlled input/select value the way React expects (native setter). */
export function setValue(el: HTMLInputElement | HTMLSelectElement, value: string) {
  const proto = Object.getPrototypeOf(el) as object;
  const desc = Object.getOwnPropertyDescriptor(proto, 'value');
  desc?.set?.call(el, value);
  act(() => {
    // React listens to `input` for text controls and `change` for <select>.
    const type = el.tagName === 'SELECT' ? 'change' : 'input';
    el.dispatchEvent(new Event(type, { bubbles: true }));
  });
}

/** Find the `<label>` programmatically associated with a control, if any. */
export function labelFor(root: ParentNode, control: Element): HTMLLabelElement | null {
  for (const label of root.querySelectorAll('label')) {
    if (label.htmlFor === control.id) return label;
  }
  return null;
}

/** Activate an element (button, checkbox) via a real bubbling click. */
export function click(el: HTMLElement) {
  act(() => {
    el.click();
  });
}

/** Submit a form, triggering React's `onSubmit`. */
export function submit(form: HTMLFormElement) {
  act(() => {
    form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
  });
}

/** Find a control by its `name` attribute within a container. */
export function byName<T extends Element = HTMLElement>(root: ParentNode, name: string): T {
  const el = root.querySelector<T>(`[name="${name}"]`);
  if (!el) throw new Error(`No control with name="${name}"`);
  return el;
}
