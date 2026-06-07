/**
 * Vault hand-off command builder (issue #80).
 *
 * Secrets are first-class (council §5): the tool masks them in the preview and
 * leaves them in the always-correct YAML, but it stops short of helping the user
 * actually *vault* them. This pure builder closes that gap — given the secret
 * field key names in play, it emits the exact `ansible-vault encrypt_string`
 * command the user runs locally to encrypt each one.
 *
 * Spine: the command form is `--name '<key>'` with NO value argument, so the
 * secret is typed at the user's own shell (read from stdin) and never appears in
 * argv, shell history, this builder's input, or its output. This module accepts
 * and emits **key names only** — there is no parameter through which a value
 * could pass. Ansible variable names are `[A-Za-z_][A-Za-z0-9_]*`, so single
 * quoting the name is always shell-safe for the names the schema can produce.
 */

/** One vault command: the variable name and the exact shell line to run. */
export interface VaultCommand {
  /** The variable name being vaulted (key only — never a value). */
  name: string;
  /** The exact command to run locally; it prompts for the value on stdin. */
  command: string;
}

/**
 * Build one `ansible-vault encrypt_string --name '<key>'` command per secret key
 * name, in the order given. Blank names are skipped and duplicates collapse, so
 * the result is a clean one-command-per-secret list. Never accepts or emits a
 * value.
 */
export function buildVaultCommands(secretNames: Iterable<string>): VaultCommand[] {
  const seen = new Set<string>();
  const commands: VaultCommand[] = [];
  for (const name of secretNames) {
    const key = name.trim();
    if (key === '' || seen.has(key)) continue;
    seen.add(key);
    commands.push({ name: key, command: `ansible-vault encrypt_string --name '${key}'` });
  }
  return commands;
}
