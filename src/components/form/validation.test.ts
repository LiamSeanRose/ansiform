import { describe, expect, it } from 'vitest';
import type { Field, FormSchema } from '../../core';
import { fieldOrder, validateField, validateForm } from './validation';

const text = (over: Partial<Extract<Field, { type: 'text' }>> = {}): Field => ({
  type: 'text',
  name: 'host',
  label: 'Host',
  ...over,
});

describe('validateField', () => {
  it('flags required blanks, allows optional blanks', () => {
    expect(validateField(text({ required: true }), '')).toEqual({ code: 'required' });
    expect(validateField(text({ required: true }), undefined)).toEqual({ code: 'required' });
    expect(validateField(text({ required: false }), '')).toBeUndefined();
  });

  it('checks text patterns and ignores malformed ones', () => {
    expect(validateField(text({ pattern: '^[a-z]+$' }), 'abc')).toBeUndefined();
    expect(validateField(text({ pattern: '^[a-z]+$' }), 'ABC')).toEqual({ code: 'pattern' });
    // A broken regex in a schema must not block the user.
    expect(validateField(text({ pattern: '([' }), 'anything')).toBeUndefined();
  });

  it('enforces number min/max and numeric-ness', () => {
    const num: Field = { type: 'number', name: 'mtu', label: 'MTU', min: 68, max: 9216 };
    expect(validateField(num, 1500)).toBeUndefined();
    expect(validateField(num, 10)).toEqual({ code: 'min', params: { min: 68 } });
    expect(validateField(num, 99999)).toEqual({ code: 'max', params: { max: 9216 } });
  });

  it('treats booleans and selects as always-satisfiable', () => {
    expect(validateField({ type: 'boolean', name: 'x', label: 'X' }, false)).toBeUndefined();
    expect(
      validateField(
        { type: 'select', name: 's', label: 'S', options: [{ value: 'a', label: 'A' }] },
        '',
      ),
    ).toBeUndefined();
  });

  it('validates a required secret like any required field', () => {
    const secret: Field = { type: 'secret', name: 'enable', label: 'Enable', required: true };
    expect(validateField(secret, '')).toEqual({ code: 'required' });
    expect(validateField(secret, 'hunter2')).toBeUndefined();
  });
});

describe('validateForm / fieldOrder', () => {
  const schema: FormSchema = {
    groups: [
      { fields: [text({ name: 'host', required: true })] },
      {
        fields: [
          { type: 'number', name: 'mtu', label: 'MTU', min: 68 },
          { type: 'secret', name: 'enable', label: 'Enable', required: true },
        ],
      },
    ],
  };

  it('collects per-field errors across groups', () => {
    expect(validateForm(schema, { host: '', mtu: 10, enable: '' })).toEqual({
      host: { code: 'required' },
      mtu: { code: 'min', params: { min: 68 } },
      enable: { code: 'required' },
    });
  });

  it('returns an empty map when everything is valid', () => {
    expect(validateForm(schema, { host: 'r1', mtu: 1500, enable: 'x' })).toEqual({});
  });

  it('reports field names in document order', () => {
    expect(fieldOrder(schema)).toEqual(['host', 'mtu', 'enable']);
  });
});
