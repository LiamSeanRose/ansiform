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
dependency-free i18n layer (English and French), and `js-yaml` for byte-correct
output. No runtime backend, ever.

## Task library

A curated library of common network tasks — each its own page with its own form
and live preview. Coverage spans interfaces and IP addressing, VLANs, routing
(OSPF, BGP, static routes, HSRP/VRRP), traffic policy (ACLs, prefix-lists,
route-maps), and the management plane (SNMPv3, NTP, syslog, AAA, SSH hardening,
banners, device basics).

**Multi-vendor — eight platforms.** Cisco IOS, IOS-XE, IOS-XR, NX-OS, and ASA,
plus Arista EOS, Juniper Junos, and Cradlepoint NCOS. Line-CLI platforms overlay
onto the shared task schemas — pick the preview target and the device-CLI preview
switches, while the YAML output stays vendor-independent and correct. Device
classes with a genuinely different config model — Cisco ASA (firewall) and
Cradlepoint NCOS (cellular/edge) — ship as their own task families. Where a
vendor's CLI hasn't been line-for-line verified (the Junos `set` form, some
NX-OS/EOS overlays), the preview says so ("preview may differ") rather than
showing a silently-wrong result.

Browse the whole library at **`/tasks`** — a searchable index grouped by function,
each task labelled with the device CLI it renders. Beyond single tasks, **Build**
(`/build`) composes several into a complete multi-file `group_vars`/`host_vars`
set with visible collision warnings and a one-click `.zip`; every task can also
export an **AWX/AAP survey spec** (`.json`) alongside its vars — a local file,
never a server round-trip — so a form maps straight into an AWX/AAP workflow.
**Reader** (`/reader`) explains an existing Cisco/Jinja2 template — the
variables it expects, the filters it uses, and a live preview — entirely in your
browser.

## Roadmap

The v1–v3 milestones have all shipped (see the [changelog](./CHANGELOG.md)): the
form/preview engine, the curated task library, composition, multi-vendor previews
with line-verified fidelity, the searchable task index, AWX/AAP survey export, and
the template reader.

Additional line-CLI vendors are added on demand the same way — one preview
template per task, behind the existing schema. Explicitly **out of scope**, because
they would break the zero-egress, vars-only contract that comes first:
bring-your-own arbitrary template parsing, runnable-playbook output, Vault
decryption (vaulted values are flagged and passed through, never decrypted), and
any backend.

## Contributing

Issues and discussion are welcome. When proposing tasks, build only from public
Ansible/networking knowledge — never seed examples with a real employer's
templates, playbooks, inventory, or addresses.

Suggested GitHub topics for this repository: `ansible`, `network-automation`,
`jinja2`, `netdevops`, `yaml`.

## License

[Apache-2.0](./LICENSE) © Ansiform contributors.
