import { describe, it, expect, beforeEach } from 'vitest';
import { useBlocksStore, makeEmptyBlock } from './blocksStore';

beforeEach(() => useBlocksStore.setState({ blocks: [makeEmptyBlock()] }));

describe('blocksStore', () => {
  it('starts with one empty block', () => {
    expect(useBlocksStore.getState().blocks).toHaveLength(1);
    expect(useBlocksStore.getState().blocks[0].city).toBeNull();
  });
  it('adds up to 5 and rejects the 6th', () => {
    for (let i = 0; i < 4; i++) expect(useBlocksStore.getState().addBlock()).toBe(true);
    expect(useBlocksStore.getState().blocks).toHaveLength(5);
    expect(useBlocksStore.getState().addBlock()).toBe(false);
  });
  it('removes by id', () => {
    const id = useBlocksStore.getState().blocks[0].id;
    useBlocksStore.getState().addBlock();
    useBlocksStore.getState().removeBlock(id);
    expect(useBlocksStore.getState().blocks.find((b) => b.id === id)).toBeUndefined();
  });
  it('sets city and period', () => {
    const id = useBlocksStore.getState().blocks[0].id;
    useBlocksStore.getState().setBlockCity(id, { name: 'Kyiv', country: 'UA', lat: 1, lon: 2 });
    useBlocksStore.getState().setBlockPeriod(id, '5day');
    const b = useBlocksStore.getState().blocks[0];
    expect(b.city?.name).toBe('Kyiv');
    expect(b.period).toBe('5day');
  });
});
