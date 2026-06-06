import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { makeZip, sanitizeZipPath } from './zip';

const LOCAL_SIG = [0x50, 0x4b, 0x03, 0x04];
const EOCD_SIG = [0x50, 0x4b, 0x05, 0x06];

function hasUnzip(): boolean {
  try {
    execFileSync('unzip', ['-v'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

describe('sanitizeZipPath (zip-slip defense)', () => {
  it('keeps normal var-file paths', () => {
    expect(sanitizeZipPath('group_vars/all.yml')).toBe('group_vars/all.yml');
    expect(sanitizeZipPath('host_vars/r1.yml')).toBe('host_vars/r1.yml');
  });
  it('strips traversal and absolute components', () => {
    expect(sanitizeZipPath('../../etc/passwd')).toBe('etc/passwd');
    expect(sanitizeZipPath('/abs/x.yml')).toBe('abs/x.yml');
    expect(sanitizeZipPath('group_vars/../../../x.yml')).toBe('group_vars/x.yml');
    expect(sanitizeZipPath('a\\b\\c')).toBe('a/b/c');
  });
});

describe('makeZip', () => {
  const entries = [
    { path: 'group_vars/all.yml', content: 'hostname: r1\n' },
    { path: 'host_vars/r1.yml', content: 'enabled: true\n' },
  ];

  it('emits a well-formed STORE archive (local headers + EOCD, names present)', () => {
    const zip = makeZip(entries);
    expect([...zip.slice(0, 4)]).toEqual(LOCAL_SIG);
    expect([...zip.slice(zip.length - 22, zip.length - 18)]).toEqual(EOCD_SIG);
    const text = new TextDecoder().decode(zip);
    expect(text).toContain('group_vars/all.yml');
    expect(text).toContain('host_vars/r1.yml');
  });

  it('skips entries that sanitize to an empty path', () => {
    const zip = makeZip([{ path: '..', content: 'x' }, { path: 'ok.yml', content: 'y' }]);
    // total-entries field of the EOCD (offset length-12, uint16 LE) is 1
    const dv = new DataView(zip.buffer, zip.byteLength - 12, 2);
    expect(dv.getUint16(0, true)).toBe(1);
  });

  it('produces an archive real unzip extracts to the right tree (round-trip)', () => {
    if (!hasUnzip()) return; // environment lacks unzip; structural checks still cover format
    const zip = makeZip(entries);
    const dir = mkdtempSync(join(tmpdir(), 'ansiform-zip-'));
    try {
      const zp = join(dir, 'out.zip');
      writeFileSync(zp, zip);
      execFileSync('unzip', ['-o', zp, '-d', join(dir, 'x')], { stdio: 'ignore' });
      expect(readFileSync(join(dir, 'x', 'group_vars', 'all.yml'), 'utf8')).toBe('hostname: r1\n');
      expect(readFileSync(join(dir, 'x', 'host_vars', 'r1.yml'), 'utf8')).toBe('enabled: true\n');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
