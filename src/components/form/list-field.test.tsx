import { describe, it, expect, afterEach } from 'vitest';
import { act, useState } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { FieldValue, FormSchema, ListField } from '../../core';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues } from './defaults';
import { validateForm } from './validation';
import { ListFieldControl } from './ListFieldControl';
import type { FieldError, FormMessages } from './types';

// A representative list field: a repeating "servers" group.
const serversField: ListField = {
  type: 'list',
  name: 'servers',
  label: 'Servers',
  minRows: 1,
  fields: [
    { type: 'text', name: 'host', label: 'Host', required: true },
    { type: 'number', name: 'port', label: 'Port', omitWhenBlank: true },
    { type: 'boolean', name: 'enabled', label: 'Enabled' },
    { type: 'secret', name: 'key', label: 'Key', omitWhenBlank: true },
  ],
};
const schema: FormSchema = { groups: [{ fields: [serversField] }] };
const registry = createSeedRegistry();

describe('list field — YAML output (sequence + per-row omit-on-blank)', () => {
  it('emits a YAML sequence of mappings; blank omit-on-blank cells are dropped', () => {
    const values = {
      servers: [
        { host: 'a', port: 22, enabled: true },
        { host: 'b', port: undefined, enabled: false },
      ],
    };
    expect(groupVarsYamlSink.render({ schema, values }).content).toBe(
      [
        'servers:',
        '  - host: a',
        '    port: 22',
        '    enabled: true',
        '  - host: b',
        '    enabled: false',
        '',
      ].join('\n'),
    );
  });

  it('omits an empty omit-on-blank list entirely', () => {
    const omitField: ListField = { ...serversField, omitWhenBlank: true };
    const s: FormSchema = { groups: [{ fields: [omitField] }] };
    expect(groupVarsYamlSink.render({ schema: s, values: { servers: [] } }).content).toBe('{}\n');
  });

  it('emits an empty (non-omit) list as []', () => {
    expect(groupVarsYamlSink.render({ schema, values: { servers: [] } }).content).toBe(
      'servers: []\n',
    );
  });
});

describe('list field — device-CLI preview (for-loop + member access)', () => {
  it('iterates rows, reads sub-fields via dot access, newline after output survives', () => {
    // The newline sits after an output (not after a block tag), so trim_blocks
    // keeps it — one line per row.
    const out = renderPreview(
      '{% for s in servers %} host {{ s.host }}\n{% endfor %}',
      { servers: [{ host: 'a' }, { host: 'b' }] },
      registry,
    );
    expect(out.fidelity).toBe('exact');
    expect(out.text).toBe(' host a\n host b\n');
  });

  it('honors a per-row conditional on a member value', () => {
    const out = renderPreview(
      "{% for s in servers %}{{ s.host }}{% if s.port %}:{{ s.port }}{% endif %};{% endfor %}",
      { servers: [{ host: 'a', port: 22 }, { host: 'b' }] },
      registry,
    );
    expect(out.fidelity).toBe('exact');
    expect(out.text).toBe('a:22;b;');
  });

  it('renders a missing member as empty (no crash)', () => {
    const out = renderPreview('{% for s in servers %}{{ s.nope }}|{% endfor %}', {
      servers: [{ host: 'a' }],
    }, registry);
    expect(out.text).toBe('|');
    expect(out.fidelity).toBe('exact');
  });
});

describe('list field — defaults & validation', () => {
  it('seeds minRows rows with row defaults; secrets never seeded', () => {
    const init = initialValues(schema);
    const rows = init.servers as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].enabled).toBe(false); // boolean resolves to a concrete false
    expect('key' in rows[0]).toBe(false); // secret not seeded
    expect('host' in rows[0]).toBe(false); // no default → unset
  });

  it('required empty list → required; invalid row → incomplete; valid → no error', () => {
    const req: FormSchema = { groups: [{ fields: [{ ...serversField, required: true }] }] };
    expect(validateForm(req, { servers: [] }).servers?.code).toBe('required');
    // a row missing its required host
    expect(validateForm(schema, { servers: [{ port: 22 }] }).servers?.code).toBe('incomplete');
    // a complete row
    expect(validateForm(schema, { servers: [{ host: 'a' }] }).servers).toBeUndefined();
  });
});

// ── Component (controlled) ───────────────────────────────────────────────────
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
let root: Root | null = null;
let container: HTMLElement | null = null;
function mount(el: ReactElement): HTMLElement {
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

const echo = (key: string) => key;
const messages: FormMessages = {
  requiredLabel: '(required)',
  errorSummaryHeading: 'fix',
  submitLabel: 'go',
  errors: {
    required: 'required',
    pattern: 'pattern',
    min: 'min',
    max: 'max',
    notANumber: 'nan',
    incomplete: 'incomplete',
  },
};

function Harness({ initial, error }: { initial: FieldValue; error?: FieldError }) {
  const [value, setValue] = useState<FieldValue>(initial);
  return (
    <ListFieldControl
      field={serversField}
      value={value}
      error={error}
      onValueChange={(_, v) => setValue(v)}
      t={echo}
      messages={messages}
      idPrefix="t"
    />
  );
}

const rowsCount = (el: HTMLElement) => el.querySelectorAll('.list-field__row').length;

describe('ListFieldControl', () => {
  it('renders the seeded rows with a keyboard-operable add button', () => {
    const el = mount(<Harness initial={[{ host: 'a' }]} />);
    expect(rowsCount(el)).toBe(1);
    const add = el.querySelector('.list-field__add')!;
    expect(add.tagName).toBe('BUTTON');
    // each row's sub-fields are real inputs (reuses FieldControl)
    expect(el.querySelector('.list-field__row input[name="host"]')).not.toBeNull();
  });

  it('adds a row and announces it via the status region', () => {
    const el = mount(<Harness initial={[{ host: 'a' }]} />);
    act(() => el.querySelector<HTMLButtonElement>('.list-field__add')!.click());
    expect(rowsCount(el)).toBe(2);
    expect(el.querySelector('.list-field__status')!.textContent).toBe('form.list.added');
  });

  it('removes a row and announces it', () => {
    const el = mount(<Harness initial={[{ host: 'a' }, { host: 'b' }]} />);
    act(() => el.querySelectorAll<HTMLButtonElement>('.list-field__remove')[0].click());
    expect(rowsCount(el)).toBe(1);
    expect(el.querySelector('.list-field__status')!.textContent).toBe('form.list.removed');
  });

  it('shows inline row errors only when the list is flagged incomplete', () => {
    const clean = mount(<Harness initial={[{ port: 22 }]} />); // host missing, but no error prop
    expect(clean.querySelector('.form-field__error')).toBeNull();
    act(() => root?.unmount());
    container?.remove();
    const flagged = mount(<Harness initial={[{ port: 22 }]} error={{ code: 'incomplete' }} />);
    expect(flagged.querySelector('.list-field__row .form-field__error')).not.toBeNull();
  });
});
