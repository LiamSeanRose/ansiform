/**
 * Re-export shim (issue #85).
 *
 * The `argument_specs` importer engine graduated from the beta `/reader` to a
 * first-class home at `src/core/import/argument-specs.ts` (driving the `/import`
 * route). This shim keeps the reader's beta paste-source selector — and any other
 * existing importer — working unchanged: same names, same module path.
 */
export * from '../../core/import/argument-specs';
