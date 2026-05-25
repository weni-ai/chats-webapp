import { createTestingPinia } from '@pinia/testing';

import { useFeatureFlag } from '@/store/modules/featureFlag';

import { FLOW_TRIGGER_VARIABLE_MAPPING_FLAG } from '../types';

export const createFlowsTriggerPinia = (options = {}) =>
  createTestingPinia(options);

export const enableVariableMappingFlag = () => {
  useFeatureFlag().featureFlags = {
    active_features: [FLOW_TRIGGER_VARIABLE_MAPPING_FLAG],
  };
};

export const disableVariableMappingFlag = () => {
  useFeatureFlag().featureFlags = {
    active_features: [],
  };
};
