import { describe, expect, it } from 'vitest';
import { buildVaultCommands } from './vault-commands';

describe('buildVaultCommands (#80)', () => {
  it('emits one encrypt_string command per secret, keyed by name only', () => {
    expect(buildVaultCommands(['enable_secret', 'snmp_community'])).toEqual([
      {
        name: 'enable_secret',
        command: "ansible-vault encrypt_string --name 'enable_secret'",
      },
      {
        name: 'snmp_community',
        command: "ansible-vault encrypt_string --name 'snmp_community'",
      },
    ]);
  });

  it('preserves the given order', () => {
    const out = buildVaultCommands(['b', 'a', 'c']);
    expect(out.map((c) => c.name)).toEqual(['b', 'a', 'c']);
  });

  it('skips blank names and collapses duplicates', () => {
    const out = buildVaultCommands(['enable_secret', '', '  ', 'enable_secret']);
    expect(out).toEqual([
      { name: 'enable_secret', command: "ansible-vault encrypt_string --name 'enable_secret'" },
    ]);
  });

  it('trims surrounding whitespace from a name', () => {
    expect(buildVaultCommands(['  pw  '])[0]).toEqual({
      name: 'pw',
      command: "ansible-vault encrypt_string --name 'pw'",
    });
  });

  it('accepts any iterable (e.g. the Set from secretFieldNames) and returns [] for none', () => {
    expect(buildVaultCommands(new Set(['x']))).toEqual([
      { name: 'x', command: "ansible-vault encrypt_string --name 'x'" },
    ]);
    expect(buildVaultCommands([])).toEqual([]);
  });

  it('never places a value in the command — the form has no value parameter', () => {
    // The command always ends at the quoted key; nothing follows that could carry
    // a secret value into argv/history.
    for (const cmd of buildVaultCommands(['api_token'])) {
      expect(cmd.command).toBe("ansible-vault encrypt_string --name 'api_token'");
      expect(cmd.command.endsWith("'api_token'")).toBe(true);
    }
  });
});
