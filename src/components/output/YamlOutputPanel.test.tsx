import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { YamlOutputPanel, type OutputMessages } from './YamlOutputPanel';
import type { OutputArtifact } from '../../core';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root | null = null;
let container: HTMLElement | null = null;

function render(el: ReactElement): HTMLElement {
  container = document.createElement('div');
  document.body.appendChild(container);
  act(() => {
    root = createRoot(container!);
    root.render(el);
  });
  return container;
}

const flush = async () => {
  await act(async () => {
    await Promise.resolve();
  });
};

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const messages: OutputMessages = {
  heading: 'Ansible vars (YAML)',
  pathLabel: 'Suggested file:',
  copyLabel: 'Copy',
  copiedStatus: 'Copied to clipboard.',
  copyFailedStatus: 'Copy failed.',
  downloadLabel: 'Download',
};

const artifact: OutputArtifact = {
  filename: 'host_vars/switch1.yml',
  contentType: 'text/yaml',
  content: 'interface: GigabitEthernet0/1\nenabled: true\n',
};

const byText = (root: HTMLElement, sel: string, text: string) =>
  [...root.querySelectorAll(sel)].find((el) => el.textContent === text) as HTMLButtonElement;

describe('YamlOutputPanel', () => {
  it('renders the suggested path and the YAML as a text node', () => {
    const el = render(<YamlOutputPanel artifact={artifact} messages={messages} />);
    expect(el.querySelector('.output__filename')!.textContent).toBe('host_vars/switch1.yml');
    const pre = el.querySelector('.output__yaml')!;
    expect(pre.textContent).toBe(artifact.content);
    expect(pre.childElementCount).toBe(0); // text node only, no markup
    // status region exists and starts empty
    const status = el.querySelector('.output__status')!;
    expect(status.getAttribute('role')).toBe('status');
    expect(status.textContent).toBe('');
  });

  it('copies the content and announces success via the status region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const el = render(<YamlOutputPanel artifact={artifact} messages={messages} />);
    await act(async () => {
      byText(el, 'button', 'Copy').click();
    });
    await flush();

    expect(writeText).toHaveBeenCalledWith(artifact.content);
    expect(el.querySelector('.output__status')!.textContent).toBe('Copied to clipboard.');
  });

  it('downloads the artifact via a Blob (never persisted/URL-encoded)', () => {
    const created: Blob[] = [];
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((b: Blob) => {
        created.push(b);
        return 'blob:mock';
      }),
      revokeObjectURL: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    const el = render(<YamlOutputPanel artifact={artifact} messages={messages} />);
    act(() => {
      byText(el, 'button', 'Download').click();
    });

    expect(created).toHaveLength(1);
    expect(created[0]).toBeInstanceOf(Blob);
    expect(created[0].type).toBe('text/yaml');
  });
});
