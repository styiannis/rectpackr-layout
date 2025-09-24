import {
  clearAllInstancesData,
  MockMutationObserver,
} from './MockMutationObserver';

const original = { MutationObserver: global.MutationObserver };

beforeAll(() => {
  // Mock MutationObserver implementation
  global.MutationObserver = MockMutationObserver;
});

afterAll(() => {
  // Reset MutationObserver mock
  global.MutationObserver = original.MutationObserver;
});

afterEach(() => {
  // Clean up after each test
  clearAllInstancesData();
});

export * from './utils';
