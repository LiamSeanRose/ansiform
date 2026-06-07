import { afterEach, describe, expect, it } from 'vitest';
import type { FormSchema } from '../../core';
import { Form } from './Form';
import type { FormMessages, NetworkWarningMessages } from './types';
import type { Translate } from './FieldControl';
import { byName, click, mount, setValue, submit, type Mounted } from './test-harness';

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

const warningMessages: NetworkWarningMessages = {
  warnings: {
    ipv4: 'not a valid IPv4',
    cidr: 'not a valid CIDR',
    ipv6: 'not a valid IPv6',
    mac: 'not a valid MAC',
    vlan: 'VLAN must be 1-4094',
    vlanReserved: 'VLAN reserved',
    asn: 'not a valid ASN',
    ifname: 'not an interface name',
  },
  treatAsTextLabel: 'Treat as text',
};

const schema: FormSchema = {
  groups: [
    {
      legend: 'Net',
      fields: [
        { type: 'text', name: 'addr', label: 'Address', format: 'cidr' },
        { type: 'text', name: 'plain', label: 'Plain' },
      ],
    },
  ],
};

let view: Mounted | undefined;
afterEach(() => {
  view?.unmount();
  view = undefined;
});

const render = () =>
  mount(<Form schema={schema} t={t} messages={messages} warningMessages={warningMessages} />);

describe('advisory network-format warnings (#86)', () => {
  it('shows a warning for a bad value and clears it once corrected', () => {
    view = render();
    const input = byName<HTMLInputElement>(view.container, 'addr');

    setValue(input, '10.0.0.0/33');
    expect(view.container.querySelector('.form-field__warning')?.textContent).toContain(
      'not a valid CIDR',
    );
    // Advisory only — the value is never marked invalid and submit is never blocked.
    expect(input.getAttribute('aria-invalid')).toBeNull();
    expect(input.getAttribute('aria-describedby')).toContain('-warning');

    setValue(input, '10.0.0.0/24');
    expect(view.container.querySelector('.form-field__warning')).toBeNull();
  });

  it('never warns on blank, a Jinja2 ref, or a field without a format', () => {
    view = render();
    const addr = byName<HTMLInputElement>(view.container, 'addr');

    setValue(addr, '{{ mgmt_cidr }}');
    expect(view.container.querySelector('.form-field__warning')).toBeNull();

    setValue(addr, '');
    expect(view.container.querySelector('.form-field__warning')).toBeNull();

    // The field without a `format` never warns even with a "bad" value.
    setValue(byName<HTMLInputElement>(view.container, 'plain'), 'not-an-ip');
    expect(view.container.querySelector('.form-field__warning')).toBeNull();
  });

  it('"treat as text" dismisses the warning for that value, and never blocks submit', () => {
    let submitted = 0;
    view = mount(
      <Form
        schema={schema}
        t={t}
        messages={messages}
        warningMessages={warningMessages}
        onSubmit={() => {
          submitted += 1;
        }}
      />,
    );
    const input = byName<HTMLInputElement>(view.container, 'addr');
    setValue(input, '999.0.0.0/24');
    expect(view.container.querySelector('.form-field__warning')).not.toBeNull();

    click(view.container.querySelector<HTMLButtonElement>('.form-field__warning-dismiss')!);
    expect(view.container.querySelector('.form-field__warning')).toBeNull();

    // A warned (or dismissed) value still submits — warnings never gate export.
    submit(view.container.querySelector('form')!);
    expect(submitted).toBe(1);
  });

  it('renders no warnings when no warningMessages are provided (graceful opt-out)', () => {
    view = mount(<Form schema={schema} t={t} messages={messages} />);
    setValue(byName<HTMLInputElement>(view.container, 'addr'), '10.0.0.0/33');
    expect(view.container.querySelector('.form-field__warning')).toBeNull();
  });
});
