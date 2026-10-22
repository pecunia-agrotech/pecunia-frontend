import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal("ResizeObserver", ResizeObserverMock);
if (!window.PointerEvent) vi.stubGlobal("PointerEvent", MouseEvent);
Object.defineProperty(Element.prototype, "scrollIntoView", {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(Element.prototype, "hasPointerCapture", {
  configurable: true,
  value: () => false,
});
Object.defineProperty(Element.prototype, "setPointerCapture", {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(Element.prototype, "releasePointerCapture", {
  configurable: true,
  value: vi.fn(),
});
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    matches: true,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
});
afterEach(() => cleanup());

Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value: () => ({
    width: 600,
    height: 300,
    top: 0,
    left: 0,
    right: 600,
    bottom: 300,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  }),
});
