/**
 * Copy-to-clipboard helper (issue #12).
 *
 * Local only — no network, no persistence (council §5). Uses the async Clipboard
 * API when available, with a synchronous `execCommand('copy')` fallback for
 * air-gapped hosting served from a non-secure context (plain http, non-localhost)
 * where `navigator.clipboard` is undefined. Returns whether the copy succeeded so
 * the UI can announce the result.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Permission denied or non-secure context — fall through to the legacy path.
  }
  return legacyCopy(text);
}

function legacyCopy(text: string): boolean {
  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-9999px';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
