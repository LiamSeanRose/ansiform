/**
 * Task-local translator composition (issue #6).
 *
 * A task's field/legend/option labels are i18n keys resolved against its own
 * co-located copy (`TaskModule.messages`), falling back to the global app
 * catalogue for shared chrome (form/preview/output strings). This keeps task
 * copy in the task folder while reusing the one catalogue for everything the
 * whole app shares.
 */
import type { MessageKey, Translate as AppTranslate } from '../i18n';

/**
 * The loosened translate the form and preview accept: any string key (task keys
 * are not part of the app's `MessageKey` union). Resolution falls through to the
 * app catalogue, so unknown keys still degrade to the key itself, never throw.
 */
export type TaskTranslate = (key: string, vars?: Record<string, string | number>) => string;

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

/**
 * Build a translator that prefers task-local copy and falls back to the app
 * catalogue. `local` is one locale's `key → text` map from a `TaskModule`.
 */
export function composeTranslate(appT: AppTranslate, local: Record<string, string>): TaskTranslate {
  return (key, vars) => {
    const text = local[key];
    if (text !== undefined) return interpolate(text, vars);
    return appT(key as MessageKey, vars);
  };
}
