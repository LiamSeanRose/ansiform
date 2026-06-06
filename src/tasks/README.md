# Task library — authoring guide

Each curated task is **one self-contained folder** under `src/tasks/<slug>/`. Adding a
task is adding a folder — there is **no shared index to edit and no registration call**.
`registry.ts` discovers tasks with Vite's `import.meta.glob('./*/index.ts')`, so the
wave-3 fan-out (#7–#11) is conflict-free: five agents can add five folders in parallel
without touching the same file.

## Add a task

1. Create `src/tasks/<slug>/index.ts` exporting a `TaskModule` named `task`.
2. (Recommended) Add `src/tasks/<slug>/task.test.ts` asserting the YAML and the CLI
   preview for a representative filled form.

That's it. The route `/tasks/<slug>`, the home-page listing, and per-task `<title>`/meta
all light up automatically.

## The `TaskModule` shape

```ts
import type { FormSchema } from '../../core';
import type { TaskModule } from '../registry';

const schema: FormSchema = { groups: [ /* fields … */ ] };

// Jinja2 → device CLI. Authored for Ansible's environment (trim_blocks=True),
// so a newline right after `{% endif %}` is swallowed — optional lines leave no gap.
const template = [ /* lines … */ ].join('\n');

export const task: TaskModule = {
  definition: {
    slug: '<slug>',                 // must equal the folder name
    title: '…',                     // H1 + <title>
    description: '…',               // <meta name="description">
    schema,
    template,
    defaultScope: { kind: 'host', name: 'switch1' }, // or { kind: 'group', name: 'all' }
  },
  messages: {
    // Task-scoped copy. The schema's label/help/legend/option values are KEYS
    // resolved from here (English required; FR is added by #16). Keeping copy in
    // the task folder — not the global en.ts — is what keeps the fan-out
    // free of shared-file edits.
    en: {
      'task.<slug>.field.<name>.label': '…',
      'task.<slug>.field.<name>.help': '…',
    },
  },
};
```

## Conventions

- **v1 = Cisco IOS only.** Build from public networking knowledge; never seed real
  inventory/IPs (council §scope).
- **Correctness:** the YAML vars come straight from the field values and are always
  correct. The template only drives the *preview*. Prefer `exact`-tier filters
  (`ipaddr`, `default`); anything non-exact makes the preview show its visible
  "preview may differ" notice — never a silently-wrong preview.
- **`omitWhenBlank: true`** on optional fields so a blank value is dropped from the
  vars (`default(omit)` semantics) rather than emitted as empty.
- **Secrets** use `type: 'secret'`; they are masked in the preview and never seeded.
- **Vendor (#21):** `TaskMeta`/`TaskDefinition` carry an optional `vendor` field. It
  is additive — omit it and the task is treated as the default, `cisco-ios`. The
  `Vendor` union (currently just `'cisco-ios'`) grows when multi-vendor content
  lands (#27); until then leave `vendor` unset. Resolve a task's vendor with
  `vendorOf(definition)` (re-exported from `../registry`) rather than reading the
  field directly, so the default is applied consistently.

See `interface-ip/` for the reference implementation.
