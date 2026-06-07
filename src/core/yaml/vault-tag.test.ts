import { describe, expect, it } from 'vitest';
import { dump, load } from 'js-yaml';
import { VAULT_SCHEMA, VaultValue, isVaultValue } from './vault-tag';

const DUMP_OPTS = {
  indent: 2,
  lineWidth: -1,
  noRefs: true,
  sortKeys: false,
  quotingType: "'" as const,
  forceQuotes: false,
  schema: VAULT_SCHEMA,
};

const loadV = (src: string) => load(src, { schema: VAULT_SCHEMA });
const dumpV = (obj: unknown) => dump(obj, DUMP_OPTS);
const roundTrip = (src: string) => dumpV(loadV(src));

const VAULT_BLOCK = `db_password: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  66386439653236336462626566653063
  3438626166373266`;

describe('VAULT_SCHEMA', () => {
  it('parses a !vault value instead of throwing on the unknown tag', () => {
    // Baseline: the default schema cannot read this at all.
    expect(() => load(VAULT_BLOCK)).toThrow();
    const doc = loadV(VAULT_BLOCK) as { db_password: unknown };
    expect(isVaultValue(doc.db_password)).toBe(true);
  });

  it('captures the ciphertext opaquely and exposes no way to decrypt it', () => {
    const doc = loadV(VAULT_BLOCK) as { db_password: VaultValue };
    expect(doc.db_password.ciphertext).toContain('$ANSIBLE_VAULT;1.1;AES256');
    // The payload is held verbatim; there is no decrypt surface.
    expect(Object.keys(doc.db_password)).toEqual(['ciphertext']);
    expect((doc.db_password as unknown as Record<string, unknown>).decrypt).toBeUndefined();
  });

  it('re-emits a !vault value as a tagged block literal, payload preserved', () => {
    const out = roundTrip(VAULT_BLOCK);
    expect(out).toContain('!vault |');
    expect(out).toContain('$ANSIBLE_VAULT;1.1;AES256');
    expect(out).toContain('66386439653236336462626566653063');
  });

  it('round-trips a !vault value with identity (load → dump → load)', () => {
    const once = loadV(VAULT_BLOCK) as { db_password: VaultValue };
    const twice = loadV(roundTrip(VAULT_BLOCK)) as { db_password: VaultValue };
    expect(twice.db_password.ciphertext).toBe(once.db_password.ciphertext);
  });

  it('preserves multiple vault values and a nested one in the same document', () => {
    const src = `a: !vault |
  $ANSIBLE_VAULT;1.1;AES256
  1111
b:
  nested: !vault |
    $ANSIBLE_VAULT;1.1;AES256
    2222
`;
    const doc = loadV(src) as { a: VaultValue; b: { nested: VaultValue } };
    expect(isVaultValue(doc.a)).toBe(true);
    expect(isVaultValue(doc.b.nested)).toBe(true);
    const round = loadV(roundTrip(src)) as { a: VaultValue; b: { nested: VaultValue } };
    expect(round.a.ciphertext).toBe(doc.a.ciphertext);
    expect(round.b.nested.ciphertext).toBe(doc.b.nested.ciphertext);
  });

  it('leaves a non-vault document byte-identical to the plain schema (no collateral reformatting)', () => {
    const plainObj = { name: 'r1', vlan: 10, enabled: true, ips: ['10.0.0.1', '10.0.0.2'] };
    const withVault = dump(plainObj, DUMP_OPTS);
    const withoutVault = dump(plainObj, { ...DUMP_OPTS, schema: undefined });
    expect(withVault).toBe(withoutVault);
  });

  it('handles an empty / odd payload without throwing', () => {
    const doc = loadV('x: !vault ""') as { x: VaultValue };
    expect(isVaultValue(doc.x)).toBe(true);
    expect(doc.x.ciphertext).toBe('');
    expect(() => dumpV(doc)).not.toThrow();
  });
});
