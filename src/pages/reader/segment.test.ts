import { describe, expect, it } from 'vitest';
import { hasVaultBlock, looksLikeSecretName, segmentTemplate } from './segment';

describe('segmentTemplate', () => {
  it('splits text / output / tag / comment in order, delimiters included', () => {
    const segs = segmentTemplate('a {{ x }}{% if y %}{# c #}b');
    expect(segs).toEqual([
      { kind: 'text', text: 'a ' },
      { kind: 'output', text: '{{ x }}' },
      { kind: 'tag', text: '{% if y %}' },
      { kind: 'comment', text: '{# c #}' },
      { kind: 'text', text: 'b' },
    ]);
  });

  it('reassembles to the exact original (lossless)', () => {
    const src = 'interface {{ i }}\n{% if d %} description {{ d }}\n{% endif %}';
    expect(segmentTemplate(src).map((s) => s.text).join('')).toBe(src);
  });

  it('treats an unterminated delimiter as plain text', () => {
    expect(segmentTemplate('ok {{ oops')).toEqual([{ kind: 'text', text: 'ok {{ oops' }]);
  });
});

describe('secret heuristics', () => {
  it('flags credential-ish variable names', () => {
    for (const n of ['snmp_community', 'tacacs_key', 'bgp_password', 'api_token', 'PSK'])
      expect(looksLikeSecretName(n)).toBe(true);
    for (const n of ['vlan_id', 'interface', 'router_id']) expect(looksLikeSecretName(n)).toBe(false);
  });

  it('detects a Vault block', () => {
    expect(hasVaultBlock('pw: !vault |\n  $ANSIBLE_VAULT;1.1;AES256')).toBe(true);
    expect(hasVaultBlock('community {{ c }}')).toBe(false);
  });
});
