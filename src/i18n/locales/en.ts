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
  'nav.build': 'Build',

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
  'form.error.incomplete': '{label} has rows that need attention.',
  // List / repeating-group controls (v2).
  'form.list.add': 'Add row',
  'form.list.remove': 'Remove row {index}',
  'form.list.row': 'Row {index}',
  'form.list.added': 'Row added.',
  'form.list.removed': 'Row {index} removed.',
  'form.list.empty': 'No rows yet — add one to begin.',

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

  // Composition / build page (#26).
  'build.title': 'Build a var-file set',
  'build.lede':
    'Add several tasks, fill each, and assemble a complete group_vars/host_vars file set in one pass — everything stays in your browser.',
  'build.addLabel': 'Add a task',
  'build.addButton': 'Add',
  'build.empty': 'No tasks yet — add one above to start composing.',
  'build.removeTask': 'Remove this task',
  'build.scopeLegend': 'Output scope',
  'build.scopeKindLabel': 'Scope',
  'build.scopeKindGroup': 'group_vars',
  'build.scopeKindHost': 'host_vars',
  'build.scopeNameLabel': 'Name',
  'build.previewHeading': 'Preview',
  'build.outputHeading': 'Composed files',
  'build.outputEmpty': 'Filled tasks appear here as group_vars / host_vars files.',
  'build.collision': 'Conflicting keys (last value wins — resolve before use): {keys}',

  // Template reader / explainer (#30) — read-only, beta, walled off from curated.
  'nav.reader': 'Template reader',
  'reader.title': 'Template reader',
  'reader.beta': 'Beta · read-only · reads your pasted template, not a curated task',
  'reader.lede':
    'Paste an existing Cisco IOS / Jinja2 template to see what it expects — the variables to fill, the filters it uses, and a live device-CLI preview. Nothing you paste leaves your browser or is stored.',
  'reader.pasteLabel': 'Paste a template',
  'reader.pasteHelp':
    'Jinja2 group_vars/host_vars or a role template. Stays in memory only — never saved, shared, or sent anywhere.',
  'reader.pastePlaceholder': 'interface {{ interface }}\n ip address {{ ip_address | ipaddr(\'address\') }} {{ ip_address | ipaddr(\'netmask\') }}',
  'reader.empty': 'Paste a template above to read it.',
  'reader.tooLarge': 'That template is larger than {max} KB — trim it and paste again.',
  'reader.templateHeading': 'Template',
  'reader.variablesHeading': 'Variables to fill',
  'reader.variablesNone': 'No variables found in this template.',
  'reader.varSampleHelp': 'Sample value — not validated. Used only to render the preview below.',
  'reader.secretBadge': 'secret — masked',
  'reader.filtersHeading': 'Filters used',
  'reader.filtersNone': 'No filters — values are inserted as-is.',
  'reader.tier.exact': 'exact',
  'reader.tier.approximate': 'approximate',
  'reader.tier.unsupported': 'unsupported',
  'reader.previewHeading': 'Live preview (Cisco IOS)',
  'reader.foundCount':
    'Found {count} variable(s). Variables defined with set, or used only inside loops, may not be listed — review the template itself before relying on this.',
  'reader.loopVars': 'Loop variables (filled per row, not above): {names}',
  'reader.vaultNote':
    'This template contains Vault-encrypted data. It is shown as-is on your screen but never decoded, stored, or evaluated.',
  'reader.fidelity.exact':
    'Preview is exact — this template uses only filters Ansiform renders exactly.',
  'reader.fidelity.approximate':
    'Preview may differ — the underlying values are still correct. Some filters are approximated here.',
  'reader.fidelity.unsupported':
    'Preview may differ — this template uses filters or constructs Ansiform cannot render exactly, so the variable list may be incomplete. Verify against the real template.',
} as const;

/**
 * The canonical message catalogue shape every locale must satisfy: the same keys
 * as `en`, with `string` values (so a locale like `fr` can supply different text
 * while staying type-enforced to the full key set).
 */
export type Messages = Record<keyof typeof en, string>;

/** A valid message key. */
export type MessageKey = keyof Messages;
