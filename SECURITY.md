# Security

Ansiform is a **client-side, zero-backend** tool. You paste device facts into a
form in your browser; it renders Ansible `group_vars`/`host_vars` and a device-CLI
preview entirely in-page. There is no server to send data to, and the app is built
so it *cannot* send your data anywhere — a property you can verify yourself.

This document states the guarantees, shows how to check them, and describes the
hardened self-hosted run for air-gapped/enterprise use.

## Guarantees

### Zero egress, verifiable

The production build ships a strict Content-Security-Policy whose load-bearing
directive is **`connect-src 'none'`**. That blocks every outbound request the page
could make — `fetch`, `XMLHttpRequest`, WebSocket, and `EventSource` — so form
values cannot leave the browser, even accidentally.

The full policy (identical in the build-time `<meta>` tag and the nginx response
header — see `vite.config.ts` and `nginx.conf`):

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data:;
font-src 'self';
connect-src 'none';
object-src 'none';
base-uri 'self';
form-action 'none';
frame-ancestors 'none';
upgrade-insecure-requests
```

Everything is bundled at build time. There are **no CDN scripts or fonts, no
analytics, and no error reporting** — nothing is fetched at runtime, so there is
no third party to trust and nothing to phone home.

### No persistence of form values

Form values live only in memory for the lifetime of the page:

- **No `localStorage`/`sessionStorage`** of field values, and no cookies.
- **No URL-encoding of field values.** Field values are never written to the URL
  or query string — this is the most common leak path, since a "share link" would
  embed your data. Sharing means **exporting a file**, never a permalink.
- **No telemetry** that captures form state, and no error reporting that could
  serialize a render exception containing your input.

Closing or reloading the tab discards everything.

### Secrets are first-class

The `secret` field type is a password input (`type="password"`,
`autocomplete="new-password"`). Its value is **never** persisted, transmitted,
URL-encoded, seeded with a default, or written to telemetry/logs. The app keeps no
durable copy — closing or reloading the tab discards it.

One deliberate exception, by design: the value **does** appear in the
`group_vars`/`host_vars` file you generate — that is the file's whole purpose, and
the file is yours alone (nothing is uploaded). Protect it the standard Ansible way:
run `ansible-vault encrypt` on the resulting file. To keep secrets out of
*internal* diagnostics, any code path that would log or snapshot the value model
first routes it through a redaction helper that **strips secret-typed fields
entirely** (no masking, so not even the length leaks).

### Ansible Vault: never decrypt

Ansiform **never decrypts** Ansible Vault data and never asks for a vault
password — there is no decryption code in the app, by design. A `$ANSIBLE_VAULT…`
ciphertext you paste is treated as an opaque string and serialized to the output
unchanged.

*Planned (not yet implemented):* visibly **flagging** a value that appears to be
vault-encrypted in the form and preview, so it is obvious it is passing through
un-decrypted. Until that lands, passthrough is simply the default string behavior.

### Correctness over guessing

The generated YAML is always valid; only the device-CLI preview may be
approximate. When a Jinja2 filter cannot be faithfully previewed, the preview
**degrades visibly** ("preview may differ — output is still valid") rather than
showing something silently wrong.

## How to verify

You do not have to take the above on faith:

1. **Inspect the CSP.** View source on the deployed page and confirm the
   `<meta http-equiv="Content-Security-Policy">` tag contains `connect-src 'none'`.
   When self-hosting behind nginx, also check the response header
   (`curl -I https://your-host/`).
2. **Watch the network.** Open your browser DevTools → Network tab, fill in the
   form, generate output, and confirm **no requests** are made. Any blocked
   attempt would additionally surface as a CSP violation in the Console.
3. **Go offline.** Load the page, then disable networking (airplane mode / pull
   the cable). The tool keeps working — there was never a backend.
4. **Read the bundle.** The shipped `dist/` is static. Grep it for request APIs
   (`fetch`, `XMLHttpRequest`, `WebSocket`, `navigator.sendBeacon`) to confirm
   there is nothing that calls out.
5. **Self-host it.** The same static `dist/` is what the public site serves, so an
   air-gapped copy is byte-for-byte the public app.

## Self-hosting: hardened run

The container image serves the static build with nginx as a **non-root** user on
the unprivileged port **8080**, with all writable scratch space redirected under
`/tmp` so the root filesystem can be mounted read-only.

```bash
docker build -t ansiform .

docker run --rm \
  -p 8080:8080 \
  --read-only \
  --tmpfs /tmp \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  ansiform
```

What the flags buy you:

| Flag | Effect |
| --- | --- |
| `--read-only` | Root filesystem is immutable; nothing can be written to the image at runtime. |
| `--tmpfs /tmp` | The only writable area — nginx's pid file and temp paths live here (see `nginx.conf`). |
| `--cap-drop ALL` | Drops all Linux capabilities; the static file server needs none. |
| `--security-opt no-new-privileges` | Prevents privilege escalation via setuid binaries. |

The image already runs as the `nginx` user (`USER nginx` in the `Dockerfile`), so
no `--user` override is required.

### TLS

The bundled `nginx.conf` listens on plain HTTP `:8080` and is meant to sit behind
a TLS terminator (a reverse proxy, ingress controller, or load balancer). If you
prefer to terminate TLS in the container itself, mount your certificates read-only
and add a TLS `server` block alongside the existing one. Sample:

```nginx
server {
  listen 8443 ssl;
  http2 on;
  server_name your-host.example.com;
  root /usr/share/nginx/html;
  index index.html;

  ssl_certificate     /etc/nginx/tls/fullchain.pem;
  ssl_certificate_key /etc/nginx/tls/privkey.pem;
  ssl_protocols       TLSv1.2 TLSv1.3;
  ssl_ciphers         HIGH:!aNULL:!MD5;

  add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
  # Keep the zero-egress CSP and the other hardening headers from the http :8080
  # server block here too.

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Run it with the certs mounted read-only and the TLS port published:

```bash
docker run --rm \
  -p 8443:8443 \
  --read-only \
  --tmpfs /tmp \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  -v /path/to/certs:/etc/nginx/tls:ro \
  ansiform
```

Production HSTS should only be enabled once you are confident every host is served
over HTTPS.

## Reporting a vulnerability

Please report security issues **privately** — do not open a public issue for a
suspected vulnerability.

Use GitHub's private vulnerability reporting on this repository
(**Security → Report a vulnerability**) to open a confidential advisory. Include a
description, reproduction steps, and the impact. You will get an acknowledgement
and a fix timeline; coordinated disclosure is appreciated.

Because Ansiform has no backend and makes no network calls, the highest-impact
classes to look for are anything that would **break the zero-egress guarantee**
(a path that issues a network request or relaxes the CSP) or **leak form values**
(persistence, URL-encoding, logging, or a secret surviving redaction).
