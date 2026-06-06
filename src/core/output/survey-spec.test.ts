import { describe, expect, it } from 'vitest';
import { awxSurveySpecSink, buildSurveySpec, type SurveySpec } from './survey-spec';
import type { FormSchema, FormValues } from '../types';
import { task as deviceBasics } from '../../tasks/device-basics';

// A synthetic schema exercising every field type.
const schema: FormSchema = {
  groups: [
    {
      legend: 'g',
      fields: [
        { type: 'text', name: 'hostname', label: 'l', required: true, default: 'sw1' },
        { type: 'number', name: 'vlan_id', label: 'l', required: true, min: 1, max: 4094 },
        { type: 'boolean', name: 'enabled', label: 'l', default: true },
        {
          type: 'select',
          name: 'state',
          label: 'l',
          default: 'active',
          options: [
            { value: 'active', label: 'l' },
            { value: 'suspend', label: 'l' },
          ],
        },
        { type: 'secret', name: 'password', label: 'l' },
      ],
    },
  ],
};

const byVar = (spec: SurveySpec, name: string) => spec.spec.find((q) => q.variable === name)!;

describe('AWX survey-spec sink', () => {
  it('produces a valid survey_spec envelope', () => {
    const spec = buildSurveySpec(schema);
    expect(spec).toMatchObject({ name: expect.any(String), description: '', spec: expect.any(Array) });
    expect(spec.spec).toHaveLength(5);
    expect(spec.spec.map((q) => q.variable)).toEqual([
      'hostname',
      'vlan_id',
      'enabled',
      'state',
      'password',
    ]);
  });

  it('maps each field type to the right question type', () => {
    const spec = buildSurveySpec(schema);
    expect(byVar(spec, 'hostname')).toEqual({
      question_name: 'hostname',
      variable: 'hostname',
      type: 'text',
      required: true,
      default: 'sw1',
    });
    expect(byVar(spec, 'vlan_id')).toEqual({
      question_name: 'vlan_id',
      variable: 'vlan_id',
      type: 'integer',
      required: true,
      default: '',
      min: 1,
      max: 4094,
    });
    expect(byVar(spec, 'enabled')).toEqual({
      question_name: 'enabled',
      variable: 'enabled',
      type: 'multiplechoice',
      required: false,
      default: 'true',
      choices: 'true\nfalse',
    });
    expect(byVar(spec, 'state')).toEqual({
      question_name: 'state',
      variable: 'state',
      type: 'multiplechoice',
      required: false,
      default: 'active',
      choices: 'active\nsuspend',
    });
  });

  it('maps secret → password with an empty default (never carries a value)', () => {
    const password = byVar(buildSurveySpec(schema), 'password');
    expect(password.type).toBe('password');
    expect(password.default).toBe('');
  });

  describe('render()', () => {
    it('emits valid JSON with the right filename and content type', () => {
      const artifact = awxSurveySpecSink.render({ schema, values: {} });
      expect(artifact.filename).toBe('survey-spec.json');
      expect(artifact.contentType).toBe('application/json');
      expect(artifact.content.endsWith('\n')).toBe(true);
      expect(JSON.parse(artifact.content)).toEqual(buildSurveySpec(schema));
    });

    it('never lets a form value leak into the export (schema-only)', () => {
      const values: FormValues = { password: 'super-secret', hostname: 'real-host-99' };
      const artifact = awxSurveySpecSink.render({ schema, values });
      expect(artifact.content).not.toContain('super-secret');
      expect(artifact.content).not.toContain('real-host-99');
      // Defaults come from the schema, not the entered values.
      expect(JSON.parse(artifact.content).spec[0].default).toBe('sw1');
    });
  });

  it('exports a real task: device-basics secrets become empty password questions', () => {
    const spec = buildSurveySpec(deviceBasics.definition.schema);
    for (const name of ['snmp_community', 'tacacs_key']) {
      const q = byVar(spec, name);
      expect(q.type).toBe('password');
      expect(q.default).toBe('');
    }
  });
});
