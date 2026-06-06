/**
 * Public barrel for the core contracts. Downstream modules import from
 * `../core` rather than reaching into individual files.
 */
export type {
  BaseField,
  BooleanField,
  Field,
  FieldGroup,
  FieldType,
  FieldValue,
  FormSchema,
  FormValues,
  ListField,
  NumberField,
  RowValues,
  ScalarField,
  ScalarValue,
  SecretField,
  SelectField,
  SelectOption,
  TextField,
} from './types';

export type {
  OutputArtifact,
  OutputContext,
  OutputSink,
  TemplateSource,
} from './adapters';

export type {
  TaskDefinition,
  TaskMeta,
  TaskScope,
  TaskSummary,
} from './tasks/types';

export type { FidelityTier, FilterDefinition, FilterRegistry } from './filters/registry';
export { createFilterRegistry } from './filters/registry';
