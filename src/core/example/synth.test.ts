import { describe, expect, it } from 'vitest';
import type { FormSchema } from '../types';
import { synthesizeExample } from './synth';

describe('synthesizeExample', () => {
  it('uses declared defaults, first select option, and a sample boolean', () => {
    const schema: FormSchema = {
      groups: [
        {
          fields: [
            { name: 'mtu', label: 'MTU', type: 'number', default: 1500 },
            { name: 'mode', label: 'Mode', type: 'select', options: [
              { value: 'auto', label: 'auto' },
              { value: 'full', label: 'full' },
            ] },
            { name: 'enabled', label: 'On', type: 'boolean' },
          ],
        },
      ],
    };
    expect(synthesizeExample(schema)).toEqual({ mtu: 1500, mode: 'auto', enabled: true });
  });

  it('NEVER seeds a secret field, even with an example value', () => {
    const schema: FormSchema = {
      groups: [{ fields: [{ name: 'snmp_community', label: 'Community', type: 'secret' }] }],
    };
    expect(synthesizeExample(schema)).toEqual({});
  });

  it('omits text/number fields with no default or placeholder rather than inventing one', () => {
    const schema: FormSchema = {
      groups: [
        {
          fields: [
            { name: 'hostname', label: 'Host', type: 'text' },
            { name: 'desc', label: 'Desc', type: 'text', placeholder: 'uplink to core' },
            { name: 'vlan', label: 'VLAN', type: 'number', min: 10 },
          ],
        },
      ],
    };
    expect(synthesizeExample(schema)).toEqual({ desc: 'uplink to core', vlan: 10 });
  });

  it('builds a single sample row for a list field', () => {
    const schema: FormSchema = {
      groups: [
        {
          fields: [
            {
              name: 'vlans',
              label: 'VLANs',
              type: 'list',
              fields: [
                { name: 'id', label: 'ID', type: 'number', default: 10 },
                { name: 'name', label: 'Name', type: 'text', placeholder: 'data' },
              ],
            },
          ],
        },
      ],
    };
    expect(synthesizeExample(schema)).toEqual({ vlans: [{ id: 10, name: 'data' }] });
  });

  it('omits a list with no sampleable sub-fields', () => {
    const schema: FormSchema = {
      groups: [
        {
          fields: [
            { name: 'hosts', label: 'Hosts', type: 'list', fields: [
              { name: 'name', label: 'Name', type: 'text' },
            ] },
          ],
        },
      ],
    };
    expect(synthesizeExample(schema)).toEqual({});
  });
});
