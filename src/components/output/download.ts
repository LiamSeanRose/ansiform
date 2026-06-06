/**
 * Client-side file download helper (issue #12).
 *
 * Downloads `content` as a file using a **Blob object URL** — never a `data:`
 * URL, which would URL-encode the field values into the URL (the #1 leak path,
 * forbidden by council §5). The object URL references in-memory bytes, is never
 * navigable as a shareable permalink, and is revoked immediately. No network, no
 * persistence. The file content is byte-identical to what is previewed.
 */
export function downloadText(content: string, path: string, contentType = 'text/yaml'): void {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = basename(path);
    anchor.rel = 'noopener';
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** The file name to save as — the basename of the suggested var-file path. */
function basename(path: string): string {
  const name = path.split('/').pop();
  return name && name.length > 0 ? name : 'vars.yml';
}
