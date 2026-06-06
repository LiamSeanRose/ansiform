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
import { useId, useState } from 'react';
import type { OutputArtifact } from '../../core';
import { copyText } from './clipboard';
import { downloadText } from './download';

/** Externalized output-panel copy; the page builds this from the i18n catalogue. */
export interface OutputMessages {
  heading: string;
  pathLabel: string;
  copyLabel: string;
  copiedStatus: string;
  copyFailedStatus: string;
  downloadLabel: string;
}

export interface YamlOutputPanelProps {
  artifact: OutputArtifact;
  messages: OutputMessages;
}

export function YamlOutputPanel({ artifact, messages }: YamlOutputPanelProps) {
  const headingId = useId();
  const [status, setStatus] = useState('');

  const handleCopy = async () => {
    const ok = await copyText(artifact.content);
    setStatus(ok ? messages.copiedStatus : messages.copyFailedStatus);
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
          <button type="button" className="output__action" onClick={handleDownload}>
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
    </section>
  );
}
