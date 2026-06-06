import { describe, it, expect, vi, afterEach } from 'vitest';
import { copyText } from './clipboard';

/** jsdom doesn't implement execCommand, so define a configurable stub. */
function stubExecCommand(result: boolean) {
  const fn = vi.fn().mockReturnValue(result);
  Object.defineProperty(document, 'execCommand', {
    value: fn,
    configurable: true,
    writable: true,
  });
  return fn;
}

describe('copyText', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    if ('execCommand' in document) Reflect.deleteProperty(document, 'execCommand');
  });

  it('uses the async Clipboard API when available', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const ok = await copyText('interface: Gig0/1\n');

    expect(writeText).toHaveBeenCalledWith('interface: Gig0/1\n');
    expect(ok).toBe(true);
  });

  it('falls back to execCommand in a non-secure context (no Clipboard API)', async () => {
    vi.stubGlobal('navigator', {}); // no .clipboard
    const exec = stubExecCommand(true);

    const ok = await copyText('secret-free yaml');

    expect(exec).toHaveBeenCalledWith('copy');
    expect(ok).toBe(true);
  });

  it('returns false when both paths fail', async () => {
    vi.stubGlobal('navigator', {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) },
    });
    stubExecCommand(false);

    expect(await copyText('x')).toBe(false);
  });
});
