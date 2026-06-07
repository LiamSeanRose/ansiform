import { describe, expect, it } from 'vitest';
import {
  hasVaultBlock,
  looksLikeSecretName,
  looksLikeSetForm,
  segmentTemplate,
} from './segment';

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

describe('looksLikeSetForm (#71)', () => {
  it('detects a Junos / VyOS set-form template', () => {
    expect(
      looksLikeSetForm('set system host-name {{ hostname }}\nset system ntp server {{ ntp }}'),
    ).toBe(true);
  });

  it('detects a Cradlepoint NCOS set-path template', () => {
    expect(
      looksLikeSetForm('set lan/0/name {{ name }}\nset lan/0/ip_address {{ ip }}'),
    ).toBe(true);
  });

  it('reads set commands sitting after a loop tag as column 0', () => {
    const tpl =
      'set system host-name {{ h }}\n{% for n in ntp %}set system ntp server {{ n.server }}\n{% endfor %}';
    expect(looksLikeSetForm(tpl)).toBe(true);
  });

  it('does NOT match indented IOS line CLI', () => {
    expect(
      looksLikeSetForm("interface {{ i }}\n ip address {{ ip | ipaddr('address') }}\n no shutdown"),
    ).toBe(false);
  });

  it('does NOT match an IOS route-map whose set clauses are indented', () => {
    const tpl = 'route-map FOO permit 10\n match ip address prefix-list X\n set local-preference 100';
    expect(looksLikeSetForm(tpl)).toBe(false);
  });
});
