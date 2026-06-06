/**
 * Vendor seam (issue #21).
 *
 * The network OS a task targets. v2 ships Cisco IOS only; this is the additive,
 * typed seam that lets a task *declare* its platform now, so multi-vendor content
 * (#27, on hold) can grow behind it without a contract break. A task that does
 * not set `vendor` is treated as {@link DEFAULT_VENDOR}.
 *
 * Resolve a task's vendor with {@link vendorOf} rather than reading the optional
 * `vendor` field directly, so the default is applied consistently everywhere.
 */

/** Supported network OS. Grows additively as vendors are added (#27). */
export type Vendor = 'cisco-ios';

/** The vendor assumed when a task declares none. */
export const DEFAULT_VENDOR: Vendor = 'cisco-ios';

/** A task's vendor, applying {@link DEFAULT_VENDOR} when it declares none. */
export function vendorOf(meta: { vendor?: Vendor }): Vendor {
  return meta.vendor ?? DEFAULT_VENDOR;
}
