import {
  clearAllInstancesData,
  MockResizeObserver,
} from './MockResizeObserver';

const original = { ResizeObserver: global.ResizeObserver };

beforeAll(() => {
  // Mock ResizeObserver implementation
  global.ResizeObserver = MockResizeObserver;
});

afterAll(() => {
  // Reset MutationObserver mock
  global.ResizeObserver = original.ResizeObserver;
});

// Clean up after each test
afterEach(() => {
  clearAllInstancesData();
});

export * from './utils';
