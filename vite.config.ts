import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * The Content-Security-Policy for the production build.
 *
 * `connect-src 'none'` is the load-bearing directive: it makes the zero-egress
 * guarantee (council §5) verifiable — the app cannot make any network request
 * (fetch/XHR/WebSocket/EventSource), so form values can never leave the browser.
 *
 * Everything is bundled at build time: no CDN scripts, fonts, analytics, or
 * error reporting. `script-src 'self'` keeps inline script execution off.
 * `style-src 'unsafe-inline'` is needed for runtime inline styles; tighten to
 * hashes/nonces once the styling approach is settled.
 *
 * The matching header is also set by nginx in production (see nginx.conf); the
 * meta tag covers static hosting (GitHub Pages / Cloudflare Pages) where we
 * cannot set response headers.
 */
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/**
 * Injects the CSP <meta> tag into index.html for production builds only.
 *
 * It is intentionally NOT applied in dev: `connect-src 'none'` would block
 * Vite's HMR WebSocket and break `npm run dev`. Dev relies on Vite's own
 * server; the strict policy ships with the static artifact users actually host.
 */
function cspMetaPlugin(): Plugin {
  return {
    name: 'ansiform-csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      return html.replace(
        '</title>',
        `</title>\n    <meta http-equiv="Content-Security-Policy" content="${CONTENT_SECURITY_POLICY}" />`,
      );
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), cspMetaPlugin()],
});
