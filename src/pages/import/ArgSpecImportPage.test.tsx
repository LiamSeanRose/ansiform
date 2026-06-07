import { afterEach, describe, expect, it } from 'vitest';
import { act } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '../../i18n/I18nProvider';
import { ArgSpecImportPage } from './ArgSpecImportPage';
import { mount, type Mounted } from '../../components/form/test-harness';

function render() {
  return mount(
    <I18nProvider>
      <MemoryRouter>
        <ArgSpecImportPage />
      </MemoryRouter>
    </I18nProvider>,
  );
}

function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const desc = Object.getOwnPropertyDescriptor(proto.prototype, 'value');
  desc?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event('input', { bubbles: true })));
}

function paste(c: HTMLElement, spec: string) {
  type(c.querySelector<HTMLTextAreaElement>('#import-paste')!, spec);
}

let view: Mounted | undefined;
afterEach(() => {
  view?.unmount();
  view = undefined;
});

describe('ArgSpecImportPage (#85 — first-class /import)', () => {
  it('renders its own H1 + paste box, with no form until a spec is pasted', () => {
    view = render();
    const c = view.container;
    expect(c.querySelector('#import-title')).not.toBeNull();
    expect(c.querySelector('#import-paste')).not.toBeNull();
    expect(c.querySelector('.workbench')).toBeNull(); // no form yet
  });

  it('builds the exact declared form: int→number, bool→checkbox, choices→select', () => {
    view = render();
    const c = view.container;
    paste(
      c,
      `argument_specs:
  main:
    options:
      vlan_id:
        type: int
        required: true
      enabled:
        type: bool
      mode:
        type: str
        choices: [access, trunk]`,
    );
    expect(c.querySelector<HTMLInputElement>('input[name="vlan_id"]')?.type).toBe('number');
    expect(c.querySelector<HTMLInputElement>('input[name="enabled"]')?.type).toBe('checkbox');
    expect(c.querySelector('select[name="mode"]')).not.toBeNull();
  });

  it('exports byte-correct YAML with declared types preserved', () => {
    view = render();
    const c = view.container;
    paste(c, `options:\n  enabled:\n    type: bool\n    default: true`);
    const yaml = c.querySelector('pre.output__yaml')?.textContent ?? '';
    expect(yaml).toContain('enabled: true');
  });

  it('masks a no_log option as a password input', () => {
    view = render();
    const c = view.container;
    paste(c, `options:\n  bind_password:\n    type: str\n    no_log: true`);
    expect(c.querySelector<HTMLInputElement>('input[name="bind_password"]')?.type).toBe('password');
  });

  it('surfaces a visible error for malformed YAML instead of crashing', () => {
    view = render();
    const c = view.container;
    paste(c, 'options: [unterminated');
    expect(c.querySelector('.preview__notice[role="alert"]')).not.toBeNull();
    expect(c.querySelector('pre.output__yaml')).toBeNull();
  });

  it('has no device-CLI preview (preview-less by design)', () => {
    view = render();
    const c = view.container;
    paste(c, `options:\n  vlan_id:\n    type: int`);
    expect(c.querySelector('.preview__cli')).toBeNull();
  });

  it('cross-links back to the template reader', () => {
    view = render();
    const c = view.container;
    const link = [...c.querySelectorAll('a')].find((a) => a.getAttribute('href') === '/reader');
    expect(link).not.toBeUndefined();
  });
});
