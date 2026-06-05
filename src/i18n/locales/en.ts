/**
 * English (EN) strings — the source-of-truth locale.
 *
 * All user-facing copy lives here so the UI never hard-codes text. Additional
 * locales (FR is planned per council §6) implement this same `Messages` shape;
 * the French pass is a differentiator but does NOT gate the English launch.
 *
 * Keep keys flat and namespaced with dots (e.g. `home.title`). Values may use
 * `{name}` placeholders that the `t()` helper interpolates.
 */
export const en = {
  'app.name': 'Ansiform',
  'app.tagline': 'Ansible templates without the YAML',

  'nav.home': 'Home',
  'nav.skipToContent': 'Skip to main content',

  'home.title': 'Ansiform',
  'home.lede':
    'Fill out a friendly form, get valid Ansible group_vars/host_vars — with a live preview of the device config you already read.',
  'home.tasksHeading': 'Tasks',
  'home.tasksEmpty': 'The curated task library is coming soon.',

  'task.backToHome': '← All tasks',

  // Two-pane workbench chrome (issue #6), shared by every task.
  'workbench.formRegionLabel': 'Task form',

  // Form renderer chrome (#4). `errors.*` are interpolated with {label}/{min}/{max}.
  'form.required': '(required)',
  'form.errorSummaryHeading': 'Please fix the following',
  'form.submit': 'Validate form',
  'form.error.required': '{label} is required',
  'form.error.pattern': '{label} is not in the expected format',
  'form.error.min': '{label} must be at least {min}',
  'form.error.max': '{label} must be at most {max}',
  'form.error.notANumber': '{label} must be a number',

  // Device-CLI preview pane (#5).
  'preview.regionLabel': 'Device CLI preview',
  'preview.heading': 'Device CLI preview',
  'preview.degradedNotice':
    'Preview may differ from the device — the generated vars are still valid.',
  'preview.empty': 'Fill out the form to see the device configuration.',

  // group_vars/host_vars output (display only here; copy/download land in #12).
  'output.heading': 'Ansible vars',
  'output.pathLabel': 'Suggested path',
  'output.regionLabel': 'Generated Ansible vars YAML',

  'notFound.title': 'Page not found',
  'notFound.body': "We couldn't find the page you were looking for.",
  'notFound.backHome': 'Go to the home page',

  'footer.tagline': 'Client-side · zero-egress · free and open source (Apache-2.0)',
} as const;

/** The canonical message catalogue shape every locale must satisfy. */
export type Messages = typeof en;

/** A valid message key. */
export type MessageKey = keyof Messages;
