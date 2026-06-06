/**
 * AWX / AAP Survey-spec JSON output sink (issue #13).
 *
 * A cheap, high-value differentiator (council §3): export the same curated form
 * as an AWX/AAP `survey_spec`, so teams already on AWX can drop it into a Job
 * Template survey. This is a separate `OutputSink` (#1), disjoint from the YAML
 * sink (#12).
 *
 * Field → question mapping:
 *   text    → "text"           number → "integer" (with min/max)
 *   boolean → "multiplechoice" (choices true/false)
 *   select  → "multiplechoice" (choices = option values)
 *   secret  → "password"       — NEVER carries a default/value (§5)
 *   list    → "textarea"       — a repeating group has no native survey type, so
 *                                it maps to a free-text field expecting YAML/JSON.
 *
 * Labels in the schema are i18n keys; pass a `resolve` fn (the integration layer
 * has the translator) for human-readable `question_name`s. Without one, the key
 * is used verbatim, which keeps the sink usable headless (tests/CLI).
 */
import type { Field, FormSchema } from '../types';
import type { OutputArtifact, OutputContext, OutputSink } from '../adapters';

/** Stable id for this sink (referenced by the output picker in #12). */
export const AWX_SURVEY_SPEC_ID = 'awx-survey-spec';

type SurveyType = 'text' | 'textarea' | 'integer' | 'multiplechoice' | 'password';

export interface SurveyQuestion {
  question_name: string;
  question_description: string;
  variable: string;
  type: SurveyType;
  required: boolean;
  default?: string | number;
  min?: number;
  max?: number;
  choices?: string[];
}

export interface SurveySpec {
  name: string;
  description: string;
  spec: SurveyQuestion[];
}

type Resolve = (key: string) => string;
const identity: Resolve = (key) => key;

function questionFor(field: Field, resolve: Resolve): SurveyQuestion {
  const base = {
    question_name: resolve(field.label),
    question_description: field.help ? resolve(field.help) : '',
    variable: field.name,
    required: field.required === true,
  };

  switch (field.type) {
    case 'text':
      return { ...base, type: 'text', ...(field.default !== undefined && { default: field.default }) };
    case 'number':
      return {
        ...base,
        type: 'integer',
        ...(field.default !== undefined && { default: field.default }),
        ...(field.min !== undefined && { min: field.min }),
        ...(field.max !== undefined && { max: field.max }),
      };
    case 'boolean':
      return {
        ...base,
        type: 'multiplechoice',
        choices: ['true', 'false'],
        default: String(field.default ?? false),
      };
    case 'select':
      return {
        ...base,
        type: 'multiplechoice',
        choices: field.options.map((option) => option.value),
        ...(field.default !== undefined && { default: field.default }),
      };
    case 'secret':
      // Password questions never carry a value or default (§5).
      return { ...base, type: 'password' };
    case 'list':
      return {
        ...base,
        type: 'textarea',
        question_description:
          (field.help ? `${resolve(field.help)} ` : '') +
          '(Provide a YAML/JSON list; one entry per item.)',
      };
  }
}

/** Build the survey_spec object from a schema. `resolve` maps i18n keys to copy. */
export function buildSurveySpec(schema: FormSchema, resolve: Resolve = identity): SurveySpec {
  const spec: SurveyQuestion[] = [];
  for (const group of schema.groups) {
    for (const field of group.fields) {
      spec.push(questionFor(field, resolve));
    }
  }
  return { name: '', description: '', spec };
}

/**
 * Create the AWX survey-spec sink, optionally resolving i18n keys to readable
 * question names. The integration layer (#6/#12) passes its translator.
 */
export function createAwxSurveySink(resolve: Resolve = identity): OutputSink {
  return {
    id: AWX_SURVEY_SPEC_ID,
    label: 'output.awxSurveySpec.label',
    render(context: OutputContext): OutputArtifact {
      const spec = buildSurveySpec(context.schema, resolve);
      return {
        filename: 'survey-spec.json',
        contentType: 'application/json',
        content: `${JSON.stringify(spec, null, 2)}\n`,
      };
    },
  };
}

/** Default sink using i18n keys verbatim (headless/test use). */
export const awxSurveySpecSink: OutputSink = createAwxSurveySink();
