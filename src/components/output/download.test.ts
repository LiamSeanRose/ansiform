import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadText } from './download';

describe('downloadText', () => {
  afterEach(() => vi.restoreAllMocks());

  it('downloads byte-identical content via a Blob object URL (never a data: URL)', async () => {
    const created: Blob[] = [];
    const createObjectURL = vi.fn((blob: Blob) => {
      created.push(blob);
      return 'blob:mock-url';
    });
    const revokeObjectURL = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL });

    let anchor: HTMLAnchorElement | undefined;
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag) as HTMLElement;
      if (tag === 'a') anchor = el as HTMLAnchorElement;
      return el;
    });
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);

    const content = 'interface: GigabitEthernet0/1\nenabled: true\n';
    downloadText(content, 'host_vars/switch1.yml', 'text/yaml');

    // A Blob (not a URL-encoded data: string) carried the content.
    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(created[0]).toBeInstanceOf(Blob);
    expect(created[0].type).toBe('text/yaml');
    expect(await created[0].text()).toBe(content); // byte-identical

    // The anchor pointed at the object URL and saved as the path's basename.
    expect(anchor?.href).toBe('blob:mock-url');
    expect(anchor?.download).toBe('switch1.yml');
    expect(click).toHaveBeenCalledTimes(1);

    // The object URL is revoked (no lingering reference).
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');

    vi.unstubAllGlobals();
  });

  it('falls back to a default filename when the path has no basename', async () => {
    const createObjectURL = vi.fn(() => 'blob:x');
    vi.stubGlobal('URL', { ...URL, createObjectURL, revokeObjectURL: vi.fn() });
    let anchor: HTMLAnchorElement | undefined;
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag) as HTMLElement;
      if (tag === 'a') anchor = el as HTMLAnchorElement;
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    downloadText('x', '');
    expect(anchor?.download).toBe('vars.yml');
    vi.unstubAllGlobals();
  });
});
