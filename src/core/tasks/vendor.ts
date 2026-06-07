/**
 * Vendor seam (issue #21) + per-vendor preview overlay (issue #27).
 *
 * The network OS a task targets. A task's schema and the YAML vars it produces
 * are vendor-independent — vars are just vars — so multi-vendor support is purely
 * a matter of the *preview*: the same form can render to a different device CLI
 * per vendor. v1 shipped Cisco IOS only; #21 added this typed, additive seam so a
 * task could *declare* its platform, and #27 grows the union plus the overlay
 * below so a task can carry per-vendor preview templates behind the same schema.
 *
 * Resolve a task's vendor with {@link vendorOf}, its selectable vendors with
 * {@link taskVendors}, and a vendor's preview template with
 * {@link templateForVendor} — never read the optional fields directly, so the
 * default and the base-template fallback are applied consistently everywhere.
 */

/**
 * Supported network OS. Grows additively (#27, #37, #38, #40). Most members are
 * the line-CLI family — they share the curated schemas and render IOS-shaped CLI,
 * so they overlay onto existing tasks via {@link TaskVendorView.templates} (#37
 * added `cisco-iosxr`). A platform with a genuinely different config model joins
 * as its OWN task family rather than a template overlay: `cisco-asa` (#38,
 * firewall) and `cradlepoint-ncos` (#40, cellular/edge) are such members — their
 * tasks set the vendor and declare no `templates` overlay. A non-line-CLI platform
 * additionally sets a `fidelityFloor` (#40) so its best-effort preview never
 * claims `exact`.
 */
export type Vendor =
  | 'cisco-ios'
  | 'cisco-iosxe'
  | 'cisco-nxos'
  | 'arista-eos'
  | 'cisco-asa'
  | 'cisco-iosxr'
  | 'cradlepoint-ncos';

/** The vendor assumed when a task declares none. */
export const DEFAULT_VENDOR: Vendor = 'cisco-ios';

/** A task's vendor, applying {@link DEFAULT_VENDOR} when it declares none. */
export function vendorOf(meta: { vendor?: Vendor }): Vendor {
  return meta.vendor ?? DEFAULT_VENDOR;
}

/**
 * A per-vendor preview template with an explicit fidelity claim (#27).
 *
 * Multi-vendor previews are the council's unanimous deal-breaker: a silently-wrong
 * vendor render is worse than none. So a vendor template states its own fidelity
 * rather than inheriting the filter-tier verdict:
 *  - `exact` (the default) — the author asserts this CLI is curated-correct for the
 *    vendor; the preview degrades only if a *filter* is non-exact, as usual.
 *  - `approximate` — the template has NOT had a curated-correctness pass; the
 *    preview shows the degrade notice regardless of filter tiers, so an un-vetted
 *    vendor render can never be mistaken for ground truth.
 */
export interface VendorTemplate {
  template: string;
  fidelity?: 'exact' | 'approximate';
}

/**
 * A `templates` entry: a bare template string (terse; asserted `exact`) or a
 * {@link VendorTemplate} carrying a fidelity flag.
 */
export type VendorTemplateEntry = string | VendorTemplate;

/**
 * The minimal task shape the vendor resolvers read. Defined structurally (not as
 * `TaskDefinition`) so this module stays free of a `../types` import cycle —
 * `TaskDefinition` imports *from here*.
 */
export interface TaskVendorView {
  vendor?: Vendor;
  /** The base (default-vendor) preview template. */
  template: string;
  /** Optional per-vendor overrides; see {@link VendorTemplateEntry}. */
  templates?: Partial<Record<Vendor, VendorTemplateEntry>>;
}

function entryTemplate(entry: VendorTemplateEntry): string {
  return typeof entry === 'string' ? entry : entry.template;
}

function entryIsApproximate(entry: VendorTemplateEntry): boolean {
  return typeof entry !== 'string' && entry.fidelity === 'approximate';
}

/**
 * The vendors a task can render a preview for, base vendor first: its declared
 * (or default) vendor, then every vendor with a defined `templates` override.
 * A single-vendor task returns a one-element list (no selector is shown).
 */
export function taskVendors(def: TaskVendorView): Vendor[] {
  const base = vendorOf(def);
  const result: Vendor[] = [base];
  if (def.templates) {
    for (const key of Object.keys(def.templates) as Vendor[]) {
      const entry = def.templates[key];
      if (entry !== undefined && key !== base) result.push(key);
    }
  }
  return result;
}

/**
 * The preview template for a vendor: its override if present, else the base
 * template. Pass only a vendor from {@link taskVendors}; for any other vendor the
 * base template would render (and be mislabelled), which is exactly the
 * silently-wrong trap the selector avoids by offering `taskVendors` alone.
 */
export function templateForVendor(def: TaskVendorView, vendor: Vendor): string {
  const entry = def.templates?.[vendor];
  return entry !== undefined ? entryTemplate(entry) : def.template;
}

/**
 * Whether a vendor's preview is author-flagged `approximate` (un-reviewed CLI).
 * The base vendor and bare-string overrides are `exact`; the workbench clamps the
 * rendered fidelity down to at-worst `approximate` when this is true.
 */
export function vendorTemplateApproximate(def: TaskVendorView, vendor: Vendor): boolean {
  const entry = def.templates?.[vendor];
  return entry !== undefined && entryIsApproximate(entry);
}
