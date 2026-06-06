/**
 * Minimal, dependency-free ZIP writer (issue #28).
 *
 * Security audit (the #28 gate): this uses the **STORE** method (no compression),
 * so there is **no zlib/JSZip dependency** — zero new supply-chain surface and
 * nothing that could introduce a network call (the `connect-src 'none'` / air-gap
 * guarantee is unchanged; enforced by `src/no-egress.test.ts`). Entry paths are
 * **sanitized against zip-slip** (no `..`, no absolute/leading-slash traversal),
 * so the archive can never write outside its own root when unpacked.
 *
 * Output is a standard ZIP (local file headers + central directory + EOCD) that
 * `unzip`, Explorer, and Ansible repos read directly into a `group_vars/` +
 * `host_vars/` tree.
 */
export interface ZipEntry {
  path: string;
  content: string;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) crc = CRC_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Strip any path traversal / absolute components — zip-slip defense. */
export function sanitizeZipPath(path: string): string {
  return path
    .replace(/\\/g, '/')
    .split('/')
    .filter((seg) => seg !== '' && seg !== '.' && seg !== '..')
    .join('/');
}

/** Build a STORE (uncompressed) ZIP archive from the given entries. */
export function makeZip(entries: readonly ZipEntry[]): Uint8Array {
  const enc = new TextEncoder();
  const locals: Uint8Array[] = [];
  const centrals: Uint8Array[] = [];
  let offset = 0;
  let count = 0;

  for (const entry of entries) {
    const path = sanitizeZipPath(entry.path);
    if (!path) continue;
    const name = enc.encode(path);
    const data = enc.encode(entry.content);
    const crc = crc32(data);

    const local = new Uint8Array(30 + name.length);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // local file header signature
    lv.setUint16(4, 20, true); // version needed
    lv.setUint16(6, 0x0800, true); // flags: UTF-8 names
    lv.setUint16(8, 0, true); // method: STORE
    lv.setUint16(10, 0, true); // mod time
    lv.setUint16(12, 0x21, true); // mod date (1980-01-01)
    lv.setUint32(14, crc, true);
    lv.setUint32(18, data.length, true); // compressed size
    lv.setUint32(22, data.length, true); // uncompressed size
    lv.setUint16(26, name.length, true);
    lv.setUint16(28, 0, true); // extra length
    local.set(name, 30);
    locals.push(local, data);

    const central = new Uint8Array(46 + name.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); // central directory header signature
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0x0800, true); // flags: UTF-8
    cv.setUint16(10, 0, true); // method: STORE
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0x21, true); // mod date
    cv.setUint32(16, crc, true);
    cv.setUint32(20, data.length, true);
    cv.setUint32(24, data.length, true);
    cv.setUint16(28, name.length, true);
    cv.setUint16(42, offset, true); // relative offset of local header
    central.set(name, 46);
    centrals.push(central);

    offset += local.length + data.length;
    count += 1;
  }

  const centralSize = centrals.reduce((sum, c) => sum + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true); // end of central directory signature
  ev.setUint16(8, count, true); // entries on this disk
  ev.setUint16(10, count, true); // total entries
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true); // offset of central directory

  const total = offset + centralSize + eocd.length;
  const out = new Uint8Array(total);
  let p = 0;
  for (const part of locals) {
    out.set(part, p);
    p += part.length;
  }
  for (const part of centrals) {
    out.set(part, p);
    p += part.length;
  }
  out.set(eocd, p);
  return out;
}
