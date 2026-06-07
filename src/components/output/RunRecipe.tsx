/**
 * Run recipe panel (issue #83) — the "now what?" guidance beside the output.
 *
 * Shows where the generated var files sit (an ASCII directory tree) and the
 * literal `ansible-playbook` command to run them, tailored from the names the
 * user entered. Presentational only: it takes an already-built {@link RunRecipe}
 * and resolved copy. Rendered on the task page (single file) and the build page
 * (composed set).
 *
 * Spine: this is **guidance, not execution** — the `playbook.yml` it references is
 * the user's own; we never emit a runnable playbook. All text is placed as DOM
 * text nodes only (never `innerHTML`); the copy action is local (no network).
 */
import { useState } from 'react';
import type { RunRecipe as RunRecipeData } from '../../core/output/run-recipe';
import { copyText } from './clipboard';

/** Externalized copy; the page builds this from the i18n catalogue. */
export interface RunRecipeMessages {
  heading: string;
  /** One-line explainer: guidance, not a generated playbook. */
  intro: string;
  /** Label above the directory tree. */
  layoutLabel: string;
  /** Label above the command. */
  commandLabel: string;
  /** Copy-button label for the command. */
  copyLabel: string;
  copiedStatus: string;
  copyFailedStatus: string;
}

export interface RunRecipeProps {
  recipe: RunRecipeData;
  messages: RunRecipeMessages;
}

export function RunRecipe({ recipe, messages }: RunRecipeProps) {
  const [status, setStatus] = useState('');

  const handleCopy = async () => {
    const ok = await copyText(recipe.command);
    setStatus(ok ? messages.copiedStatus : messages.copyFailedStatus);
  };

  return (
    <section className="run-recipe" aria-label={messages.heading}>
      <h3 className="run-recipe__heading">{messages.heading}</h3>
      <p className="run-recipe__intro">{messages.intro}</p>

      <p className="run-recipe__label">{messages.layoutLabel}</p>
      {/* Text node only — the tree is data, never markup. */}
      <pre className="run-recipe__tree" tabIndex={0}>
        {recipe.tree}
      </pre>

      <div className="run-recipe__command-header">
        <p className="run-recipe__label">{messages.commandLabel}</p>
        <button type="button" className="output__action" onClick={handleCopy}>
          {messages.copyLabel}
        </button>
      </div>
      <pre className="run-recipe__command" tabIndex={0}>
        {recipe.command}
      </pre>

      <p className="output__status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
