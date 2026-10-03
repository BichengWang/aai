import "@testing-library/jest-dom";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";

// Vitest 5 reads custom matcher types from its own Matchers interface.
declare module "vitest" {
  interface Matchers<R, T> extends TestingLibraryMatchers<unknown, R> {}
}
