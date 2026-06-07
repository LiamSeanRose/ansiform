/**
 * AWX / AAP survey-spec JSON output sink (issue #13).
 *
 * A cheap, high-value differentiator (council §3): the same form a user fills in
 * the browser exports as an Ansible Automation Platform / AWX **survey spec**, so
 * a task drops straight into a Job Template survey. Import it in the AWX UI under
 * a Job Template → Survey → "…" → Import, or PUT it to
 * `/api/v2/job_templates/<id>/survey_spec/`.
 *
 * Privacy (§5): a survey describes the *questions*, not the answers. This sink
 * reads only `schema` and never touches `context.values`, so no form value can
 * leak into the export. `secret` fields map to AWX `password` questions whose
 * `default` is always "" — they carry no value, by construction.
 *
 * Separate `OutputSink`, disjoint from the group_vars YAML sink (#12).
 */
import type {
  BooleanField,
  Field,
  FormSchema,
  NumberField,
  SelectField,
  TextField,
} from '../types';
import type { OutputArtifact, OutputContext, OutputSink } from '../adapters';

/** Stable id for this sink (referenced by the output picker in #12). */
export const AWX_SURVEY_SPEC_ID = 'awx-survey-spec';

/** The AWX survey question types this sink emits. */
type SurveyType = 'text' | 'integer' | 'password' | 'multiplechoice';

/** One AWX survey question. `choices` is newline-joined (classic AWX form). */
export interface SurveyQuestion {
  question_name: string;
  variable: string;
  type: SurveyType;
  required: boolean;
  default: string | number;
  choices?: string;
  min?: number;
  max?: number;
}

/** A complete AWX/AAP `survey_spec` document. */
export interface SurveySpec {
  name: string;
  description: string;
  spec: SurveyQuestion[];
}

function required(field: Field): boolean {
  return field.required ?? false;
}

function textQuestion(field: TextField): SurveyQuestion {
  return {
    question_name: field.name,
    variable: field.name,
    type: 'text',
    required: required(field),
    default: field.default ?? '',
  };
}

function numberQuestion(field: NumberField): SurveyQuestion {
  const q: SurveyQuestion = {
    question_name: field.name,
    variable: field.name,
    type: 'integer',
    required: required(field),
    default: field.default ?? '',
  };
  if (field.min !== undefined) q.min = field.min;
  if (field.max !== undefined) q.max = field.max;
  return q;
}

function booleanQuestion(field: BooleanField): SurveyQuestion {
  // AWX has no boolean question type; the conventional mapping is a true/false
  // multiplechoice. The resulting extra var is the string "true"/"false" (pass
  // it through Ansible's `| bool` in the playbook).
  return {
    question_name: field.name,
    variable: field.name,
    type: 'multiplechoice',
    required: false,
    default: String(field.default ?? false),
    choices: 'true\nfalse',
  };
}

function selectQuestion(field: SelectField): SurveyQuestion {
  return {
    question_name: field.name,
    variable: field.name,
    type: 'multiplechoice',
    required: required(field),
    default: field.default ?? '',
    choices: field.options.map((option) => option.value).join('\n'),
  };
}

function toQuestion(field: Field): SurveyQuestion | null {
  switch (field.type) {
    case 'text':
      return textQuestion(field);
    case 'number':
      return numberQuestion(field);
    case 'boolean':
      return booleanQuestion(field);
    case 'select':
      return selectQuestion(field);
    case 'secret':
      // Never carries a value (§5): always a password question with "" default.
      return {
        question_name: field.name,
        variable: field.name,
        type: 'password',
        required: required(field),
        default: '',
      };
    case 'list':
      // A repeating group has no faithful AWX survey question type — skip it
      // rather than emit a misleading single field. (List tasks export via YAML.)
      return null;
  }
}

/**
 * Build the survey spec from a form schema, in declared field order. Derived
 * from the schema alone — field defaults, not user values — so the export is a
 * reusable survey template that carries no entered data.
 */
export function buildSurveySpec(schema: FormSchema): SurveySpec {
  const spec: SurveyQuestion[] = [];
  for (const group of schema.groups) {
    for (const field of group.fields) {
      const question = toQuestion(field);
      if (question) spec.push(question);
    }
  }
  return { name: 'Ansiform survey', description: '', spec };
}

/**
 * Build one survey spec spanning several schemas — the `/build` composition case
 * — in instance order. AWX requires each `variable` to be unique across a survey,
 * so a variable that recurs across tasks keeps its FIRST occurrence and later
 * duplicates are dropped: the same first-wins rule the var-file composition uses
 * for colliding keys. Schema-only, like {@link buildSurveySpec} — carries no
 * entered values.
 */
export function buildCombinedSurveySpec(schemas: FormSchema[]): SurveySpec {
  const spec: SurveyQuestion[] = [];
  const seen = new Set<string>();
  for (const schema of schemas) {
    for (const question of buildSurveySpec(schema).spec) {
      if (seen.has(question.variable)) continue;
      seen.add(question.variable);
      spec.push(question);
    }
  }
  return { name: 'Ansiform survey', description: '', spec };
}

/**
 * The AWX/AAP survey-spec output sink.
 *
 * `label` is an i18n key resolved by the output picker (#12), mirroring the YAML
 * sink. `render` intentionally ignores `context.values`.
 */
export const awxSurveySpecSink: OutputSink = {
  id: AWX_SURVEY_SPEC_ID,
  label: 'output.awxSurveySpec.label',
  render(context: OutputContext): OutputArtifact {
    const spec = buildSurveySpec(context.schema);
    return {
      filename: 'survey-spec.json',
      contentType: 'application/json',
      content: `${JSON.stringify(spec, null, 2)}\n`,
    };
  },
};
