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
  'task.placeholderHeading': 'Task: {task}',
  'task.placeholderBody':
    'This is a routing placeholder. The form engine and curated tasks are not built yet.',

  'notFound.title': 'Page not found',
  'notFound.body': "We couldn't find the page you were looking for.",
  'notFound.backHome': 'Go to the home page',

  'footer.tagline': 'Client-side · zero-egress · free and open source (Apache-2.0)',
} as const;

/** The canonical message catalogue shape every locale must satisfy. */
export type Messages = typeof en;

/** A valid message key. */
export type MessageKey = keyof Messages;
