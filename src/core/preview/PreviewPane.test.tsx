import { describe, expect, it, afterEach } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { PreviewPane, type PreviewMessages } from './PreviewPane';
import type { PreviewResult } from './render';

// React's `act` requires this flag outside a browser.
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

function render(el: ReactElement): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(el);
  });
  return container;
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

const messages: PreviewMessages = {
  regionLabel: 'Device CLI preview',
  heading: 'Preview',
  degradedNotice: 'preview may differ — output is still valid',
  empty: 'Fill the form to see the preview.',
};

const result = (over: Partial<PreviewResult>): PreviewResult => ({
  text: '',
  fidelity: 'exact',
  filters: [],
  ...over,
});

describe('PreviewPane', () => {
  it('renders CLI text into the live region', () => {
    const el = render(
      <PreviewPane result={result({ text: 'interface Gig0/1\n shutdown' })} messages={messages} />,
    );
    const pre = el.querySelector('pre')!;
    expect(pre.textContent).toBe('interface Gig0/1\n shutdown');
    expect(pre.getAttribute('aria-live')).toBe('polite');
    expect(pre.getAttribute('aria-label')).toBe('Device CLI preview');
  });

  it('renders untrusted markup as inert text, never as DOM (sandbox)', () => {
    const nasty = '<script>alert(1)</script> & <b>x</b>';
    const el = render(<PreviewPane result={result({ text: nasty })} messages={messages} />);
    const pre = el.querySelector('pre')!;
    // The text round-trips verbatim and creates no child elements.
    expect(pre.textContent).toBe(nasty);
    expect(pre.querySelector('script')).toBeNull();
    expect(pre.querySelector('b')).toBeNull();
    expect(pre.childElementCount).toBe(0);
  });

  it('shows the degradation notice when fidelity is not exact', () => {
    for (const fidelity of ['approximate', 'unsupported'] as const) {
      const el = render(
        <PreviewPane result={result({ text: 'x', fidelity })} messages={messages} />,
      );
      const notice = el.querySelector('.preview__notice')!;
      expect(notice).not.toBeNull();
      expect(notice.textContent).toContain('preview may differ');
      expect(notice.getAttribute('role')).toBe('status');
      act(() => root?.unmount());
      container?.remove();
      root = null;
    }
  });

  it('hides the degradation notice when fidelity is exact', () => {
    const el = render(<PreviewPane result={result({ text: 'x' })} messages={messages} />);
    expect(el.querySelector('.preview__notice')).toBeNull();
  });

  it('shows the empty placeholder when there is no text', () => {
    const el = render(<PreviewPane result={result({ text: '' })} messages={messages} />);
    expect(el.querySelector('pre')!.textContent).toBe('Fill the form to see the preview.');
  });

  it('associates the region with its heading', () => {
    const el = render(<PreviewPane result={result({ text: 'x' })} messages={messages} />);
    const section = el.querySelector('section')!;
    const heading = el.querySelector('h2')!;
    expect(heading.id).toBeTruthy();
    expect(section.getAttribute('aria-labelledby')).toBe(heading.id);
  });
});
