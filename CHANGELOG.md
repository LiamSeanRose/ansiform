# Changelog

All notable changes to Ansiform. The format follows
[Keep a Changelog](https://keepachangelog.com/); the project uses semantic
version tags (`vX.Y.Z`), and each tagged release attaches a prebuilt `dist.zip`
to its GitHub Release.

The product spine has held since day one and is not a "feature": **client-side
only, zero egress** (strict CSP with `connect-src 'none'`), **YAML output always
correct** while **previews degrade visibly, never silently wrong**, **secrets
first-class** (never stored, logged, or encoded), and **generic public knowledge
only**.

## [1.0.0] — 2026-06-07

First stable release. Everything below is in place: a production-grade engine, a
broad curated library across eight platforms, composition, the template reader,
and line-verified multi-vendor previews. The cumulative history is grouped by the
three milestones that built up to it.

### v3 — trust completion & platform breadth

- **Preview-fidelity completion.** Promoted NX-OS and Arista EOS overlays from
  "approximate" to line-verified `exact` where the rendered CLI matches the
  vendor's own command reference, each locked by a per-vendor snapshot test so a
  regression re-degrades visibly. Overlays that aren't fully verified stay
  `approximate` on purpose.
- **Platform breadth — now eight platforms.** Cisco IOS-XR (line-CLI overlay),
  Cisco ASA (new firewall task family), Juniper Junos (`set` form, flagged
  approximate), and Cradlepoint NCOS (cellular/edge device class) join the
  original Cisco IOS / IOS-XE / NX-OS and Arista EOS.
- **Non-line-CLI preview model.** A documented design (`docs/design/non-cli-preview.md`)
  for platforms whose config isn't Cisco-style line CLI: templates emit the
  native textual form, with a `fidelityFloor` so a best-effort preview never
  claims `exact`.
- **Task discovery.** A searchable `/tasks` index grouped by function, each task
  labelled with the device CLI it renders.
- **Template reader graduated from beta to stable** once its read/edit/import
  paths were settled.

### v2 — composition, reader & multi-vendor

- **Composition / Build (`/build`).** A task-tray session that assembles several
  filled tasks into a correct multi-file `group_vars`/`host_vars` set — collisions
  reported by key name (never silently merged) — with a dependency-free `.zip`
  download (a STORE writer, so `connect-src 'none'` and air-gap are unchanged).
- **Template reader (`/reader`).** Read-only explainer for an existing
  Cisco/Jinja2 template (variables, filters with fidelity badges, live preview);
  an edit mode that builds a vars form from an extracted template; and an
  `argument_specs.yml` importer that maps a declarative role spec onto an exact
  form. Walled off from the curated library; nothing pasted leaves the browser.
- **Multi-vendor seam.** An additive `vendor` field plus a per-vendor preview
  overlay: the same schema renders to a different device CLI per target, with
  each vendor template carrying its own fidelity claim.
- **Library depth.** A list/repeating-group field type, multi-entry ACL and OSPF,
  device-hardening toggles, and additional Cisco IOS tasks; a tokenised styling
  system; and an enforced no-egress CI test that fails the build if any shipped
  source introduces a network call.

### v1 — engine & curated library

- **Engine.** Accessible form renderer → byte-correct `group_vars`/`host_vars`
  via `js-yaml` (omit-on-blank), a Jinja2 filter registry with fidelity tiers, a
  live device-CLI preview, and a first-class `secret` field type.
- **Curated library.** The first Cisco IOS tasks, each its own SEO route
  (`/tasks/:task`) with its own H1 and meta.
- **Outputs & ship.** `group_vars`/`host_vars` with suggested file paths, AWX/AAP
  survey-spec export, the security model (`SECURITY.md`), README, an English and
  French i18n layer, and the hardened non-root container + release automation.

[1.0.0]: https://github.com/LiamSeanRose/ansiform/releases/tag/v1.0.0
