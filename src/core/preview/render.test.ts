import { describe, expect, it } from 'vitest';
import { renderPreview, withFidelityFloor, type PreviewResult } from './render';
import { createFilterRegistry, type FilterDefinition } from '../filters/registry';
import { createSeedRegistry } from '../filters/seed';

/** A registry with stub filters of controlled fidelity tiers. */
function stubRegistry(): ReturnType<typeof createFilterRegistry> {
  const r = createFilterRegistry();
  const defs: FilterDefinition[] = [
    { name: 'upper', fidelity: 'exact', apply: (v) => String(v).toUpperCase() },
    { name: 'approx', fidelity: 'approximate', apply: (v) => v },
    { name: 'banned', fidelity: 'unsupported', apply: (v) => v },
    {
      name: 'boom',
      fidelity: 'exact',
      apply: () => {
        throw new Error('kaboom');
      },
    },
    { name: 'default', fidelity: 'exact', apply: (v, fb) => (v === undefined ? fb : v) },
  ];
  for (const d of defs) r.register(d);
  return r;
}

describe('renderPreview', () => {
  const reg = stubRegistry();

  describe('text + variables', () => {
    it('passes literal text through unchanged', () => {
      expect(renderPreview('no shutdown\n', {}, reg).text).toBe('no shutdown\n');
    });

    it('substitutes a variable', () => {
      const out = renderPreview('interface {{ intf }}', { intf: 'Gig0/1' }, reg);
      expect(out.text).toBe('interface Gig0/1');
      expect(out.fidelity).toBe('exact');
    });

    it('renders a missing variable as empty', () => {
      expect(renderPreview('x={{ missing }}', {}, reg).text).toBe('x=');
    });

    it('renders booleans Jinja-style and numbers bare', () => {
      expect(renderPreview('{{ a }}/{{ b }}/{{ n }}', { a: true, b: false, n: 0 }, reg).text).toBe(
        'True/False/0',
      );
    });
  });

  describe('filters + fidelity', () => {
    it('applies an exact filter and stays exact', () => {
      const out = renderPreview('{{ name | upper }}', { name: 'gi0' }, reg);
      expect(out.text).toBe('GI0');
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual(['upper']);
    });

    it('chains filters left to right', () => {
      const out = renderPreview("{{ v | default('x') | upper }}", {}, reg);
      expect(out.text).toBe('X');
      expect(out.filters).toEqual(['default', 'upper']);
    });

    it('downgrades to approximate for an approximate filter', () => {
      const out = renderPreview('{{ v | approx }}', { v: 'hi' }, reg);
      expect(out.text).toBe('hi');
      expect(out.fidelity).toBe('approximate');
    });

    it('unknown filter degrades to unsupported but still renders the input', () => {
      const out = renderPreview('{{ v | mystery }}', { v: 'hi' }, reg);
      expect(out.text).toBe('hi');
      expect(out.fidelity).toBe('unsupported');
      expect(out.filters).toEqual(['mystery']);
    });

    it('explicitly unsupported-tier filter degrades to unsupported', () => {
      expect(renderPreview('{{ v | banned }}', { v: 'hi' }, reg).fidelity).toBe('unsupported');
    });

    it('a filter that throws at runtime degrades to unsupported (never silently wrong)', () => {
      const out = renderPreview('{{ v | boom }}', { v: 'hi' }, reg);
      expect(out.fidelity).toBe('unsupported');
      expect(out.text).toBe('hi'); // falls back to the un-filtered input
    });

    it('reports distinct filters in first-seen order', () => {
      const out = renderPreview('{{ a | upper }} {{ b | upper }} {{ c | approx }}', {
        a: '1',
        b: '2',
        c: '3',
      }, reg);
      expect(out.filters).toEqual(['upper', 'approx']);
    });
  });

  describe('if / elif / else', () => {
    const tpl = '{% if x %}A{% elif y %}B{% else %}C{% endif %}';
    it('takes the first truthy branch', () => {
      expect(renderPreview(tpl, { x: true }, reg).text).toBe('A');
    });
    it('falls through to elif', () => {
      expect(renderPreview(tpl, { x: false, y: true }, reg).text).toBe('B');
    });
    it('falls through to else', () => {
      expect(renderPreview(tpl, { x: false, y: false }, reg).text).toBe('C');
    });
    it('supports not / and / or and comparisons', () => {
      expect(renderPreview('{% if not up %}shutdown{% endif %}', { up: false }, reg).text).toBe(
        'shutdown',
      );
      expect(renderPreview('{% if a and b %}Y{% endif %}', { a: 1, b: 1 }, reg).text).toBe('Y');
      expect(renderPreview('{% if a or b %}Y{% endif %}', { a: 0, b: 1 }, reg).text).toBe('Y');
      expect(renderPreview('{% if n > 10 %}big{% endif %}', { n: 42 }, reg).text).toBe('big');
      expect(renderPreview("{% if s == 'full' %}D{% endif %}", { s: 'full' }, reg).text).toBe('D');
    });
    it('omits an optional line via default(omit) truthiness', () => {
      const tplOmit = "{% if desc %} description {{ desc }}{% endif %}";
      expect(renderPreview(tplOmit, { desc: '' }, reg).text).toBe('');
      expect(renderPreview(tplOmit, { desc: 'uplink' }, reg).text).toBe(' description uplink');
    });
  });

  describe('for loops', () => {
    it('iterates an array', () => {
      const out = renderPreview('{% for p in peers %}neighbor {{ p }}\n{% endfor %}', {
        peers: ['10.0.0.1', '10.0.0.2'],
      }, reg);
      expect(out.text).toBe('neighbor 10.0.0.1\nneighbor 10.0.0.2\n');
    });
    it('renders the for-else branch when empty', () => {
      const out = renderPreview('{% for p in peers %}{{ p }}{% else %}none{% endfor %}', {
        peers: [],
      }, reg);
      expect(out.text).toBe('none');
    });
    it('nests conditionals inside a loop', () => {
      // Note: a newline right after `{% endif %}` would be eaten by trim_blocks
      // (matching Ansible), so use an explicit separator to isolate the nesting.
      const out = renderPreview(
        '{% for v in vlans %}vlan {{ v }}{% if v == 1 %} default{% endif %}|{% endfor %}',
        { vlans: [1, 20] },
        reg,
      );
      expect(out.text).toBe('vlan 1 default|vlan 20|');
    });
  });

  describe('whitespace control (Ansible Jinja environment)', () => {
    it('trim_blocks drops the newline after a block tag', () => {
      // Without trim_blocks this would render a leading blank line.
      const out = renderPreview('{% if on %}\nline1\n{% endif %}\n', { on: true }, reg);
      expect(out.text).toBe('line1\n');
    });
    it('honours explicit {%- -%} trim markers', () => {
      const out = renderPreview('a\n  {%- if on -%}  b{% endif %}', { on: true }, reg);
      expect(out.text).toBe('ab');
    });
    it('strips {# comments #} and their trailing newline', () => {
      expect(renderPreview('{# note #}\nx', {}, reg).text).toBe('x');
    });
  });

  describe('robustness — degrade, never throw or lie', () => {
    it('an unknown tag renders literally and degrades', () => {
      const out = renderPreview('{% switchport %}', {}, reg);
      expect(out.fidelity).toBe('unsupported');
      expect(out.text).toBe('{% switchport %}');
    });
    it('a missing endif degrades structurally', () => {
      expect(renderPreview('{% if x %}oops', { x: true }, reg).fidelity).toBe('unsupported');
    });
    it('a malformed expression degrades and does not throw', () => {
      const out = renderPreview('{{ a + }}', { a: 1 }, reg);
      expect(out.fidelity).toBe('unsupported');
      expect(typeof out.text).toBe('string');
    });
    it('an unterminated delimiter degrades and keeps the rest as text', () => {
      const out = renderPreview('ok {{ a', { a: 1 }, reg);
      expect(out.fidelity).toBe('unsupported');
      expect(out.text).toContain('ok ');
    });
  });

  describe('integration with the real seed registry', () => {
    const seed = createSeedRegistry();

    it('renders an interface/IP template exactly with ipaddr', () => {
      const tpl = [
        'interface {{ interface }}',
        ' ip address {{ ip | ipaddr("address") }} {{ ip | ipaddr("netmask") }}',
        '{% if not enabled %} shutdown{% endif %}',
        '',
      ].join('\n');
      const out = renderPreview(
        tpl,
        { interface: 'GigabitEthernet0/1', ip: '10.0.0.1/24', enabled: true },
        seed,
      );
      expect(out.text).toBe(
        'interface GigabitEthernet0/1\n ip address 10.0.0.1 255.255.255.0\n',
      );
      expect(out.fidelity).toBe('exact');
    });

    it('degrades visibly when ipaddr hits an unsupported query (throws)', () => {
      const out = renderPreview('{{ ip | ipaddr("teredo") }}', { ip: '10.0.0.1' }, seed);
      expect(out.fidelity).toBe('unsupported');
    });
  });
});

describe('withFidelityFloor (#40)', () => {
  const make = (fidelity: PreviewResult['fidelity']): PreviewResult => ({
    text: 'set lan/0/name Primary',
    fidelity,
    filters: [],
  });

  it('clamps an exact render down to approximate when the floor is set', () => {
    const out = withFidelityFloor(make('exact'), 'approximate');
    expect(out.fidelity).toBe('approximate');
    expect(out.text).toBe('set lan/0/name Primary'); // text untouched
  });

  it('leaves an already-degraded render unchanged', () => {
    expect(withFidelityFloor(make('approximate'), 'approximate').fidelity).toBe('approximate');
    // `unsupported` is below the floor, so it is not lifted.
    expect(withFidelityFloor(make('unsupported'), 'approximate').fidelity).toBe('unsupported');
  });

  it('is a no-op when no floor is declared', () => {
    expect(withFidelityFloor(make('exact'), undefined).fidelity).toBe('exact');
  });
});
