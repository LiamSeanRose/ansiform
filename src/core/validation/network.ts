/**
 * Network-semantic value validation (#86) — pure, advisory, client-side only.
 *
 * The product's promise is "correctness you can see." The device-CLI preview
 * proves *what a value renders to*; this proves *the value is legal for the
 * device* — catching the valid-but-wrong inputs (a `/33`, VLAN 4096, a
 * transposed ASN) that produce syntactically-perfect, semantically-broken YAML.
 *
 * Design rules (from the 2026-06-07 design council — binding):
 *  - **Advisory, never blocking.** Callers surface a visible warning; they never
 *    gate export on it. A false positive on a value the user knows is right is
 *    the worse failure, so this is paired with a per-field "treat as text"
 *    escape hatch in the UI.
 *  - **Never flag the legitimate non-literals.** A blank value, a Jinja2 ref
 *    (`{{ mgmt_ip }}`), or Vault ciphertext (`$ANSIBLE_VAULT…`) is returned as
 *    OK — those are valid things to type into a var field.
 *  - **Real semantics, not lazy regex.** `/31` is valid (point-to-point), VLAN
 *    is 1–4094 (1002–1005 reserved → a softer note), ASN spans 32 bits in both
 *    asplain and asdot, interface names stay permissive (vendor-varied).
 *  - **Pure & local.** No RIR/DNS/remote lookups; no value ever leaves memory.
 */
import type { NetworkFormat } from '../types';

/** Warning code. Mostly mirrors the format name; `vlanReserved` is the one note. */
export type NetworkWarningCode = NetworkFormat | 'vlanReserved';

export interface NetworkWarning {
  code: NetworkWarningCode;
}

/**
 * Check a raw string against a network format. Returns a warning, or `undefined`
 * when the value is fine (or is a non-literal we must never flag). Pure.
 */
export function validateNetworkFormat(
  format: NetworkFormat,
  raw: string,
): NetworkWarning | undefined {
  const value = raw.trim();
  // Never flag the legitimate non-literals: blank, a Jinja2 reference, or Vault
  // ciphertext are all valid things to put in a var field.
  if (value === '') return undefined;
  if (value.includes('{{') && value.includes('}}')) return undefined;
  if (value.includes('$ANSIBLE_VAULT')) return undefined;

  switch (format) {
    case 'ipv4':
      return isIpv4(value) ? undefined : { code: 'ipv4' };
    case 'cidr':
      return isIpv4Cidr(value) ? undefined : { code: 'cidr' };
    case 'ipv6':
      return isIpv6MaybeCidr(value) ? undefined : { code: 'ipv6' };
    case 'mac':
      return isMac(value) ? undefined : { code: 'mac' };
    case 'vlan':
      return checkVlan(value);
    case 'asn':
      return isAsn(value) ? undefined : { code: 'asn' };
    case 'ifname':
      return isIfname(value) ? undefined : { code: 'ifname' };
  }
}

// ── IPv4 ──────────────────────────────────────────────────────────────────────

function isIpv4(value: string): boolean {
  const octets = value.split('.');
  if (octets.length !== 4) return false;
  return octets.every((o) => /^\d{1,3}$/.test(o) && Number(o) <= 255);
}

/** IPv4 CIDR `a.b.c.d/0–32`. Host bits are allowed — an interface address like
 *  `10.0.0.1/24` is legitimate, so we never flag a non-network address. */
function isIpv4Cidr(value: string): boolean {
  const parts = value.split('/');
  if (parts.length !== 2) return false;
  const [addr, prefix] = parts;
  if (!isIpv4(addr)) return false;
  if (!/^\d{1,2}$/.test(prefix)) return false;
  const n = Number(prefix);
  return n >= 0 && n <= 32;
}

// ── IPv6 ──────────────────────────────────────────────────────────────────────

/** IPv6 address, optionally with a `/0–128` prefix. */
function isIpv6MaybeCidr(value: string): boolean {
  const parts = value.split('/');
  if (parts.length > 2) return false;
  if (parts.length === 2) {
    if (!/^\d{1,3}$/.test(parts[1])) return false;
    const n = Number(parts[1]);
    if (n < 0 || n > 128) return false;
  }
  return isIpv6(parts[0]);
}

function isIpv6(value: string): boolean {
  if (value === '') return false;
  // At most one '::' compression.
  const doubleColons = value.match(/::/g);
  if (doubleColons && doubleColons.length > 1) return false;

  const hasCompression = value.includes('::');
  // A trailing embedded IPv4 (e.g. ::ffff:1.2.3.4) consumes two 16-bit groups.
  let groups = value.split(':');
  let v4Groups = 0;
  const last = groups[groups.length - 1];
  if (last.includes('.')) {
    if (!isIpv4(last)) return false;
    v4Groups = 2;
    groups = groups.slice(0, -1);
  }

  // Validate each hextet (empty strings come from '::' / leading/trailing ':').
  for (const g of groups) {
    if (g === '') continue;
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return false;
  }

  const present = groups.filter((g) => g !== '').length + v4Groups;
  if (hasCompression) {
    // '::' fills at least one zero group, so the explicit groups must be < 8.
    return present <= 7;
  }
  // No compression: exactly 8 groups, and no stray empty hextets.
  if (groups.some((g) => g === '')) return false;
  return present === 8;
}

// ── MAC ───────────────────────────────────────────────────────────────────────

function isMac(value: string): boolean {
  return (
    /^[0-9a-fA-F]{2}([:-][0-9a-fA-F]{2}){5}$/.test(value) || // 00:11:.. or 00-11-..
    /^[0-9a-fA-F]{4}(\.[0-9a-fA-F]{4}){2}$/.test(value) || // Cisco 0011.2233.4455
    /^[0-9a-fA-F]{12}$/.test(value) // bare 12 hex
  );
}

// ── VLAN ──────────────────────────────────────────────────────────────────────

function checkVlan(value: string): NetworkWarning | undefined {
  if (!/^\d+$/.test(value)) return { code: 'vlan' };
  const n = Number(value);
  if (n < 1 || n > 4094) return { code: 'vlan' };
  if (n >= 1002 && n <= 1005) return { code: 'vlanReserved' };
  return undefined;
}

// ── ASN ───────────────────────────────────────────────────────────────────────

const ASN_MAX = 4294967295; // 2^32 - 1

function isAsn(value: string): boolean {
  // asplain: a single integer 1 .. 2^32-1.
  if (/^\d+$/.test(value)) {
    const n = Number(value);
    return n >= 1 && n <= ASN_MAX;
  }
  // asdot: high.low, each 0..65535, combined >= 1.
  const dot = /^(\d{1,5})\.(\d{1,5})$/.exec(value);
  if (dot) {
    const high = Number(dot[1]);
    const low = Number(dot[2]);
    if (high > 65535 || low > 65535) return false;
    return high * 65536 + low >= 1;
  }
  return false;
}

// ── Interface name ─────────────────────────────────────────────────────────────

/** Permissive on purpose: interface naming is wildly vendor-varied
 *  (`GigabitEthernet0/1`, `Gi0/1`, `ge-0/0/0.0`, `Te1/1/1`, `Port-channel1`,
 *  `Vlan10`). We only flag the clearly-wrong: must start with a letter and
 *  contain no spaces or exotic characters. */
function isIfname(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9./:_-]*$/.test(value);
}
