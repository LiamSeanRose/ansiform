/**
 * `ipaddr` filter family — IPv4 subset (issue #3, council §3).
 *
 * Ansible's real `ipaddr` (backed by Python `netaddr`) has a large surface:
 * IPv6, dozens of query types, list inputs, range math, etc. v1 is Cisco IOS
 * IPv4 config, so we implement the queries that actually appear in interface /
 * IP tasks and compute them with exact integer math:
 *
 *   ''            → normalized address (preserves any `/prefix`)
 *   'address'     → host address, no prefix
 *   'netmask'     → dotted netmask
 *   'network'     → network address
 *   'prefix'      → prefix length, as a number
 *   'broadcast'   → broadcast address
 *   'subnet' / 'network/prefix' → `network/prefix`
 *   'host' / 'host/prefix'      → `address/prefix`
 *
 * Fidelity is `exact` for this set: every supported query reproduces Ansible's
 * output byte-for-byte. To honour the "never silently wrong" rule (§11) the two
 * failure modes are kept *loud*, not approximate:
 *   - invalid input → returns `false`, exactly as Ansible/netaddr does.
 *   - an unsupported query (or IPv6) → THROWS, so the preview renderer (#5)
 *     degrades visibly instead of emitting a guessed value.
 *
 * A bare address with no prefix is treated as `/32`, matching netaddr.
 */
import type { FilterDefinition } from './registry';

interface ParsedV4 {
  /** Unsigned 32-bit host address. */
  addr: number;
  /** Prefix length 0–32. */
  prefix: number;
  /** Whether the source string carried an explicit `/prefix`. */
  hadPrefix: boolean;
}

function parseV4(value: string): ParsedV4 | null {
  const trimmed = value.trim();
  const slash = trimmed.indexOf('/');
  const hadPrefix = slash !== -1;
  const addrPart = hadPrefix ? trimmed.slice(0, slash) : trimmed;
  const prefixPart = hadPrefix ? trimmed.slice(slash + 1) : '32';

  const octets = addrPart.split('.');
  if (octets.length !== 4) return null;
  let addr = 0;
  for (const octet of octets) {
    if (!/^\d{1,3}$/.test(octet)) return null;
    const n = Number(octet);
    if (n > 255) return null;
    addr = (addr * 256 + n) >>> 0;
  }

  if (!/^\d{1,2}$/.test(prefixPart)) return null;
  const prefix = Number(prefixPart);
  if (prefix > 32) return null;

  return { addr, prefix, hadPrefix };
}

function maskOf(prefix: number): number {
  // `<< 32` is undefined in JS, so handle /0 explicitly.
  return prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
}

function toDotted(n: number): string {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff].join('.');
}

/** Apply a single query to one already-parsed address. */
function query(p: ParsedV4, q: string): string | number {
  const mask = maskOf(p.prefix);
  const network = (p.addr & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;

  switch (q) {
    case '':
      return p.hadPrefix ? `${toDotted(p.addr)}/${p.prefix}` : toDotted(p.addr);
    case 'address':
      return toDotted(p.addr);
    case 'netmask':
      return toDotted(mask);
    case 'network':
      return toDotted(network);
    case 'prefix':
      return p.prefix;
    case 'broadcast':
      return toDotted(broadcast);
    case 'subnet':
    case 'network/prefix':
      return `${toDotted(network)}/${p.prefix}`;
    case 'host':
    case 'host/prefix':
      return `${toDotted(p.addr)}/${p.prefix}`;
    default:
      throw new Error(
        `ipaddr: unsupported query '${q}' (IPv4 subset only) — preview cannot be rendered exactly`,
      );
  }
}

/**
 * `value | ipaddr(query)`.
 *
 * Accepts a single address string or a list of them (Ansible maps over lists
 * and drops entries that don't match — we mirror that by filtering out `false`).
 */
export function ipaddr(value: unknown, q: unknown = ''): unknown {
  const queryStr = q === undefined ? '' : String(q);

  if (Array.isArray(value)) {
    return value
      .map((item) => ipaddr(item, queryStr))
      .filter((result) => result !== false);
  }

  if (typeof value !== 'string') return false;
  const parsed = parseV4(value);
  if (parsed === null) return false;

  return query(parsed, queryStr);
}

export const ipaddrFilter: FilterDefinition = {
  name: 'ipaddr',
  fidelity: 'exact',
  apply: ipaddr,
};
