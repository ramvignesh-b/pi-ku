import "@testing-library/jest-dom";
import { IDBFactory } from "fake-indexeddb";
import { afterAll, afterEach, beforeAll } from "vitest";
import { server } from "./mocks/server";

/**
 * faking indexeddb in memory for testing crypto key storage
 */
Object.defineProperty(globalThis, "indexedDB", {
  value: new IDBFactory(),
  writable: true,
  configurable: true,
});

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
