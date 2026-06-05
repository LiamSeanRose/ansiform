import { describe, expect, it } from 'vitest';
import type { FormSchema } from '../../core';
import { isSecretField, redactSecrets, secretFieldNames } from './secrets';

const schema: FormSchema = {
  groups: [
    {
      fields: [
        { type: 'text', name: 'host', label: 'Host' },
        { type: 'secret', name: 'enable_secret', label: 'Enable secret' },
        { type: 'secret', name: 'snmp_community', label: 'SNMP community' },
      ],
    },
  ],
};

describe('secret-safety helpers (§5)', () => {
  it('identifies secret fields', () => {
    expect(isSecretField({ type: 'secret', name: 's', label: 'S' })).toBe(true);
    expect(isSecretField({ type: 'text', name: 't', label: 'T' })).toBe(false);
  });

  it('lists every secret field name', () => {
    expect(secretFieldNames(schema)).toEqual(new Set(['enable_secret', 'snmp_community']));
  });

  it('strips secrets entirely from a snapshot (no masking, no length leak)', () => {
    const values = { host: 'r1', enable_secret: 'hunter2', snmp_community: 'public' };
    const safe = redactSecrets(schema, values);

    expect(safe).toEqual({ host: 'r1' });
    // The value never survives in any form — not even a masked placeholder.
    expect(JSON.stringify(safe)).not.toContain('hunter2');
    expect('enable_secret' in safe).toBe(false);
    // The original is untouched (redaction returns a copy).
    expect(values.enable_secret).toBe('hunter2');
  });
});
