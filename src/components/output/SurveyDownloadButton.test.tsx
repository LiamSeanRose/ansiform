import { describe, it, expect, vi, afterEach } from 'vitest';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { SurveyDownloadButton } from './SurveyDownloadButton';
import type { SurveySpec } from '../../core/output/survey-spec';

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const spec: SurveySpec = {
  name: 'Ansiform survey',
  description: '',
  spec: [
    { question_name: 'host', variable: 'host', type: 'text', required: true, default: '' },
    { question_name: 'secret', variable: 'secret', type: 'password', required: false, default: '' },
  ],
};

describe('SurveyDownloadButton', () => {
  let root: Root | null = null;
  let container: HTMLElement | null = null;

  afterEach(() => {
    act(() => root?.unmount());
    container?.remove();
    root = null;
    container = null;
    vi.restoreAllMocks();
  });

  it('downloads the survey spec as a JSON Blob (never a data: URL); secrets stay empty', async () => {
    const created: Blob[] = [];
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn((b: Blob) => {
        created.push(b);
        return 'blob:mock';
      }),
      revokeObjectURL: vi.fn(),
    });
    let anchor: HTMLAnchorElement | undefined;
    const realCreate = document.createElement.bind(document);
    vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
      const el = realCreate(tag) as HTMLElement;
      if (tag === 'a') anchor = el as HTMLAnchorElement;
      return el;
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);

    container = document.createElement('div');
    document.body.appendChild(container);
    act(() => {
      root = createRoot(container!);
      root.render(<SurveyDownloadButton spec={spec} label="AWX survey (.json)" />);
    });

    const button = container.querySelector('button')!;
    expect(button.textContent).toBe('AWX survey (.json)');

    act(() => button.click());

    // A Blob (not a URL-encoded data: string) carried the JSON, saved as survey-spec.json.
    expect(created).toHaveLength(1);
    expect(created[0].type).toBe('application/json');
    expect(anchor?.download).toBe('survey-spec.json');

    const parsed = JSON.parse(await created[0].text());
    expect(parsed).toEqual(spec);
    // Secret question carries no value, by construction.
    expect(parsed.spec.find((q: { variable: string }) => q.variable === 'secret').default).toBe('');

    vi.unstubAllGlobals();
  });
});
