import { describe, it, expect } from 'vitest';
import { diffVars, parseVarsYaml, SECRET_MASK, MAX_VARS_LENGTH } from './vars-diff';

describe('parseVarsYaml', () => {
  it('treats empty / whitespace / comments-only as a valid empty mapping', () => {
    expect(parseVarsYaml('')).toEqual({ ok: true, vars: {} });
    expect(parseVarsYaml('   \n  ')).toEqual({ ok: true, vars: {} });
    expect(parseVarsYaml('# just a comment\n')).toEqual({ ok: true, vars: {} });
  });

  it('parses a top-level mapping', () => {
    expect(parseVarsYaml('hostname: r1\nvlan_id: 10\n')).toEqual({
      ok: true,
      vars: { hostname: 'r1', vlan_id: 10 },
    });
  });

  it('rejects a non-mapping document as shape', () => {
    expect(parseVarsYaml('- a\n- b\n').error).toBe('shape');
    expect(parseVarsYaml('just a string').error).toBe('shape');
  });

  it('rejects unparseable YAML without throwing', () => {
    expect(parseVarsYaml('key: : :\n  - [').error).toBe('parse');
  });

  it('rejects input over the size ceiling', () => {
    const big = `k: ${'x'.repeat(MAX_VARS_LENGTH)}`;
    expect(parseVarsYaml(big).error).toBe('tooLarge');
  });

  it('rejects an alias-bomb (too many anchors) before expanding it', () => {
    const anchors = Array.from({ length: 70 }, (_, i) => `a${i}: &a${i} x`).join('\n');
    expect(parseVarsYaml(anchors).error).toBe('tooLarge');
  });

  it('parses a file holding a !vault value instead of erroring on the tag (#84)', () => {
    const src = 'plain: hi\ndb_password: !vault |\n  $ANSIBLE_VAULT;1.1;AES256\n  66386439\n';
    const parse = parseVarsYaml(src);
    expect(parse.ok).toBe(true);
    expect(parse.vars.plain).toBe('hi');
    // The vault value is captured (passthrough), never decrypted.
    expect(parse.vars.db_password).toBeDefined();
  });
});

describe('diffVars', () => {
  it('classifies every generated key as added against an empty file', () => {
    const r = diffVars('', { hostname: 'r1', vlan_id: 10 });
    expect(r.ok).toBe(true);
    expect(r.added).toEqual(['hostname', 'vlan_id']);
    expect(r.changed).toEqual([]);
    expect(r.unchanged).toEqual([]);
    expect(r.block).toBe('hostname: r1\nvlan_id: 10\n');
  });

  it('splits added / changed / unchanged against an existing file', () => {
    const existing = 'hostname: r1\nvlan_id: 10\n';
    const r = diffVars(existing, { hostname: 'r1', vlan_id: 20, domain: 'example.com' });
    expect(r.unchanged).toEqual(['hostname']);
    expect(r.changed).toEqual(['vlan_id']);
    expect(r.added).toEqual(['domain']);
  });

  it('keeps entries in generated (form) order', () => {
    const r = diffVars('b: 1\n', { a: 1, b: 2, c: 3 });
    expect(r.entries.map((e) => e.key)).toEqual(['a', 'b', 'c']);
    expect(r.entries.map((e) => e.status)).toEqual(['added', 'changed', 'added']);
  });

  it('emits a paste-able block of only the added + changed keys, in order', () => {
    const r = diffVars('hostname: r1\nvlan_id: 10\n', {
      hostname: 'r1',
      vlan_id: 20,
      domain: 'example.com',
    });
    // hostname is unchanged → excluded; vlan_id (changed) and domain (added) kept.
    expect(r.block).toBe('vlan_id: 20\ndomain: example.com\n');
  });

  it('emits an empty block when the file already matches', () => {
    const r = diffVars('hostname: r1\n', { hostname: 'r1' });
    expect(r.unchanged).toEqual(['hostname']);
    expect(r.block).toBe('');
  });

  it('echoes the current value for changed keys (for review)', () => {
    const r = diffVars('vlan_id: 10\n', { vlan_id: 20 });
    const entry = r.entries.find((e) => e.key === 'vlan_id')!;
    expect(entry.existing).toBe('10');
    expect(entry.generated).toBe('20');
  });

  it('does not carry an existing value for added keys', () => {
    const r = diffVars('', { domain: 'example.com' });
    expect(r.entries[0].existing).toBeUndefined();
  });

  it('is order-insensitive on nested mapping keys (no false "changed")', () => {
    const existing = 'router:\n  b: 2\n  a: 1\n';
    const r = diffVars(existing, { router: { a: 1, b: 2 } });
    expect(r.unchanged).toEqual(['router']);
  });

  it('treats a string value and a numeric value as changed (honest about YAML type)', () => {
    // generated text field → string '10'; existing file has int 10.
    const r = diffVars('vlan_id: 10\n', { vlan_id: '10' });
    expect(r.changed).toEqual(['vlan_id']);
  });

  it('masks a credential-named key in both the echoed and generated snippets', () => {
    const r = diffVars('snmp_community: oldpublic\n', { snmp_community: 'newpublic' });
    const entry = r.entries[0];
    expect(entry.existing).toBe(SECRET_MASK);
    expect(entry.generated).toBe(SECRET_MASK);
    // The mask must not echo either real value.
    expect(JSON.stringify(entry)).not.toContain('oldpublic');
    expect(JSON.stringify(entry)).not.toContain('newpublic');
  });

  it('still puts the real secret value in the paste block (it is the file to save)', () => {
    const r = diffVars('snmp_community: oldpublic\n', { snmp_community: 'newpublic' });
    expect(r.block).toBe('snmp_community: newpublic\n');
  });

  it('only classifies generated keys — never lists the file\'s other keys', () => {
    const r = diffVars('hostname: r1\nunrelated: keep-me\n', { vlan_id: 10 });
    const keys = r.entries.map((e) => e.key);
    expect(keys).toEqual(['vlan_id']);
    expect(keys).not.toContain('unrelated');
  });

  it('propagates a parse error instead of a silent empty diff', () => {
    const r = diffVars('- not a mapping\n', { vlan_id: 10 });
    expect(r.ok).toBe(false);
    expect(r.error).toBe('shape');
    expect(r.entries).toEqual([]);
    expect(r.block).toBe('');
  });

  it('diffs list-shaped (sequence) values', () => {
    const existing = 'acls:\n  - { seq: 10, action: permit }\n';
    const same = diffVars(existing, { acls: [{ seq: 10, action: 'permit' }] });
    expect(same.unchanged).toEqual(['acls']);
    const diff = diffVars(existing, { acls: [{ seq: 20, action: 'deny' }] });
    expect(diff.changed).toEqual(['acls']);
  });

  it('diffs cleanly against a file that holds a !vault value (#84)', () => {
    const existing = 'db_password: !vault |\n  $ANSIBLE_VAULT;1.1;AES256\n  66386439\nhostname: r1\n';
    const r = diffVars(existing, { hostname: 'r2' });
    expect(r.ok).toBe(true);
    expect(r.changed).toEqual(['hostname']);
    // The vault key is the file's own — not a generated key — so it is left alone.
    expect(r.entries.map((e) => e.key)).toEqual(['hostname']);
  });
});
