/**
 * Zero-egress guard (council §5; the #28 security gate, generalized).
 *
 * The product's spine is `connect-src 'none'` — the shipped app must make NO
 * network request of any kind. This test fails the build if any shipped source
 * file (everything under `src/` except tests) contains a network-call API, so a
 * future change — or a new dependency surfaced into our own code — can't quietly
 * add egress. (The #28 zip writer is dependency-free precisely to keep this true.)
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const SRC = join(process.cwd(), 'src');

// Network-capable APIs. Matched as call/constructor syntax so prose comments that
// merely mention "fetch" or "XHR" don't trip the guard.
const FORBIDDEN: { name: string; re: RegExp }[] = [
  { name: 'fetch()', re: /\bfetch\s*\(/ },
  { name: 'XMLHttpRequest', re: /\bXMLHttpRequest\b/ },
  { name: 'WebSocket', re: /\bnew\s+WebSocket\b/ },
  { name: 'EventSource', re: /\bnew\s+EventSource\b/ },
  { name: 'navigator.sendBeacon', re: /\bsendBeacon\s*\(/ },
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (!/\.(ts|tsx)$/.test(entry)) continue;
    if (/\.(test|spec)\.(ts|tsx)$/.test(entry)) continue; // tests aren't shipped
    out.push(full);
  }
  return out;
}

describe('zero-egress guard', () => {
  it('no shipped source file makes a network call', () => {
    const offenders: string[] = [];
    for (const file of sourceFiles(SRC)) {
      const text = readFileSync(file, 'utf8');
      for (const { name, re } of FORBIDDEN) {
        if (re.test(text)) offenders.push(`${file.replace(SRC, 'src')}: ${name}`);
      }
    }
    expect(offenders).toEqual([]);
  });
});
