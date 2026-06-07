import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../../i18n/I18nProvider';
import { TemplateReaderPage } from './TemplateReaderPage';
import { mount, type Mounted } from '../../components/form/test-harness';

function render() {
  return mount(
    <I18nProvider>
      <MemoryRouter>
        <TemplateReaderPage />
      </MemoryRouter>
    </I18nProvider>,
  );
}

/** Drive the controlled <textarea> the way React expects (native setter). */
function paste(el: HTMLTextAreaElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value');
  desc?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event('input', { bubbles: true })));
}

/** Drive a controlled <select> the way React expects (native setter). */
function selectValue(el: HTMLSelectElement, value: string) {
  const desc = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
  desc?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event('change', { bubbles: true })));
}

const previewHeading = (container: HTMLElement) =>
  [...container.querySelectorAll('h2.workbench__heading')].find((h) =>
    h.textContent?.startsWith('Live preview'),
  )?.textContent;

let view: Mounted | undefined;
afterEach(() => {
  view?.unmount();
  view = undefined;
});

describe('TemplateReaderPage (#30)', () => {
  it('starts empty with a paste box and no variables', () => {
    view = render();
    const { container } = view;
    expect(container.querySelector('h1')?.textContent).toBe('Template reader');
    expect(container.querySelector('textarea')).not.toBeNull();
    // Scope note (walled-off-from-curated marker) is present.
    expect(container.querySelector('.reader__scope-note')).not.toBeNull();
    // No variable inputs before anything is pasted.
    expect(container.querySelectorAll('.reader__template').length).toBe(0);
  });

  it('extracts variables, badges filters, highlights the template, and previews', () => {
    view = render();
    const { container } = view;
    const ta = container.querySelector('textarea')!;
    paste(ta, "interface {{ interface }}\n ip address {{ ip | ipaddr('address') }}");

    // Variable inputs appear (one per extracted variable), not validated.
    const labels = [...container.querySelectorAll('.form__group .form-field__label code')].map(
      (c) => c.textContent,
    );
    expect(labels).toContain('interface');
    expect(labels).toContain('ip');

    // Filter shows with an exact-tier badge.
    const badge = container.querySelector('.reader__badge--exact');
    expect(badge).not.toBeNull();

    // Template is highlighted with output chips (text-node spans).
    expect(container.querySelectorAll('.reader__chip--output').length).toBeGreaterThan(0);

    // Live preview renders against sample values; before sampling, the var slot is blank.
    const pre = container.querySelector('pre.preview__cli');
    expect(pre?.textContent).toContain('interface');
  });

  it('masks credential-named variables as password inputs', () => {
    view = render();
    const { container } = view;
    paste(container.querySelector('textarea')!, 'snmp-server community {{ snmp_community }}');
    const input = container.querySelector<HTMLInputElement>('input[type="password"]');
    expect(input).not.toBeNull();
  });

  it('shows a visible degradation notice for an unknown filter', () => {
    view = render();
    const { container } = view;
    paste(container.querySelector('textarea')!, '{{ x | mystery }}');
    // Unsupported → the warning notice (not the exact banner) is shown.
    expect(container.querySelector('.preview__notice')).not.toBeNull();
    expect(container.querySelector('.reader__badge--unsupported')).not.toBeNull();
  });

  it('offers a preview-target selector defaulting to Cisco IOS (#70)', () => {
    view = render();
    const { container } = view;
    paste(container.querySelector('textarea')!, "interface {{ interface }} {{ ip | ipaddr('address') }}");
    const sel = container.querySelector<HTMLSelectElement>('.workbench__vendor select');
    expect(sel).not.toBeNull();
    expect(sel!.value).toBe('cisco-ios');
    // No longer hard-labelled — it reflects the selected platform.
    expect(previewHeading(container)).toBe('Live preview (Cisco IOS)');
    // Exact filters under the IOS default → no preview-degrade notice.
    expect(container.querySelector('.preview__notice')).toBeNull();
  });

  it('relabels and floors a non-line-CLI target to approximate (#70)', () => {
    view = render();
    const { container } = view;
    paste(container.querySelector('textarea')!, "interface {{ interface }} {{ ip | ipaddr('address') }}");
    const sel = container.querySelector<HTMLSelectElement>('.workbench__vendor select')!;
    expect(container.querySelector('.preview__notice')).toBeNull();

    selectValue(sel, 'juniper-junos');
    expect(previewHeading(container)).toBe('Live preview (Juniper Junos)');
    // A non-line-CLI target can't claim exact for a pasted template — the
    // "preview may differ" notice appears even though the filters are exact.
    expect(container.querySelector('.preview__notice')).not.toBeNull();
  });

  it('auto-flags a pasted set-form template as approximate, even on IOS (#71)', () => {
    view = render();
    const { container } = view;
    paste(
      container.querySelector('textarea')!,
      'set system host-name {{ hostname }}\nset system ntp server {{ ntp }}',
    );
    // Default target is Cisco IOS, yet the set-form paste is flagged with its own
    // note (no manual platform switch needed).
    const notice = container.querySelector('.preview__notice');
    expect(notice).not.toBeNull();
    expect(notice!.textContent).toContain('set-form');
  });
});
