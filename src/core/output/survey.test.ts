import { describe, expect, it } from 'vitest';
import type { FormSchema } from '../types';
import { AWX_SURVEY_SPEC_ID, buildSurveySpec, createAwxSurveySink } from './survey';

const schema: FormSchema = {
  groups: [
    {
      fields: [
        { type: 'text', name: 'name', label: 'name.label', default: 'DATA', required: true },
        { type: 'number', name: 'vlan', label: 'vlan.label', default: 10, min: 1, max: 4094 },
        { type: 'boolean', name: 'enabled', label: 'enabled.label', default: true },
        {
          type: 'select',
          name: 'mode',
          label: 'mode.label',
          default: 'access',
          options: [
            { value: 'access', label: 'mode.access' },
            { value: 'trunk', label: 'mode.trunk' },
          ],
        },
        { type: 'secret', name: 'password', label: 'password.label', required: true },
        {
          type: 'list',
          name: 'servers',
          label: 'servers.label',
          item: [{ type: 'text', name: 'host', label: 'host.label' }],
        },
      ],
    },
  ],
};

describe('AWX survey-spec output', () => {
  const spec = buildSurveySpec(schema);
  const byVar = (variable: string) => spec.spec.find((q) => q.variable === variable)!;

  it('maps each field type to the right survey question type', () => {
    expect(byVar('name').type).toBe('text');
    expect(byVar('vlan').type).toBe('integer');
    expect(byVar('enabled').type).toBe('multiplechoice');
    expect(byVar('mode').type).toBe('multiplechoice');
    expect(byVar('password').type).toBe('password');
    expect(byVar('servers').type).toBe('textarea');
  });

  it('carries required, defaults, bounds and choices', () => {
    expect(byVar('name').required).toBe(true);
    expect(byVar('name').default).toBe('DATA');
    expect(byVar('vlan').min).toBe(1);
    expect(byVar('vlan').max).toBe(4094);
    expect(byVar('enabled').choices).toEqual(['true', 'false']);
    expect(byVar('mode').choices).toEqual(['access', 'trunk']);
  });

  it('never lets a secret carry a default or value (§5)', () => {
    const password = byVar('password');
    expect(password.type).toBe('password');
    expect(password.required).toBe(true);
    expect('default' in password).toBe(false);
  });

  it('resolves question names through the provided translator', () => {
    const resolved = buildSurveySpec(schema, (key) => `T:${key}`);
    expect(resolved.spec[0].question_name).toBe('T:name.label');
  });

  it('renders a valid JSON artifact via the OutputSink', () => {
    const sink = createAwxSurveySink((key) => key);
    expect(sink.id).toBe(AWX_SURVEY_SPEC_ID);
    const artifact = sink.render({ schema, values: {} });
    expect(artifact.filename).toBe('survey-spec.json');
    expect(artifact.contentType).toBe('application/json');
    const parsed = JSON.parse(artifact.content) as { spec: unknown[] };
    expect(parsed.spec).toHaveLength(6);
  });
});
