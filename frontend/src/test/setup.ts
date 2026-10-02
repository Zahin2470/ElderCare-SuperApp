import '@testing-library/jest-dom/vitest';
import 'vitest-axe/extend-expect';
import * as axeMatchers from 'vitest-axe/matchers';
import { afterEach, expect, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

expect.extend(axeMatchers);

afterEach(() => { cleanup(); vi.restoreAllMocks(); });
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
Element.prototype.scrollIntoView = vi.fn();

// jsdom implements neither matchMedia (used by next-themes/sonner) nor ResizeObserver (used by Radix UI).
window.matchMedia ??= ((query: string) => ({
  matches: false, media: query, onchange: null,
  addListener: () => undefined, removeListener: () => undefined,
  addEventListener: () => undefined, removeEventListener: () => undefined, dispatchEvent: () => false,
})) as unknown as typeof window.matchMedia;

// jsdom has no layout engine, so it lacks ResizeObserver, which Radix UI primitives (checkbox, etc.) expect.
class ResizeObserverStub { observe() {} unobserve() {} disconnect() {} }
(globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver ??= ResizeObserverStub;
