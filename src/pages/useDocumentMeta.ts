import { useEffect } from 'react';

/**
 * Set the document `<title>` and `<meta name="description">` while a page is
 * mounted, restoring the previous values on unmount. This is how each task and
 * guide route acts as its own SEO atom (council §8) in the SPA. Pass `null` to
 * leave a value untouched (e.g. an unknown route that renders not-found).
 */
export function useDocumentMeta(title: string | null, description: string | null): void {
  useEffect(() => {
    if (title === null && description === null) return;

    const previousTitle = document.title;
    if (title !== null) document.title = title;

    let meta: HTMLMetaElement | null = null;
    let previousDescription: string | null = null;
    if (description !== null) {
      meta = ensureMetaDescription();
      previousDescription = meta.getAttribute('content');
      meta.setAttribute('content', description);
    }

    return () => {
      document.title = previousTitle;
      if (meta && previousDescription !== null) meta.setAttribute('content', previousDescription);
    };
  }, [title, description]);
}

function ensureMetaDescription(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  return meta;
}
