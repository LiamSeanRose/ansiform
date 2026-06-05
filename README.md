# Ansiform

**A free, client-side alternative to AWX Surveys for network automation.** Fill
out a friendly form and get valid Ansible `group_vars`/`host_vars` — with a live
preview of the **device CLI** you already read, so you can trust the YAML you
can't. Everything runs in your browser: **zero egress, no storage, self-hostable.**

- **The YAML is always correct.** Vars are serialized straight from your input
  with the right types (`enabled: true` unquoted, numbers as numbers) and proper
  `default(omit)` semantics (blank optional keys are dropped, not emitted empty).
- **The preview is honest.** Templates render to real Cisco IOS config. When a
  Jinja2 filter can't be reproduced byte-for-byte, the preview says so — it's
  never *silently* wrong.
- **Secrets are first-class.** Password fields are never seeded, stored, logged,
  or exported in the clear.

## Quick start

```sh
npm ci
npm run dev        # local dev server (Vite)
```

```sh
npm run build      # type-check + produce static dist/
npm run test       # Vitest
npm run lint       # ESLint
```

## Run with Docker

A hardened, non-root, read-only-friendly image is included:

```sh
docker build -t ansiform .
docker run --rm -p 8080:8080 --read-only --tmpfs /tmp ansiform
# open http://localhost:8080
```

The built artifact is static files, so you can also host `dist/` on any static
host (GitHub Pages, Cloudflare Pages, S3, …); the zero-egress CSP travels with
the HTML.

## Security guarantees

Ansiform is **zero-egress by construction**: a Content-Security-Policy with
`connect-src 'none'` blocks every outbound request, so form values — including
secrets — cannot leave your browser. There is no telemetry and nothing is
written to storage or the URL. See **[SECURITY.md](./SECURITY.md)** for the full
posture, the secret-handling model, and the hardened container/TLS notes.

## How it works

Each **task** (e.g. *Interface IP*, *VLAN*, *BGP neighbor*) is a curated,
correct-by-construction pairing of a form schema and a device-CLI template, with
its own route and SEO metadata. A task is a single self-contained folder under
[`src/tasks/`](./src/tasks); the registry auto-discovers it via
`import.meta.glob`, so adding a task is adding a folder — see
[`src/tasks/README.md`](./src/tasks/README.md).

The engine is split along a small set of frozen contracts (`src/core`):

- **Output sinks** turn values into artifacts — `group_vars`/`host_vars` YAML
  today, with AWX/AAP survey-spec export and copy/download on the roadmap.
- **A filter registry** implements the Jinja2 filters used in previews, each
  tagged with a fidelity tier (`exact` / `approximate` / `unsupported`) that
  drives the honest-degradation notice.

## Tech

React + TypeScript + Vite, `js-yaml` for serialization, Vitest for tests. No
runtime i18n or analytics dependencies — the bundle stays small and the
zero-egress story stays simple. Licensed under **Apache-2.0**.

## GitHub topics

`ansible` · `network-automation` · `jinja2` · `netdevops` · `yaml`
