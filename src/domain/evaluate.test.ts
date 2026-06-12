import { describe, it, expect } from 'vitest';
import type { Diagram, ThemeText } from './types';
import { runChain, traceValues } from './evaluate';

const t = (s: string): ThemeText => ({ data: s, alchemy: s, spellcraft: s, abstract: s });

// A→B: parser turns messy→clean; shredder turns messy→shred. B→C: charter turns clean→chart.
const diagram: Diagram = {
  objects: [{ id: 'A', labels: t('A') }, { id: 'B', labels: t('B') }, { id: 'C', labels: t('C') }],
  morphisms: [
    { id: 'parser', sourceObjectId: 'A', targetObjectId: 'B', labels: t('Parser'), action: { 'v-messy': 'v-clean' } },
    { id: 'shredder', sourceObjectId: 'A', targetObjectId: 'B', labels: t('Shredder'), action: { 'v-messy': 'v-shred' } },
    { id: 'charter', sourceObjectId: 'B', targetObjectId: 'C', labels: t('Charter'), action: { 'v-clean': 'v-chart' } },
  ],
};

describe('value runtime', () => {
  it('runs a value through one machine', () => {
    const r = runChain(diagram, ['parser'], 'v-messy');
    expect(r.ok && r.value).toBe('v-clean');
  });

  it('two same-typed machines produce different outputs', () => {
    expect((runChain(diagram, ['parser'], 'v-messy') as { value: string }).value).toBe('v-clean');
    expect((runChain(diagram, ['shredder'], 'v-messy') as { value: string }).value).toBe('v-shred');
  });

  it('composes behavior down a chain', () => {
    const r = runChain(diagram, ['parser', 'charter'], 'v-messy');
    expect(r.ok && r.value).toBe('v-chart');
  });

  it('jams when a machine cannot process the value it receives', () => {
    // charter only knows v-clean; feeding it v-shred jams.
    const r = runChain(diagram, ['shredder', 'charter'], 'v-messy');
    expect(r.ok).toBe(false);
  });

  it('traces the value at each step for animation', () => {
    expect(traceValues(diagram, ['parser', 'charter'], 'v-messy')).toEqual({
      values: ['v-messy', 'v-clean', 'v-chart'],
      jammedAt: null,
    });
    expect(traceValues(diagram, ['shredder', 'charter'], 'v-messy').jammedAt).toBe(1);
  });
});
