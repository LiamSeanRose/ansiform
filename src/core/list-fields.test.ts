/**
 * Engine support for `list` fields (the #1/#3 amendment behind #9/#10/#11):
 * array-of-record YAML output and preview attribute access over loop entries.
 */
import { describe, expect, it } from 'vitest';
import type { FormSchema } from './index';
import { groupVarsYamlSink } from './output/yaml';
import { renderPreview } from './preview';
import { createSeedRegistry } from './filters/seed';

const schema: FormSchema = {
  groups: [
    {
      fields: [
        { type: 'text', name: 'name', label: 'name' },
        {
          type: 'list',
          name: 'entries',
          label: 'entries',
          item: [
            { type: 'text', name: 'action', label: 'action' },
            { type: 'text', name: 'note', label: 'note', omitWhenBlank: true },
          ],
        },
      ],
    },
  ],
};

describe('list field engine support', () => {
  it('serializes a list as an array of records, honouring per-entry omit-on-blank', () => {
    const artifact = groupVarsYamlSink.render({
      schema,
      values: {
        name: 'acl1',
        entries: [
          { action: 'permit', note: 'web' },
          { action: 'deny', note: '' },
        ],
      },
    });
    expect(artifact.content).toBe(
      'name: acl1\nentries:\n  - action: permit\n    note: web\n  - action: deny\n',
    );
  });

  it('emits an empty sequence for a list with no entries', () => {
    const artifact = groupVarsYamlSink.render({ schema, values: { name: 'acl1', entries: [] } });
    expect(artifact.content).toBe('name: acl1\nentries: []\n');
  });

  it('renders attribute access over loop entries (exact)', () => {
    const registry = createSeedRegistry();
    const template = '{% for e in entries %}{{ e.action }}: {{ e.note }}\n{% endfor %}';
    const result = renderPreview(
      template,
      { entries: [{ action: 'permit', note: 'web' }, { action: 'deny', note: 'rfc1918' }] },
      registry,
    );
    expect(result.fidelity).toBe('exact');
    expect(result.text).toBe('permit: web\ndeny: rfc1918\n');
  });

  it('resolves a missing attribute to an empty string, not a crash', () => {
    const registry = createSeedRegistry();
    const result = renderPreview('[{{ e.missing }}]', { e: { action: 'x' } }, registry);
    expect(result.text).toBe('[]');
    expect(result.fidelity).toBe('exact');
  });
});
