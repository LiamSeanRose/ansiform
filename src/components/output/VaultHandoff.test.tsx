import { describe, it, expect, afterEach, vi } from 'vitest';
import { act } from 'react';
import type { ReactElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { VaultHandoff, type VaultHandoffMessages } from './VaultHandoff';
import { buildVaultCommands } from '../../core/output/vault-commands';

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

const messages: VaultHandoffMessages = {
  heading: 'Encrypt your secrets',
  intro: 'The value is typed at your shell and never enters this tool.',
  copyLabel: 'Copy',
  copyAllLabel: 'Copy all',
  copiedStatus: 'Command copied.',
  copyFailedStatus: 'Copy failed.',
};

const byText = (root: HTMLElement, sel: string, text: string) =>
  [...root.querySelectorAll(sel)].find((el) => el.textContent === text) as HTMLButtonElement;

describe('VaultHandoff (#80)', () => {
  it('renders one command per secret as a text node, never a value input', () => {
    const commands = buildVaultCommands(['enable_secret', 'snmp_community']);
    const el = render(<VaultHandoff commands={commands} messages={messages} />);

    const codes = [...el.querySelectorAll('.vault-handoff__command')];
    expect(codes.map((c) => c.textContent)).toEqual([
      "ansible-vault encrypt_string --name 'enable_secret'",
      "ansible-vault encrypt_string --name 'snmp_community'",
    ]);
    // Command shown as a text node only — no nested markup, no input control.
    expect(codes[0].childElementCount).toBe(0);
    expect(el.querySelector('input')).toBeNull();
    expect(el.querySelector('textarea')).toBeNull();
    // intro explainer is present
    expect(el.querySelector('.vault-handoff__intro')!.textContent).toBe(messages.intro);
  });

  it('copies a single command and announces via the status region', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const el = render(
      <VaultHandoff commands={buildVaultCommands(['api_token'])} messages={messages} />,
    );
    await act(async () => {
      byText(el, 'button', 'Copy').click();
    });
    await flush();

    expect(writeText).toHaveBeenCalledWith("ansible-vault encrypt_string --name 'api_token'");
    expect(el.querySelector('.output__status')!.textContent).toBe('Command copied.');
  });

  it('offers "Copy all" only when there is more than one command', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });

    const one = render(<VaultHandoff commands={buildVaultCommands(['a'])} messages={messages} />);
    expect(byText(one, 'button', 'Copy all')).toBeUndefined();
    act(() => root?.unmount());
    container?.remove();

    const many = render(
      <VaultHandoff commands={buildVaultCommands(['a', 'b'])} messages={messages} />,
    );
    await act(async () => {
      byText(many, 'button', 'Copy all').click();
    });
    await flush();
    expect(writeText).toHaveBeenCalledWith(
      "ansible-vault encrypt_string --name 'a'\nansible-vault encrypt_string --name 'b'",
    );
  });

  it('renders nothing when there are no commands', () => {
    const el = render(<VaultHandoff commands={[]} messages={messages} />);
    expect(el.querySelector('.vault-handoff')).toBeNull();
  });
});
