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

function type(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement : HTMLInputElement;
  const desc = Object.getOwnPropertyDescriptor(proto.prototype, 'value');
  desc?.set?.call(el, value);
  act(() => el.dispatchEvent(new Event('input', { bubbles: true })));
}

/** Switch the reader to the argument_specs source and paste `spec`. */
function pasteSpec(c: HTMLElement, spec: string) {
  const radios = [...c.querySelectorAll<HTMLInputElement>('.reader__source input[type="radio"]')];
  act(() => radios[1].click()); // the argument_specs option
  type(c.querySelector<HTMLTextAreaElement>('#reader-argspec-paste')!, spec);
}

let view: Mounted | undefined;
afterEach(() => {
  view?.unmount();
  view = undefined;
});

describe('argument_specs importer (#32)', () => {
  it('selecting argument_specs swaps the template reader for the spec importer', () => {
    view = render();
    const c = view.container;
    // Template paste box present by default; spec box absent.
    expect(c.querySelector('#reader-argspec-paste')).toBeNull();
    act(() => c.querySelectorAll<HTMLInputElement>('.reader__source input')[1].click());
    expect(c.querySelector('#reader-argspec-paste')).not.toBeNull();
    // The Jinja template box is now gone (one surface at a time).
    expect(c.querySelector('textarea.reader__input#reader-argspec-paste')).not.toBeNull();
  });

  it('builds an exact form: int→number, bool→checkbox, choices→select', () => {
    view = render();
    const c = view.container;
    pasteSpec(
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
    // Declared, not inferred — fields still carry the extracted-provenance marker.
    expect(c.querySelector('input[name="vlan_id"]')?.getAttribute('data-source')).toBe('extracted');
  });

  it('masks a no_log option as a password input', () => {
    view = render();
    const c = view.container;
    pasteSpec(
      c,
      `options:
  bind_password:
    type: str
    no_log: true`,
    );
    expect(c.querySelector<HTMLInputElement>('input[name="bind_password"]')?.type).toBe('password');
  });

  it('exports byte-correct YAML with declared types preserved', () => {
    view = render();
    const c = view.container;
    pasteSpec(c, `options:\n  enabled:\n    type: bool\n    default: true`);
    const yaml = c.querySelector('pre.output__yaml')?.textContent ?? '';
    // The declared default seeds the checkbox; YAML emits an unquoted boolean.
    expect(yaml).toContain('enabled: true');
  });

  it('surfaces a visible error for malformed YAML instead of crashing', () => {
    view = render();
    const c = view.container;
    pasteSpec(c, 'options: [unterminated');
    expect(c.querySelector('.preview__notice[role="alert"]')).not.toBeNull();
    expect(c.querySelector('pre.output__yaml')).toBeNull();
  });
});
