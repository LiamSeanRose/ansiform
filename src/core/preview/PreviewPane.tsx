/**
 * Accessible, sandboxed device-CLI preview pane (issue #5, council §5/§6).
 *
 * Renders a `PreviewResult` (from `renderPreview`) on screen. Two non-negotiable
 * properties:
 *
 *  - **Sandbox (§5).** The rendered CLI is placed in the DOM as a *text node*
 *    only — `{result.text}` as a JSX child. There is no `innerHTML`,
 *    `dangerouslySetInnerHTML`, or HTML parsing anywhere on this path, so a value
 *    that happens to contain `<` / `>` / markup can never become live DOM.
 *  - **Visible degradation (§11).** When `fidelity` is not `exact`, a notice is
 *    shown ("preview may differ — output is still valid") so an approximate or
 *    unsupported render is never mistaken for ground truth.
 *
 * Accessibility (§6): the preview is an `aria-live="polite"` region so AT
 * announces updates as the form changes, and it is focusable for keyboard users
 * who want to read/scroll it. Per the project rule, the component holds NO
 * literal user-facing copy — all of it arrives via `messages`, which the
 * integration layer (#6) builds from the i18n catalogue.
 */
import { useId } from 'react';
import type { PreviewResult } from './render';

/** Externalized preview copy. The integration layer (#6) supplies these. */
export interface PreviewMessages {
  /** Accessible name for the live region, e.g. "Device CLI preview". */
  regionLabel: string;
  /** Optional visible heading above the rendered CLI. */
  heading?: string;
  /** Notice shown when fidelity is not `exact`. */
  degradedNotice: string;
  /** Placeholder shown when there is nothing to render yet. */
  empty?: string;
}

export interface PreviewPaneProps {
  result: PreviewResult;
  messages: PreviewMessages;
}

export function PreviewPane({ result, messages }: PreviewPaneProps) {
  const headingId = useId();
  const degraded = result.fidelity !== 'exact';
  const isEmpty = result.text.length === 0;

  return (
    <section
      className="preview"
      aria-labelledby={messages.heading ? headingId : undefined}
      aria-label={messages.heading ? undefined : messages.regionLabel}
    >
      {messages.heading && (
        <h2 className="preview__heading" id={headingId}>
          {messages.heading}
        </h2>
      )}

      {degraded && (
        <p className="preview__notice" role="status">
          {messages.degradedNotice}
        </p>
      )}

      {/* Text-node sandbox: never innerHTML. `<pre>` preserves CLI whitespace. */}
      <pre
        className="preview__cli"
        aria-live="polite"
        aria-label={messages.regionLabel}
        tabIndex={0}
      >
        {isEmpty ? (messages.empty ?? '') : result.text}
      </pre>
    </section>
  );
}
