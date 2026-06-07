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
  'app.loading': 'Loading…',

  'nav.home': 'Home',
  'nav.skipToContent': 'Skip to main content',
  'nav.language': 'Language',
  'nav.tasks': 'Tasks',
  'nav.build': 'Build',
  'nav.primary': 'Primary',

  'home.title': 'Ansiform',
  'home.lede':
    'Fill out a friendly form, get valid Ansible group_vars/host_vars — with a live preview of the device config you already read.',
  'home.tasksHeading': 'Tasks',
  'home.tasksEmpty': 'The curated task library is coming soon.',
  'home.referenceHeading': 'Reference & guides',
  // Hero CTAs + section header (#92).
  'home.ctaBrowse': 'Browse the task library',
  'home.ctaCompose': 'Compose a var-file set',
  'home.ctaRead': 'Read a template',
  'home.viewAll': 'View all {count} tasks →',

  'task.backToHome': '← All tasks',
  'task.relatedHeading': 'Related tasks',
  // Breadcrumb trail (#92).
  'breadcrumb.label': 'Breadcrumb',
  'breadcrumb.home': 'Home',
  // Static worked example on each task page (#87) — sample → YAML → device CLI.
  'task.example.heading': 'Worked example',
  'task.example.intro':
    'Sample inputs, the exact Ansible vars they produce, and the device CLI they render to.',
  'task.example.yamlLabel': 'group_vars / host_vars (YAML)',
  'task.example.cliLabel': 'Device CLI',
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
  // Advisory network-validation warnings (#86) — shown but NEVER blocking; the
  // YAML still exports. "Treat as text" dismisses one for the current value.
  'form.warning.ipv4': "This doesn't look like a valid IPv4 address. The YAML still exports.",
  'form.warning.cidr':
    "This doesn't look like a valid CIDR (e.g. 10.0.0.0/24, /31 for point-to-point). The YAML still exports.",
  'form.warning.ipv6': "This doesn't look like a valid IPv6 address. The YAML still exports.",
  'form.warning.mac': "This doesn't look like a valid MAC address. The YAML still exports.",
  'form.warning.vlan': 'A VLAN ID is normally 1–4094. The YAML still exports.',
  'form.warning.vlanReserved': 'VLANs 1002–1005 are reserved on Cisco IOS. The YAML still exports.',
  'form.warning.asn':
    'An ASN is 1–4294967295 (asplain) or asdot like 65000.1. The YAML still exports.',
  'form.warning.ifname': "This doesn't look like an interface name. The YAML still exports.",
  'form.warning.treatAsText': 'Treat as text',
  // List / repeating-group controls (v2).
  'form.list.add': 'Add row',
  'form.list.remove': 'Remove row {index}',
  'form.list.row': 'Row {index}',
  'form.list.added': 'Row added.',
  'form.list.removed': 'Row {index} removed.',
  'form.list.empty': 'No rows yet — add one to begin.',

  // Device-CLI preview (#5). `{vendor}` resolves to the active preview target.
  'preview.regionLabel': 'Device CLI preview',
  'preview.heading': 'Live preview ({vendor})',
  'preview.degradedNotice': 'Preview may differ — the YAML output is still valid.',
  'preview.empty': 'Fill in the form to see the device configuration.',

  // Two-pane workbench (#6).
  'workbench.formHeading': 'Configure',
  'workbench.outputHeading': 'Ansible vars (YAML)',
  'workbench.outputPathLabel': 'Suggested file:',

  // Per-vendor preview selector (#27). The vars are vendor-independent; only the
  // previewed device CLI changes.
  'workbench.vendorSelectLabel': 'Preview target',
  'vendor.cisco-ios': 'Cisco IOS',
  'vendor.cisco-iosxe': 'Cisco IOS-XE',
  'vendor.cisco-nxos': 'Cisco NX-OS',
  'vendor.arista-eos': 'Arista EOS',
  'vendor.cisco-asa': 'Cisco ASA',
  'vendor.cisco-iosxr': 'Cisco IOS-XR',
  'vendor.cradlepoint-ncos': 'Cradlepoint NCOS',
  'vendor.juniper-junos': 'Juniper Junos',
  'vendor.vyos': 'VyOS',
  'vendor.huawei-vrp': 'Huawei VRP',

  // Output actions (#12) — copy / download of the group_vars/host_vars YAML.
  'output.copyLabel': 'Copy',
  'output.copied': 'Copied to clipboard.',
  'output.copyFailed': 'Copy failed — select the text and copy manually.',
  'output.downloadLabel': 'Download',
  // AWX/AAP survey-spec export (#33) — a local file, never a server round-trip.
  'output.awxSurveySpec.label': 'AWX survey (.json)',
  // Vault hand-off (#80) — teach the encrypt_string command for each secret key.
  'output.vault.heading': 'Encrypt your secrets with Ansible Vault',
  'output.vault.intro':
    'Run these where Ansible runs to vault each secret. Each command prompts for the value — type it, then press Enter and Ctrl-D. The value is typed at your shell and never enters this tool.',
  'output.vault.copyLabel': 'Copy',
  'output.vault.copyAllLabel': 'Copy all',
  'output.vault.copied': 'Command copied — the value is still typed at your shell.',
  'output.vault.copyFailed': 'Copy failed — select the command and copy manually.',
  // Run recipe (#83) — where the files sit + the ansible-playbook command. Guidance,
  // not a generated playbook (playbook.yml is the user's own).
  'output.runRecipe.heading': 'Run it',
  'output.runRecipe.intro':
    'Drop these into your Ansible project and run. This is guidance, not a generated playbook — playbook.yml is your own.',
  'output.runRecipe.layoutLabel': 'File layout',
  'output.runRecipe.commandLabel': 'Command',
  'output.runRecipe.copyLabel': 'Copy command',
  'output.runRecipe.copied': 'Command copied to clipboard.',
  'output.runRecipe.copyFailed': 'Copy failed — select the command and copy manually.',
  // Merge into an existing file (#82) — diff generated vars against a pasted file.
  'output.varsDiff.summary': 'Already have a var file? Show what this would change',
  'output.varsDiff.description':
    'Paste your current group_vars/host_vars file to see, key by key, what this would add or change — and copy just those lines to merge in by hand. Nothing is rewritten for you.',
  'output.varsDiff.pasteLabel': 'Your existing file',
  'output.varsDiff.pasteHelp':
    'Stays in your browser — never uploaded, saved, or shared. Only top-level keys are compared.',
  'output.varsDiff.placeholder': '# paste your group_vars/host_vars YAML here',
  'output.varsDiff.added': 'New keys to add',
  'output.varsDiff.changed': 'Keys that would change',
  'output.varsDiff.unchanged': 'Already up to date',
  'output.varsDiff.current': 'currently',
  'output.varsDiff.noChanges': 'Your file already has every generated key — nothing to add.',
  'output.varsDiff.blockHeading': 'Lines to add to your file',
  'output.varsDiff.blockNote':
    'Added and changed keys only, in order. Secret values are real here (this is the file you save) — vault them as needed.',
  'output.varsDiff.copyLabel': 'Copy block',
  'output.varsDiff.copied': 'Block copied to clipboard.',
  'output.varsDiff.copyFailed': 'Copy failed — select the text and copy manually.',
  'output.varsDiff.errorTooLarge': 'That file is too large to compare here.',
  'output.varsDiff.errorParse': 'That does not parse as YAML — check the indentation and try again.',
  'output.varsDiff.errorShape': 'A group_vars/host_vars file must be a mapping of keys at the top level.',
  // Per-key selection of which changes to apply (#93).
  'output.varsDiff.includeKey': 'Include {key} in the block to paste',
  'output.varsDiff.noneSelected': 'No keys selected — tick at least one to build a block to paste.',

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
  // Accessible names that disambiguate the per-task / per-file action buttons
  // (#44). Each contains its button's visible label so it satisfies "label in name".
  'build.removeTaskNamed': 'Remove this task: {title}',
  'build.downloadFileNamed': 'Download {path}',
  // Inventory skeleton (#81) — the group/host structure that makes the var files
  // take effect. A scaffold: group membership is left for the user to fill in.
  'build.downloadInventory': 'Download inventory (hosts.ini)',
  'build.inventoryNote':
    'Scaffold to match the files above — add each group’s member hosts before use. The “all” group is implicit and needs no entry.',
  // Structure-only share links (#88) — a link carries the task selection only.
  'build.shareLink': 'Copy share link',
  'build.shareCopied': 'Link copied — it carries the task selection only, never your values.',
  'build.shareCopyFailed': 'Copy failed — select the address bar and copy manually.',
  'build.shareHelp':
    'Share a link that pre-selects these tasks for someone else to fill. No field values are ever included.',

  // Task discovery index (#35) — /tasks, grouped by function + filterable.
  'tasksIndex.title': 'Task library',
  'tasksIndex.lede':
    'Browse every task by function, each labelled with the device CLI it renders. Open one to fill in the form and get valid Ansible vars.',
  'tasksIndex.searchLabel': 'Filter tasks',
  'tasksIndex.searchPlaceholder': 'Search by name or keyword…',
  'tasksIndex.resultsCount': '{count} task(s)',
  'tasksIndex.empty': 'No tasks match your search.',
  'tasksIndex.vendorsLabel': 'Renders:',
  // Left category nav + filters (#92).
  'tasksIndex.categoriesLabel': 'Categories',
  'tasksIndex.allCategories': 'All tasks',
  'tasksIndex.vendorFilterLabel': 'Filter by platform',
  'tasksIndex.clearFilters': 'Clear filters',
  'tasksIndex.category.interfaces': 'Interfaces & addressing',
  'tasksIndex.category.switching': 'VLANs & switching',
  'tasksIndex.category.routing': 'Routing',
  'tasksIndex.category.policy': 'Traffic policy',
  'tasksIndex.category.firewall': 'Firewall (ASA)',
  'tasksIndex.category.edge': 'Cellular & edge (Cradlepoint)',
  'tasksIndex.category.management': 'Management & hardening',
  'tasksIndex.category.other': 'Other',

  // Template reader / explainer (#30) — read-only, walled off from curated tasks.
  'nav.reader': 'Template reader',
  'reader.title': 'Template reader',
  'reader.scopeNote': 'Read-only · reads the template you paste, not a curated task',
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
  'reader.previewHeading': 'Live preview ({vendor})',
  'reader.setFormNote':
    'This looks like a set-form template (Junos, VyOS, or Cradlepoint NCOS). The preview is approximate — choose the matching platform above.',
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

  // Template reader — edit mode (#31). All-text extracted fields, no inference.
  'reader.edit.ack':
    'I understand types and validation are not inferred — verify these values before deploying.',
  'reader.edit.enter': 'Edit these variables',
  'reader.edit.exit': 'Back to read-only',
  'reader.edit.uninferred':
    'Every field below is plain text with no inferred type, format, or validation — exactly what was extracted, nothing more. The generated YAML is byte-correct for the values you enter; verify them against the real template before deploying.',
  'reader.edit.formHeading': 'Fill the extracted variables',
  'reader.edit.fieldsLegend': 'Extracted variables (untyped)',
  'reader.edit.submitLabel': 'Refresh preview',
  'reader.edit.outputHeading': 'Extracted vars (YAML)',

  // Template reader — paste-source selector (#32).
  'reader.source.label': 'What are you pasting?',
  'reader.source.template': 'Jinja2 template',
  'reader.source.argspec': 'argument_specs.yml (exact)',

  // Template reader — argument_specs importer (#32). Declarative → exact form.
  'reader.argspec.intro':
    'A role argument_specs declares each variable’s type, requiredness, default, and choices — so this form is exact, not a guess: every field mirrors the role’s declared contract, with nothing inferred. There is no device-CLI preview here: a spec describes variables, not rendered config.',
  'reader.argspec.pasteLabel': 'Paste meta/argument_specs.yml',
  'reader.argspec.pasteHelp':
    'The role’s declared spec. Stays in memory only — never saved, shared, or sent anywhere.',
  'reader.argspec.placeholder':
    'argument_specs:\n  main:\n    options:\n      vlan_id:\n        type: int\n        required: true',
  'reader.argspec.empty': 'Paste an argument_specs document above to build an exact form.',
  'reader.argspec.tooLarge': 'That spec is larger than {max} KB (or too deeply aliased) — trim it and paste again.',
  'reader.argspec.parseError': 'That is not valid YAML — check the indentation and paste again.',
  'reader.argspec.shapeError':
    'No argument_specs options found. Expected an argument_specs map (or a single entry point with options).',
  'reader.argspec.entrypoint': 'Entry point: {name}',
  'reader.argspec.approximated':
    '{count} option(s) could not be represented exactly and are shown as plain text — set their structure by hand: {names}',
  'reader.argspec.noPreview':
    'No device-CLI preview — a spec declares variables, not rendered configuration.',
  'reader.argspec.formHeading': 'Fill the declared variables',
  'reader.argspec.outputHeading': 'Role vars (YAML)',
  'reader.argspec.submitLabel': 'Validate',
  // Cross-link from the beta reader to the first-class importer (#85).
  'reader.toImportText': 'Importing a role’s argument_specs.yml?',
  'reader.toImportLink': 'Use the first-class importer →',

  // Bring-your-own role-spec importer (#85) — first-class /import route.
  'nav.import': 'Import a role spec',
  'import.title': 'Import a role’s argument_specs',
  'import.metaDescription':
    'Paste an Ansible role’s meta/argument_specs.yml and get the exact form it declares — fill it in, export the group_vars/host_vars the role expects. Client-side, zero egress.',
  'import.lede':
    'Already have roles? Paste a role’s meta/argument_specs.yml to get the exact form it declares — every field mirrors the role’s contract — then export the group_vars/host_vars that drop straight into your repo.',
  'import.exactNote':
    'Exact, not a guess: types, requiredness, defaults, and choices all come from the spec’s own declarations. Nothing is inferred.',
  'import.noPreviewNote':
    'No device-CLI preview here, by design — a spec declares variables, not rendered config, so there is no fidelity claim to make. The YAML you export is byte-correct for the values you enter.',
  'import.readerLinkText': 'Pasting a raw Jinja2 template instead?',
  'import.readerLink': 'Open the template reader (beta) →',
  'import.pasteLabel': 'Paste meta/argument_specs.yml',
  'import.pasteHelp':
    'The role’s declared spec. Stays in memory only — never saved, shared, or sent anywhere.',
  'import.placeholder':
    'argument_specs:\n  main:\n    options:\n      vlan_id:\n        type: int\n        required: true',
  'import.empty': 'Paste an argument_specs document above to build the exact form it declares.',
  'import.tooLarge':
    'That spec is larger than {max} KB (or too deeply aliased) — trim it and paste again.',
  'import.parseError': 'That is not valid YAML — check the indentation and paste again.',
  'import.shapeError':
    'No argument_specs options found. Expected an argument_specs map (or a single entry point with options).',
  'import.entrypoint': 'Entry point: {name}',
  'import.approximated':
    '{count} option(s) could not be represented exactly and are shown as plain text — set their structure by hand: {names}',
  'import.formHeading': 'Fill the declared variables',
  'import.outputHeading': 'Role vars (YAML)',
  'import.submitLabel': 'Validate',
} as const;

/**
 * The canonical message catalogue shape every locale must satisfy: the same keys
 * as `en`, with `string` values (so a locale like `fr` can supply different text
 * while staying type-enforced to the full key set).
 */
export type Messages = Record<keyof typeof en, string>;

/** A valid message key. */
export type MessageKey = keyof Messages;
