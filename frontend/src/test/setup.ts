// Vitest setup — runs once before the test suite.
// Extends `expect` with jest-dom matchers (toBeInTheDocument, etc.).
import '@testing-library/jest-dom/vitest';

// Vitest runs with `globals: false`, so React Testing Library cannot
// auto-register its post-test cleanup. Wire it up explicitly so each
// test starts from an empty DOM.
import { afterEach, beforeEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import type { Settings } from '../types';

/**
 * A complete, valid Settings object used by the default fetch stub so
 * views that load on mount never crash on missing nested fields.
 */
const STUB_SETTINGS: Settings = {
  transcription: {
    primaryEngine: 'openai/whisper-large-v3',
    shadowEngine: 'apple',
    initialPrompt: '',
    language: 'auto',
  },
  model: {
    runtime: 'llama.cpp',
    model: 'unsloth/gemma-4-E4B-it-GGUF:UD-Q4_K_XL',
    contextWindow: 8192,
    temperature: 0.2,
    multiAgent: false,
  },
  privacy: {
    keepRawAudio: false,
    audioRetention: '30d',
    anonymousErrorReports: false,
    allowCloudFallback: false,
  },
  tools: [],
};

/** Map a request URL to a safe, empty-ish payload for the read routes. */
function stubPayload(url: string): unknown {
  if (url.includes('/api/bench/stats')) {
    return { sampleCount: 0, ifwWer: 0, appleWer: 0, ifwMs: 0, appleMs: 0 };
  }
  if (url.includes('/api/settings')) return STUB_SETTINGS;
  if (
    url.includes('/api/history') ||
    url.includes('/api/vocab') ||
    url.includes('/api/bench/samples')
  ) {
    return [];
  }
  return null;
}

/**
 * Default offline `fetch` stub. Every test starts with a fetch that
 * resolves API reads to safe, empty payloads so components that load
 * data on mount neither hit the network nor crash. Tests that exercise
 * real request/response behavior stub `fetch` themselves; `beforeEach`
 * re-establishes this default for the next test.
 */
function installDefaultFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input.toString();
      return {
        ok: true,
        status: 200,
        json: async () => ({ success: true, data: stubPayload(url), error: null }),
      } as Response;
    }),
  );
}

beforeEach(() => {
  installDefaultFetch();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
