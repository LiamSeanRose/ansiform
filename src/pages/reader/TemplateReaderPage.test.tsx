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
    // Beta / walled-off marker is present.
    expect(container.querySelector('.reader__beta')).not.toBeNull();
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
});
