import '@testing-library/jest-dom';

// jsdom lacks matchMedia; Chart.js and theme code may read it.
window.matchMedia = window.matchMedia || ((query: string) => ({
  matches: false, media: query, onchange: null,
  addListener: () => {}, removeListener: () => {},
  addEventListener: () => {}, removeEventListener: () => {}, dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

// jsdom doesn't implement canvas getContext; stub a no-op 2D context so
// Chart.js renders under tests without polluting output with warnings.
const canvasContextStub = new Proxy({}, {
  get: (_target, prop) => {
    if (prop === 'measureText') return () => ({ width: 0 });
    if (prop === 'createLinearGradient' || prop === 'createRadialGradient' || prop === 'createPattern')
      return () => canvasContextStub;
    if (prop === 'getImageData') return () => ({ data: [] });
    return () => {};
  },
  set: () => true,
});
HTMLCanvasElement.prototype.getContext =
  (() => canvasContextStub) as unknown as typeof HTMLCanvasElement.prototype.getContext;
