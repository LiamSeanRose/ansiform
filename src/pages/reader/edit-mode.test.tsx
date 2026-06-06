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

/** Drive a controlled text input/textarea the way React expects (native setter). */
function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const desc = Object.getOwnPropertyDescriptor(proto.prototype, 'value');
  desc?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event('input', { bubbles: true })));
}

let view: Mounted | undefined;
afterEach(() => {
  view?.unmount();
  view = undefined;
});

/** Paste a template and switch the page into edit mode (ack + enter). */
function enterEditMode(c: HTMLElement, template: string) {
  type(c.querySelector('textarea')!, template);
  const ack = c.querySelector<HTMLInputElement>('.reader__ack input[type="checkbox"]')!;
  act(() => ack.click());
  act(() => c.querySelector<HTMLButtonElement>('.reader__mode-toggle')!.click());
}

describe('Template reader edit mode (#31)', () => {
  it('gates edit mode behind the acknowledgment checkbox', () => {
    view = render();
    const c = view.container;
    type(c.querySelector('textarea')!, 'interface {{ interface }}');
    const toggle = c.querySelector<HTMLButtonElement>('.reader__mode-toggle')!;
    expect(toggle.disabled).toBe(true); // can't edit until acknowledged
    act(() => c.querySelector<HTMLInputElement>('.reader__ack input')!.click());
    expect(toggle.disabled).toBe(false);
  });

  it('renders extracted variables as all-text fields tagged data-source=extracted', () => {
    view = render();
    const c = view.container;
    enterEditMode(c, 'interface {{ interface }}\n vlan {{ vlan_id }}');
    const inputs = [...c.querySelectorAll<HTMLInputElement>('input[data-source="extracted"]')];
    expect(inputs.length).toBe(2);
    // Even a numeric-looking name stays a plain text input — nothing inferred.
    expect(inputs.every((i) => i.type === 'text')).toBe(true);
    // The non-dismissible honesty callout is present.
    expect(c.textContent).toContain('no inferred type');
  });

  it('masks a credential-named extracted variable as a password input', () => {
    view = render();
    const c = view.container;
    enterEditMode(c, 'snmp-server community {{ snmp_community }}');
    const pw = c.querySelector<HTMLInputElement>('input[type="password"][data-source="extracted"]');
    expect(pw).not.toBeNull();
  });

  it('exports vars only — the filled value, never the pasted template', () => {
    view = render();
    const c = view.container;
    enterEditMode(c, 'interface {{ interface }}');
    const field = c.querySelector<HTMLInputElement>('input[data-source="extracted"]')!;
    type(field, 'Gig0/1');
    const yaml = c.querySelector('pre.output__yaml')!.textContent ?? '';
    expect(yaml).toContain('interface: Gig0/1');
    // The pasted template literal must never appear in the exported vars.
    expect(yaml).not.toContain('{{');
    expect(yaml).not.toContain('interface {{ interface }}');
  });

  it('leaving the gate (uncheck) drops back to read-only', () => {
    view = render();
    const c = view.container;
    enterEditMode(c, 'interface {{ interface }}');
    expect(c.querySelector('input[data-source="extracted"]')).not.toBeNull();
    act(() => c.querySelector<HTMLInputElement>('.reader__ack input')!.click()); // uncheck
    expect(c.querySelector('input[data-source="extracted"]')).toBeNull();
  });
});
