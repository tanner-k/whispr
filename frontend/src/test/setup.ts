// Vitest setup — runs once before the test suite.
// Extends `expect` with jest-dom matchers (toBeInTheDocument, etc.).
import '@testing-library/jest-dom/vitest';

// Vitest runs with `globals: false`, so React Testing Library cannot
// auto-register its post-test cleanup. Wire it up explicitly so each
// test starts from an empty DOM.
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});
