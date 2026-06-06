# Ansiform

**Ansible templates without the YAML.** A free, client-side alternative to AWX/AAP
Surveys: fill out a friendly form, get valid Ansible `group_vars`/`host_vars` —
with a **live preview of the device config you already read** (`interface Gig0/1`,
`ip address 192.0.2.1 255.255.255.0`) as the trust signal.

The same static build serves the free public site and air-gapped enterprise
self-hosting. No account, no backend, nothing leaves your browser.

- **Client-side only.** React SPA compiled to static files. There is no server to
  send your data to.
- **Zero egress, by construction.** A strict Content-Security-Policy with
  `connect-src 'none'` blocks every outbound request the page could make — verify
  it yourself in DevTools.
- **Self-hostable.** Drop the `dist/` behind any web server, or run the hardened
  container below. Works fully offline.

## Why

AWX/AAP Surveys are the usual way to put a form in front of an Ansible playbook,
but they need the whole Tower/Controller stack and they live on a server. Ansiform
gives a network engineer the same "form → variables" ergonomics as a static page
you can host anywhere — or just open from disk — and adds a device-CLI preview so
you can sanity-check the result against the config syntax you already know.

The contract is deliberate: **the YAML output is always correct** (filters run at
playbook runtime, not on your vars), and **the preview is allowed to be
approximate**. Where a Jinja2 filter can't be reproduced exactly in the browser,
the preview says so — "preview may differ, output is still valid" — and never
shows a silently-wrong result.

## Security guarantees

These are load-bearing, not aspirational:

- **No network requests.** The production CSP ships `connect-src 'none'` in both
  the build-time `<meta>` tag and the nginx response header. No fetch, XHR,
  WebSocket, or EventSource can fire. There are **no CDN scripts or fonts, no
  analytics, and no error reporting** — everything is bundled at build time.
- **Form values are never persisted or transmitted.** No `localStorage` of values,
  and **no URL-encoding of field values** — you share results by exporting a file,
  never a link.
- **Secrets are first-class.** The `secret` field is a password input that is
  never stored, logged, encoded, or persisted, and is never seeded with a default.
- **Vault is pass-through only.** Vaulted values are flagged and passed through,
  never decrypted in the browser.
- **Hardened container.** The image runs nginx as a non-root user on an
  unprivileged port and is designed for a read-only root filesystem.

See [SECURITY.md](./SECURITY.md) for the full threat model and reporting policy.

## Self-hosting

### Docker (recommended)

```bash
docker build -t ansiform .
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp ansiform
```

Then open <http://localhost:8080>. The `--read-only --tmpfs /tmp` flags are not
required, but the image is built to run that way — nginx keeps all scratch space
under `/tmp`.

### Static files

Every tagged release attaches a prebuilt `dist.zip` to the GitHub Release. Unzip
it behind any static host (nginx, Apache, Caddy, GitHub Pages, Cloudflare Pages,
an S3 bucket) — or open `index.html` straight from disk. The CSP travels in a
`<meta>` tag, so the zero-egress posture holds even where you can't set response
headers.

To build it yourself:

```bash
npm ci
npm run build   # → dist/
```

## Development

```bash
npm run dev        # Vite dev server with HMR
npm run build      # typecheck + production build → dist/
npm run preview    # serve the production build locally
npm run lint       # eslint (flat config)
npm run test       # vitest
npm run typecheck  # tsc, no emit
```

**Stack:** React 19 + TypeScript + Vite, React Router (one route per task), a
dependency-free i18n layer (English now, French planned), and `js-yaml` for
byte-correct output. No runtime backend, ever.

## Task library

v1 targets Cisco IOS and ships a small, curated set of common tasks — each its own
page with its own form and preview:

- Interface / IP addressing
- VLAN
- OSPF
- BGP neighbor
- Access control list (ACL)
- Device basics (SNMP / NTP / TACACS)

Breadth across more vendors, bring-your-own templates, and runnable-playbook output
are explicitly deferred to later versions.

> **Status:** pre-1.0 and under active development. The app shell, routing,
> security posture, output engine, and form/preview engine are in place; the
> curated task library is being filled in.

## Contributing

Issues and discussion are welcome. When proposing tasks, build only from public
Ansible/networking knowledge — never seed examples with a real employer's
templates, playbooks, inventory, or addresses.

Suggested GitHub topics for this repository: `ansible`, `network-automation`,
`jinja2`, `netdevops`, `yaml`.

## License

[Apache-2.0](./LICENSE) © Ansiform contributors.
