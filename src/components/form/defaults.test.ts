import { describe, expect, it } from 'vitest';
import type { FormSchema } from '../../core';
import { initialValues } from './defaults';

describe('initialValues', () => {
  it('seeds declared defaults for text/number/select', () => {
    const schema: FormSchema = {
      groups: [
        {
          fields: [
            { type: 'text', name: 'host', label: 'Host', default: 'r1' },
            { type: 'number', name: 'mtu', label: 'MTU', default: 1500 },
            {
              type: 'select',
              name: 'duplex',
              label: 'Duplex',
              options: [{ value: 'auto', label: 'Auto' }],
              default: 'auto',
            },
          ],
        },
      ],
    };

    expect(initialValues(schema)).toEqual({ host: 'r1', mtu: 1500, duplex: 'auto' });
  });

  it('omits text/number/select with no default', () => {
    const schema: FormSchema = {
      groups: [{ fields: [{ type: 'text', name: 'host', label: 'Host' }] }],
    };
    expect(initialValues(schema)).toEqual({});
  });

  it('resolves booleans to a concrete value (default or false)', () => {
    const schema: FormSchema = {
      groups: [
        {
          fields: [
            { type: 'boolean', name: 'on', label: 'On', default: true },
            { type: 'boolean', name: 'off', label: 'Off' },
          ],
        },
      ],
    };
    expect(initialValues(schema)).toEqual({ on: true, off: false });
  });

  it('never seeds a secret', () => {
    const schema: FormSchema = {
      groups: [{ fields: [{ type: 'secret', name: 'enable', label: 'Enable secret' }] }],
    };
    expect(initialValues(schema)).toEqual({});
    expect('enable' in initialValues(schema)).toBe(false);
  });
});
