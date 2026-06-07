/**
 * group_vars/host_vars output panel (issue #12).
 *
 * Renders the always-correct YAML artifact (#2) with its suggested var-file path
 * and Copy / Download actions. The download is byte-identical to what is shown
 * (same `artifact.content`), goes out as a Blob (never a `data:`/URL-encoded
 * value — council §5), and nothing is ever persisted. Action results are
 * announced through an `aria-live` `role="status"` region (§6). The YAML is
 * placed as a DOM text node only — never `innerHTML`.
 *
 * Note: secrets legitimately appear in this YAML — it is the file the user saves
 * and vaults. That is the intended sharing path (export a file, never a link).
 */
import { useEffect, useId, useRef, useState } from 'react';
import type { OutputArtifact } from '../../core';
import { copyText } from './clipboard';
import { downloadText } from './download';
import { VaultHandoff, type VaultHandoffMessages } from './VaultHandoff';
import { buildVaultCommands } from '../../core/output/vault-commands';

/** Externalized output-panel copy; the page builds this from the i18n catalogue. */
export interface OutputMessages {
  heading: string;
  pathLabel: string;
  copyLabel: string;
  copiedStatus: string;
  copyFailedStatus: string;
  downloadLabel: string;
  /** Vault hand-off copy (#80). When omitted, the hand-off is never shown. */
  vault?: VaultHandoffMessages;
}

export interface YamlOutputPanelProps {
  artifact: OutputArtifact;
  messages: OutputMessages;
  /**
   * Secret-field key names in the active schema (#80) — names only, never values.
   * When non-empty *and* `messages.vault` is provided, the vault hand-off panel
   * teaches the `ansible-vault encrypt_string` command for each one.
   */
  secretNames?: readonly string[];
}

export function YamlOutputPanel({ artifact, messages, secretNames }: YamlOutputPanelProps) {
  const headingId = useId();
  const [status, setStatus] = useState('');
  const dismissTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Toast-style: announce via the aria-live region (never steals focus) and
  // auto-clear after a few seconds so it reads as transient feedback (#92).
  const announce = (message: string) => {
    setStatus(message);
    clearTimeout(dismissTimer.current);
    dismissTimer.current = setTimeout(() => setStatus(''), 4000);
  };
  useEffect(() => () => clearTimeout(dismissTimer.current), []);

  const handleCopy = async () => {
    const ok = await copyText(artifact.content);
    announce(ok ? messages.copiedStatus : messages.copyFailedStatus);
  };

  const handleDownload = () => {
    downloadText(artifact.content, artifact.filename, artifact.contentType);
  };

  return (
    <section className="output" aria-labelledby={headingId}>
      <div className="output__header">
        <h2 className="output__heading" id={headingId}>
          {messages.heading}
        </h2>
        <div className="output__actions">
          <button type="button" className="output__action" onClick={handleCopy}>
            {messages.copyLabel}
          </button>
          <button
            type="button"
            className="output__action output__action--primary"
            onClick={handleDownload}
          >
            {messages.downloadLabel}
          </button>
        </div>
      </div>

      <p className="output__path">
        <span className="output__path-label">{messages.pathLabel}</span>{' '}
        <code className="output__filename">{artifact.filename}</code>
      </p>

      {/* Text node only — the YAML is data, never markup. */}
      <pre className="output__yaml" tabIndex={0} aria-label={messages.heading}>
        {artifact.content}
      </pre>

      <p className="output__status" role="status" aria-live="polite">
        {status}
      </p>

      {messages.vault && secretNames && secretNames.length > 0 && (
        <VaultHandoff commands={buildVaultCommands(secretNames)} messages={messages.vault} />
      )}
    </section>
  );
}
