/**
 * `!vault` passthrough: parse and re-emit Ansible Vault values byte-exact (#84).
 *
 * Ansible inline-encrypted values carry the application tag `!vault`, e.g.
 *
 *   db_password: !vault |
 *     $ANSIBLE_VAULT;1.1;AES256
 *     66386439...
 *
 * js-yaml's default schema does not know this tag, so a plain `load()` **throws**
 * ("unknown tag !<!vault>") — which means any file holding a vault value can't be
 * read at all (e.g. pasted into the merge diff, #82, or the reader). This schema
 * teaches js-yaml the tag so such files parse, and guarantees a vault value
 * survives a `load → dump` round-trip unchanged.
 *
 * Spine (council §5 / scope discipline): **flag-and-passthrough, never decrypt.**
 * The ciphertext is captured as an opaque string and re-emitted verbatim under the
 * same `!vault` tag and block-literal style — it is never decrypted, never
 * prompted for, never logged, and never treated as a value to render or transform.
 * The only operations on it are "hold the bytes" and "write the same bytes back".
 */
import { DEFAULT_SCHEMA, Type, type Schema } from 'js-yaml';

/**
 * An opaque Ansible Vault ciphertext. We hold the exact payload string js-yaml
 * gave us (the dedented block-scalar contents) and nothing else — there is no
 * decrypt method by design.
 */
export class VaultValue {
  readonly ciphertext: string;
  constructor(ciphertext: string) {
    this.ciphertext = ciphertext;
  }
}

/** Type guard for a captured `!vault` value. */
export function isVaultValue(v: unknown): v is VaultValue {
  return v instanceof VaultValue;
}

/**
 * The `!vault` scalar type. On load it wraps the raw payload; on dump it writes
 * the payload straight back. js-yaml renders a multi-line string as a block
 * literal (`|`) under our dump options, so the re-emitted form matches Ansible's.
 */
const vaultType = new Type('!vault', {
  kind: 'scalar',
  // Any scalar carrying the tag is accepted; we make no claim about its contents.
  resolve: () => true,
  construct: (data) => new VaultValue(typeof data === 'string' ? data : data == null ? '' : String(data)),
  instanceOf: VaultValue,
  represent: (obj) => (obj as VaultValue).ciphertext,
});

/**
 * The default js-yaml schema (safe — no code execution) extended with the
 * `!vault` tag. Use this as the `schema` option for both `load` and `dump`
 * everywhere the app reads or writes vars that might carry a vault value, so the
 * two directions stay in lockstep and the round-trip is identity.
 */
export const VAULT_SCHEMA: Schema = DEFAULT_SCHEMA.extend([vaultType]);
