import { createTestingPinia } from '@pinia/testing';

export const createFlowsTriggerPinia = (options = {}) =>
  createTestingPinia(options);
