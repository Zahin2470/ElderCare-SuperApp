import 'vitest';
import type { AxeMatchers } from 'vitest-axe/matchers';

// Teach TypeScript about the `toHaveNoViolations()` matcher registered in setup.ts.
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-empty-object-type
  interface Assertion<T = any> extends AxeMatchers {}
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
