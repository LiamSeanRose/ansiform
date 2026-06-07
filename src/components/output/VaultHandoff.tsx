/**
 * Vault hand-off panel (issue #80).
 *
 * Shows the exact `ansible-vault encrypt_string` commands for the secret fields
 * in play, each copyable, with a one-line explainer that the value is typed at
 * the user's own shell and never enters this tool. Presentational only: it takes
 * already-built commands (key names, never values) and resolved copy. Rendered by
 * {@link YamlOutputPanel} when the active schema has at least one secret field.
 *
 * Spine (§5): no value is ever shown, requested, stored, or placed in a command —
 * the command prompts for the value on the user's own machine. Command text is
 * placed as DOM text nodes only (never `innerHTML`); copy is local (no network).
 */
import { useState } from 'react';
import type { VaultCommand } from '../../core/output/vault-commands';
import { copyText } from './clipboard';

/** Externalized hand-off copy; the caller builds this from the i18n catalogue. */
export interface VaultHandoffMessages {
  heading: string;
  /** One-line explainer that the value is typed locally, never in the browser. */
  intro: string;
  /** Per-command copy-button label. */
  copyLabel: string;
  /** "Copy all" label, shown only when there is more than one command. */
  copyAllLabel: string;
  copiedStatus: string;
  copyFailedStatus: string;
}

export interface VaultHandoffProps {
  commands: VaultCommand[];
  messages: VaultHandoffMessages;
}

export function VaultHandoff({ commands, messages }: VaultHandoffProps) {
  const [status, setStatus] = useState('');
  if (commands.length === 0) return null;

  const announce = async (text: string) => {
    const ok = await copyText(text);
    setStatus(ok ? messages.copiedStatus : messages.copyFailedStatus);
  };

  return (
    <section className="vault-handoff" aria-label={messages.heading}>
      <h3 className="vault-handoff__heading">{messages.heading}</h3>
      <p className="vault-handoff__intro">{messages.intro}</p>
      <ul className="vault-handoff__list">
        {commands.map((cmd) => (
          <li className="vault-handoff__item" key={cmd.name}>
            {/* Text node only — the command is data, never markup. */}
            <code className="vault-handoff__command">{cmd.command}</code>
            <button
              type="button"
              className="output__action"
              onClick={() => announce(cmd.command)}
            >
              {messages.copyLabel}
            </button>
          </li>
        ))}
      </ul>
      {commands.length > 1 && (
        <button
          type="button"
          className="output__action"
          onClick={() => announce(commands.map((c) => c.command).join('\n'))}
        >
          {messages.copyAllLabel}
        </button>
      )}
      <p className="output__status" role="status" aria-live="polite">
        {status}
      </p>
    </section>
  );
}
