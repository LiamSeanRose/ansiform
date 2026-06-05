# Security

Ansiform is a **client-side, zero-egress** tool. You fill out a form in your
browser; the YAML vars and the device-config preview are computed entirely on
your machine. This document states the guarantees and how to run the hardened
container.

## Reporting a vulnerability

Please report security issues privately to **liam.sean.rose@gmail.com** rather
than opening a public issue. Include steps to reproduce and the impact you see.
We aim to acknowledge reports within a few days.

## Guarantees

### Zero egress

The app makes **no outbound network requests** — no `fetch`/`XHR`/WebSocket/
`EventSource`, no CDN scripts, fonts, analytics, or error reporting. Everything
is bundled at build time and served as static files.

This is enforced, not just promised, by a Content-Security-Policy whose
load-bearing directive is `connect-src 'none'`:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none';
base-uri 'self'; form-action 'none'; frame-ancestors 'none';
upgrade-insecure-requests
```

The policy ships two ways so it applies however you host:

- a `<meta http-equiv="Content-Security-Policy">` tag injected into the built
  `index.html` (covers static hosts like GitHub/Cloudflare Pages where you can't
  set response headers) — see `vite.config.ts`;
- an `add_header Content-Security-Policy … always` in the bundled nginx config —
  see `nginx.conf`.

Because `connect-src 'none'` blocks every request type, **form values cannot
leave the browser** even if a bug tried to send them.

### No storage of values

Form values — including secrets — are held in memory only. The app does **not**
write values to `localStorage`/`sessionStorage`, cookies, IndexedDB, or the URL,
and there is **no telemetry**. Closing the tab discards everything.

### Secrets are first-class

Fields typed `secret` render as password inputs (`autocomplete="new-password"`),
are never seeded with a default, and are never logged or encoded. Any code path
that could persist or export the value model must route it through
`redactSecrets()` first, which **strips secret keys entirely** (so a redacted
snapshot leaks neither content nor length). See `src/components/form/secrets.ts`.

### Vault: flag and pass through, never decrypt

Ansible Vault values are treated as opaque: Ansiform never decrypts, and never
asks for, a vault secret. (Vault-aware affordances are tracked separately and
will preserve this flag-and-passthrough posture.)

### Preview cannot inject markup

The device-CLI preview is written to the DOM as **text nodes only** — no
`innerHTML`/`dangerouslySetInnerHTML` and no HTML parsing on that path — so a
value containing `<`, `>`, or markup can never become live DOM. The preview is
also honest about fidelity: if a template uses a filter we can't reproduce
exactly, it shows a visible "preview may differ — the generated vars are still
valid" notice rather than a confident guess.

## Hardened container run

The image runs nginx as a **non-root** user on an unprivileged port (8080) with
all scratch space under `/tmp`, so it works with a read-only root filesystem:

```sh
docker build -t ansiform .
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp ansiform
```

- `--read-only` — the container's root filesystem is immutable.
- `--tmpfs /tmp` — the only writable space, where nginx keeps its pid and
  temp paths (see `nginx.conf`).
- The runtime stage drops to `USER nginx`; nothing runs as root.

Response headers set by `nginx.conf` also include `X-Content-Type-Options:
nosniff`, `X-Frame-Options: DENY`, and `Referrer-Policy: no-referrer`.

### TLS

Terminate TLS at a reverse proxy or load balancer in front of the container, or
add a TLS `server` block to nginx and mount your certificate. A minimal sketch:

```nginx
server {
  listen 8443 ssl;
  server_name ansiform.example.com;
  ssl_certificate     /etc/tls/fullchain.pem;
  ssl_certificate_key /etc/tls/privkey.pem;
  # …then the same root, CSP, and security headers as the :8080 block.
}
```

Keep `connect-src 'none'` and the other headers in any TLS block so the
zero-egress posture is preserved end to end.
