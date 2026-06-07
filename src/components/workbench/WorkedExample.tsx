/**
 * Static worked example for a task page (#87).
 *
 * Sample inputs → the exact `group_vars`/`host_vars` YAML → the device-CLI
 * snippet, rendered as plain static content (no interactivity). It doubles as the
 * trust signal and as the SEO body copy the prerender ships to crawlers — so it
 * must render the same server-side and client-side. Text nodes only.
 */
import type { PreviewResult } from '../../core/preview';

export interface WorkedExampleMessages {
  heading: string;
  intro: string;
  yamlLabel: string;
  cliLabel: string;
}

export interface WorkedExampleProps {
  /** Byte-correct YAML for the synthesized sample values. */
  yaml: string;
  /** Rendered device-CLI preview for the same sample. */
  preview: PreviewResult;
  messages: WorkedExampleMessages;
}

export function WorkedExample({ yaml, preview, messages }: WorkedExampleProps) {
  return (
    <section className="worked-example" aria-labelledby="worked-example-heading">
      <h2 id="worked-example-heading">{messages.heading}</h2>
      <p className="worked-example__intro muted">{messages.intro}</p>

      <h3 className="worked-example__label">{messages.yamlLabel}</h3>
      <pre className="worked-example__yaml" tabIndex={0} aria-label={messages.yamlLabel}>
        {yaml}
      </pre>

      {preview.text.trim() !== '' && (
        <>
          <h3 className="worked-example__label">{messages.cliLabel}</h3>
          <pre className="worked-example__cli" tabIndex={0} aria-label={messages.cliLabel}>
            {preview.text}
          </pre>
        </>
      )}
    </section>
  );
}
