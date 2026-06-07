# Preview model for non-line-CLI platforms

Decision record for #36. Scope: how Juniper Junos (`set` / hierarchical) and
Cradlepoint NCOS (JSON object) device config render in the live preview — the
product's trust signal — without a core rewrite or a silently-wrong preview.

## Finding: the preview engine is already format-agnostic

`renderPreview` (`src/core/preview/render.ts`) is a Jinja2-subset → **text**
renderer. `renderNodes` concatenates literal text and evaluated `{{ … }}` outputs;
nothing in it assumes Cisco line-CLI. Fidelity is derived only from the filter
tiers a template uses (`resolveFidelity`), never from the output's shape. The
engine will therefore render *any* textual config a template emits — `set …`
lines, a JSON fragment, anything.

The constraint is not the renderer. It is (a) which textual form is the
authoritative preview per platform, and (b) keeping fidelity honest when we cannot
author that form with confidence.

## Decision

1. **No new renderer.** Each platform's templates emit its native *textual* config
   as text, through the existing engine + fidelity tiers. Additive; no core change,
   no line-CLI-vs-other split in the core.

2. **Junos → the flat `set …` form.** `set` configuration is line-oriented,
   human-readable, and paste-able straight into Junos `configure` mode — it is the
   authoritative preview. Junos templates emit `set …` statements and need **no new
   mechanism**; #39 is an ordinary platform (a template overlay or new task families,
   depending on how closely its variable model maps to the Cisco tasks). The
   hierarchical/JSON form is not used for the preview.

3. **Cradlepoint NCOS → CLI text where authorable, else a JSON fragment flagged
   approximate.** NCOS has a config CLI; prefer rendering that. Where only JSON is
   realistic, a template may emit a JSON fragment, but it must **never claim
   `exact`**: JSON templating is structurally fragile (quoting, commas) and the
   config is API-shaped rather than read-on-a-device. The YAML vars remain the
   correct deliverable; the preview is best-effort and says so.

4. **Fidelity floor for un-verifiable base templates (the one additive seam).** The
   existing per-vendor `approximate` flag (`VendorTemplate.fidelity`) covers only
   template *overrides*; a new platform's *base* template's fidelity is filter-driven
   only, so it would claim `exact` even when un-verified. When the first platform
   needs it (Cradlepoint), add an optional `TaskDefinition.fidelityFloor?:
   'approximate'` that clamps the rendered preview down — mirroring the clamp the
   workbench already applies for approximate vendor overrides. Additive; it lands
   with that platform's issue, not in this spike.

## Consequences

- **#39 (Junos) — unblocked.** No engine work; render the `set …` form.
- **#40 (Cradlepoint) — unblocked**, scoped: NCOS CLI text where authorable, else a
  JSON fragment with `fidelityFloor: 'approximate'`.
- Spine unchanged: text in a `<pre>`, zero-egress, previews degrade visibly, the
  YAML output is always correct.
