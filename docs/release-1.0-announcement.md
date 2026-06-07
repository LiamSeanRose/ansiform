# Ansiform 1.0 — Ansible variables without the YAML

**Ansiform turns a friendly form into valid Ansible `group_vars`/`host_vars`, with
a live preview of the device config you already read — entirely in your browser.**

No account, no backend, nothing leaves the page: the production build ships a
strict Content-Security-Policy with `connect-src 'none'`, so it makes no network
request of any kind (verify it in DevTools). Host the static build anywhere, or
open it from a folder — it works fully offline and air-gapped.

## What 1.0 gives you

- **A curated task library across eight platforms** — Cisco IOS, IOS-XE, IOS-XR,
  NX-OS, and ASA, plus Arista EOS, Juniper Junos, and Cradlepoint NCOS. Each task
  is a friendly form with a live device-CLI preview; pick the preview target and
  the CLI switches while the YAML stays vendor-independent and correct.
- **Composition (`/build`)** — assemble several tasks into a complete multi-file
  `group_vars`/`host_vars` set, with visible collision warnings and a one-click
  `.zip`.
- **A searchable task index (`/tasks`)** and **AWX/AAP survey-spec export** so a
  form maps straight into an AWX/AAP workflow.
- **A template reader (`/reader`)** that explains an existing Cisco/Jinja2
  template — the variables it expects, the filters it uses, and a live preview.
- **A worked-examples cookbook** taking you end to end: form → vars → playbook.

## The contract

- **The YAML output is always correct** — filters run at playbook runtime, not on
  your vars.
- **Previews degrade visibly, never silently** — where a vendor's CLI or a Jinja2
  filter can't be reproduced exactly, the preview says "preview may differ" rather
  than mislead.
- **Secrets are first-class** — the secret field is a password input that is never
  stored, logged, encoded, or transmitted. Vaulted values are flagged and passed
  through, never decrypted.

## Get it

Self-host the static build (unzip the release `dist.zip` behind any web server) or
run the hardened container. Full details and the complete history are in
[`CHANGELOG.md`](../CHANGELOG.md) and the [README](../README.md).

Apache-2.0. Issues and discussion welcome.
