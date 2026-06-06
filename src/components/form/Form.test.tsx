import { afterEach, describe, expect, it, vi } from 'vitest';
import type { FormSchema, FormValues } from '../../core';
import { Form } from './Form';
import type { FormMessages } from './types';
import type { Translate } from './FieldControl';
import { byName, click, labelFor, mount, setValue, submit, type Mounted } from './test-harness';

// A real-ish translator: passes keys through, interpolates {placeholders}.
const t: Translate = (key, vars) =>
  vars ? key.replace(/\{(\w+)\}/g, (m, n: string) => (n in vars ? String(vars[n]) : m)) : key;

const messages: FormMessages = {
  requiredLabel: '(required)',
  errorSummaryHeading: 'There is a problem',
  submitLabel: 'Generate',
  errors: {
    required: '{label} is required',
    pattern: '{label} is not valid',
    min: '{label} must be at least {min}',
    max: '{label} must be at most {max}',
    notANumber: '{label} must be a number',
    incomplete: '{label} has rows that need attention',
  },
};

const schema: FormSchema = {
  groups: [
    {
      legend: 'Interface',
      fields: [
        {
          type: 'text',
          name: 'hostname',
          label: 'Hostname',
          required: true,
          help: 'Lowercase only',
          pattern: '^[a-z0-9-]+$',
        },
        { type: 'number', name: 'mtu', label: 'MTU', min: 68, max: 9216 },
        { type: 'boolean', name: 'shutdown', label: 'Shutdown', default: false },
        {
          type: 'select',
          name: 'duplex',
          label: 'Duplex',
          default: 'auto',
          options: [
            { value: 'auto', label: 'Auto' },
            { value: 'full', label: 'Full' },
          ],
        },
        { type: 'secret', name: 'enable_secret', label: 'Enable secret', required: true },
      ],
    },
  ],
};

let view: Mounted | undefined;
afterEach(() => {
  view?.unmount();
  view = undefined;
});

function getForm(container: HTMLElement): HTMLFormElement {
  const form = container.querySelector('form');
  if (!form) throw new Error('no form rendered');
  return form;
}

describe('Form rendering & a11y', () => {
  it('renders each field type with an associated, keyboard-reachable control', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    const { container } = view;

    const hostname = byName<HTMLInputElement>(container, 'hostname');
    expect(hostname.type).toBe('text');

    const mtu = byName<HTMLInputElement>(container, 'mtu');
    expect(mtu.type).toBe('number');

    const shutdown = byName<HTMLInputElement>(container, 'shutdown');
    expect(shutdown.type).toBe('checkbox');
    expect(shutdown.checked).toBe(false);

    const duplex = byName<HTMLSelectElement>(container, 'duplex');
    expect(duplex.tagName).toBe('SELECT');
    expect(duplex.value).toBe('auto');
    expect(duplex.querySelectorAll('option')).toHaveLength(2);

    // Every control is programmatically labelled (label[for] === control.id).
    for (const name of ['hostname', 'mtu', 'shutdown', 'duplex', 'enable_secret']) {
      const control = byName(container, name);
      expect(labelFor(container, control), `label for ${name}`).not.toBeNull();
    }

    // The legend renders the group heading.
    expect(container.querySelector('legend')?.textContent).toBe('Interface');
  });

  it('wires help text through aria-describedby and marks required fields', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    const hostname = byName<HTMLInputElement>(view.container, 'hostname');

    const describedby = hostname.getAttribute('aria-describedby');
    expect(describedby).toBeTruthy();
    const help = document.getElementById(describedby!);
    expect(help?.textContent).toBe('Lowercase only');
    expect(hostname.getAttribute('aria-required')).toBe('true');
  });

  it('renders secret as a password input that never autofills or seeds', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    const secret = byName<HTMLInputElement>(view.container, 'enable_secret');

    expect(secret.type).toBe('password');
    expect(secret.getAttribute('autocomplete')).toBe('new-password');
    expect(secret.value).toBe('');
  });
});

describe('Form value model (#2/#5 consume this)', () => {
  it('emits coerced values for each field type', () => {
    const onChange = vi.fn<(v: FormValues) => void>();
    view = mount(<Form schema={schema} t={t} messages={messages} onChange={onChange} />);
    const { container } = view;

    setValue(byName<HTMLInputElement>(container, 'hostname'), 'r1');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ hostname: 'r1' }));

    setValue(byName<HTMLInputElement>(container, 'mtu'), '1500');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ mtu: 1500 }));

    click(byName<HTMLInputElement>(container, 'shutdown'));
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ shutdown: true }));

    setValue(byName<HTMLSelectElement>(container, 'duplex'), 'full');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ duplex: 'full' }));
  });

  it('omits number fields when cleared (omit-on-blank friendly)', () => {
    const onChange = vi.fn<(v: FormValues) => void>();
    view = mount(<Form schema={schema} t={t} messages={messages} onChange={onChange} />);
    const mtu = byName<HTMLInputElement>(view.container, 'mtu');
    setValue(mtu, '1500');
    setValue(mtu, '');
    expect(onChange).toHaveBeenLastCalledWith(expect.objectContaining({ mtu: undefined }));
  });
});

describe('Form validation, error summary & managed focus', () => {
  it('shows an error summary, takes focus, and flags invalid fields on submit', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    const { container } = view;

    submit(getForm(container));

    const summary = container.querySelector('.form__error-summary');
    expect(summary).not.toBeNull();
    expect(summary?.getAttribute('role')).toBe('alert');
    // Managed focus: the summary itself receives focus.
    expect(document.activeElement).toBe(summary);

    // Both required-but-blank fields are listed and flagged.
    const summaryText = summary?.textContent ?? '';
    expect(summaryText).toContain('Hostname is required');
    expect(summaryText).toContain('Enable secret is required');

    const hostname = byName<HTMLInputElement>(container, 'hostname');
    expect(hostname.getAttribute('aria-invalid')).toBe('true');
    expect(hostname.getAttribute('aria-describedby')).toBeTruthy();
  });

  it('moves focus to the offending field when its summary link is activated', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    const { container } = view;

    submit(getForm(container));
    const link = container.querySelector<HTMLButtonElement>('.form__error-summary-link');
    expect(link).not.toBeNull();
    click(link!);

    expect(document.activeElement).toBe(byName(container, 'hostname'));
  });

  it('reports a pattern violation', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    const { container } = view;

    setValue(byName<HTMLInputElement>(container, 'hostname'), 'NOT-LOWER');
    setValue(byName<HTMLInputElement>(container, 'enable_secret'), 'x');
    submit(getForm(container));

    expect(container.querySelector('.form__error-summary')?.textContent).toContain(
      'Hostname is not valid',
    );
  });

  it('calls onSubmit with the value model when valid, and shows no summary', () => {
    const onSubmit = vi.fn<(v: FormValues) => void>();
    view = mount(<Form schema={schema} t={t} messages={messages} onSubmit={onSubmit} />);
    const { container } = view;

    setValue(byName<HTMLInputElement>(container, 'hostname'), 'r1');
    setValue(byName<HTMLInputElement>(container, 'enable_secret'), 'hunter2');
    submit(getForm(container));

    expect(container.querySelector('.form__error-summary')).toBeNull();
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ hostname: 'r1', duplex: 'auto', shutdown: false }),
    );
  });

  it('clears a field error live once the user fixes it after a failed submit', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    const { container } = view;

    submit(getForm(container));
    expect(byName(container, 'hostname').getAttribute('aria-invalid')).toBe('true');

    setValue(byName<HTMLInputElement>(container, 'hostname'), 'r1');
    expect(byName(container, 'hostname').getAttribute('aria-invalid')).toBeNull();
  });
});
