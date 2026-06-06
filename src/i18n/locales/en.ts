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
  'nav.language': 'Language',

  'home.title': 'Ansiform',
  'home.lede':
    'Fill out a friendly form, get valid Ansible group_vars/host_vars — with a live preview of the device config you already read.',
  'home.tasksHeading': 'Tasks',
  'home.tasksEmpty': 'The curated task library is coming soon.',
  'home.referenceHeading': 'Reference & guides',

  'task.backToHome': '← All tasks',
  'task.placeholderHeading': 'Task: {task}',
  'task.placeholderBody':
    'This is a routing placeholder. The form engine and curated tasks are not built yet.',

  // Reference / SEO pages (#17). Page bodies live in src/pages/reference/content.
  'reference.backToHome': '← Home',
  'reference.tocLabel': 'On this page',

  'notFound.title': 'Page not found',
  'notFound.body': "We couldn't find the page you were looking for.",
  'notFound.backHome': 'Go to the home page',

  'footer.tagline': 'Client-side · zero-egress · free and open source (Apache-2.0)',

  // Form chrome (#4) — shared by every task. Field labels/help come from the
  // task itself; these are the renderer's own copy.
  'form.requiredLabel': '(required)',
  'form.errorSummaryHeading': 'Please fix the following before continuing:',
  'form.submitLabel': 'Validate',
  'form.error.required': '{label} is required.',
  'form.error.pattern': '{label} is not in the expected format.',
  'form.error.min': '{label} must be at least {min}.',
  'form.error.max': '{label} must be at most {max}.',
  'form.error.notANumber': '{label} must be a number.',

  // Device-CLI preview (#5).
  'preview.regionLabel': 'Device CLI preview',
  'preview.heading': 'Live preview (Cisco IOS)',
  'preview.degradedNotice': 'Preview may differ — the YAML output is still valid.',
  'preview.empty': 'Fill in the form to see the device configuration.',

  // Two-pane workbench (#6).
  'workbench.formHeading': 'Configure',
  'workbench.outputHeading': 'Ansible vars (YAML)',
  'workbench.outputPathLabel': 'Suggested file:',

  // Output actions (#12) — copy / download of the group_vars/host_vars YAML.
  'output.copyLabel': 'Copy',
  'output.copied': 'Copied to clipboard.',
  'output.copyFailed': 'Copy failed — select the text and copy manually.',
  'output.downloadLabel': 'Download',
} as const;

/**
 * The canonical message catalogue shape every locale must satisfy: the same keys
 * as `en`, with `string` values (so a locale like `fr` can supply different text
 * while staying type-enforced to the full key set).
 */
export type Messages = Record<keyof typeof en, string>;

/** A valid message key. */
export type MessageKey = keyof Messages;
