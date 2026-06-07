/**
 * Download-as-file action for the AWX/AAP survey spec (issue #33).
 *
 * Surfaces the existing survey-spec sink (`src/core/output/survey-spec.ts`) in the
 * UI. The spec is built from the SCHEMA only — never from entered values — and is
 * saved via a Blob object URL (never a `data:`/URL-encoded value — spine §5).
 * Local file only: there is deliberately no upload/POST-to-AWX path, so the
 * zero-egress posture holds. The page passes an already-built `SurveySpec` so this
 * control stays presentational.
 */
import type { SurveySpec } from '../../core/output/survey-spec';
import { downloadText } from './download';

export interface SurveyDownloadButtonProps {
  spec: SurveySpec;
  /** Resolved label (the page resolves the i18n key). */
  label: string;
  className?: string;
}

export function SurveyDownloadButton({
  spec,
  label,
  className = 'output__action',
}: SurveyDownloadButtonProps) {
  const handleDownload = () =>
    downloadText(`${JSON.stringify(spec, null, 2)}\n`, 'survey-spec.json', 'application/json');

  return (
    <button type="button" className={className} onClick={handleDownload}>
      {label}
    </button>
  );
}
