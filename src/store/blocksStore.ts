import { create } from 'zustand';
import type { City, Period } from '../types/weather';

export const MAX_BLOCKS = 5;

export interface Block { id: string; city: City | null; period: Period; }

export const makeEmptyBlock = (): Block => ({
  id: (crypto.randomUUID?.() ?? String(Math.random())),
  city: null,
  period: 'today',
});

interface BlocksState {
  blocks: Block[];
  addBlock: () => boolean;
  removeBlock: (id: string) => void;
  setBlockCity: (id: string, city: City) => void;
  setBlockPeriod: (id: string, period: Period) => void;
}

export const useBlocksStore = create<BlocksState>((set, get) => ({
  blocks: [makeEmptyBlock()],
  addBlock: () => {
    if (get().blocks.length >= MAX_BLOCKS) return false;
    set((s) => ({ blocks: [...s.blocks, makeEmptyBlock()] }));
    return true;
  },
  removeBlock: (id) => set((s) => ({ blocks: s.blocks.filter((b) => b.id !== id) })),
  setBlockCity: (id, city) =>
    set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, city } : b)) })),
  setBlockPeriod: (id, period) =>
    set((s) => ({ blocks: s.blocks.map((b) => (b.id === id ? { ...b, period } : b)) })),
}));
