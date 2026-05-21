import { expect, describe, it, vi, beforeEach } from 'vitest';
import { flushPromises, mount } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';

import SatisfactionSurveySection from '../SatisfactionSurveySection.vue';

vi.mock('@/services/api/resources/chats/flowsTrigger.js', () => ({
  default: {
    getFlows: vi.fn(() => Promise.resolve([])),
  },
}));

const sectorMock = {
  is_csat_enabled: false,
  custom_csat_flow_uuid: null,
};

function createWrapper({ modelValue = sectorMock, csatEnabled = true } = {}) {
  const pinia = createTestingPinia({
    createSpy: vi.fn,
    initialState: {
      featureFlag: {
        featureFlags: {
          active_features: csatEnabled ? ['weniChatsCSAT'] : [],
        },
      },
    },
    stubActions: false,
  });

  return mount(SatisfactionSurveySection, {
    props: { modelValue },
    global: {
      plugins: [pinia],
      stubs: {
        UnnnicSwitch: true,
        UnnnicRadio: true,
        UnnnicDisclaimer: true,
        SelectFlow: true,
      },
    },
  });
}

describe('SatisfactionSurveySection', () => {
  useCompositionI18nInThisSpecFile();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render the section when feature flag weniChatsCSAT is disabled', () => {
    const wrapper = createWrapper({ csatEnabled: false });
    expect(
      wrapper.find('[data-testid="satisfaction-survey-title"]').exists(),
    ).toBe(false);
  });

  it('should render the section title and switch when feature flag is enabled', () => {
    const wrapper = createWrapper();
    expect(
      wrapper.find('[data-testid="satisfaction-survey-title"]').exists(),
    ).toBe(true);
    expect(
      wrapper.find('[data-testid="satisfaction-survey-switch"]').exists(),
    ).toBe(true);
  });

  it('should not render options when csat is disabled', () => {
    const wrapper = createWrapper();
    expect(
      wrapper.find('[data-testid="satisfaction-survey-options"]').exists(),
    ).toBe(false);
  });

  it('should render options with default selected when csat is enabled', () => {
    const wrapper = createWrapper({
      modelValue: { ...sectorMock, is_csat_enabled: true },
    });
    expect(
      wrapper.find('[data-testid="satisfaction-survey-options"]').exists(),
    ).toBe(true);
    expect(wrapper.vm.csatType).toBe('default');
    expect(wrapper.find('[data-testid="csat-type-default"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="csat-type-custom"]').exists()).toBe(
      true,
    );
  });

  it('should render the survey type label with tooltip when csat is enabled', () => {
    const wrapper = createWrapper({
      modelValue: { ...sectorMock, is_csat_enabled: true },
    });
    const label = wrapper.find('[data-testid="csat-type-label"]');
    expect(label.exists()).toBe(true);
    expect(label.text()).toContain(
      wrapper.vm.$t('sector.additional_options.csat.type.label'),
    );
  });

  it('should derive csat_type as custom when custom_csat_flow_uuid is set', () => {
    const wrapper = createWrapper({
      modelValue: {
        ...sectorMock,
        is_csat_enabled: true,
        custom_csat_flow_uuid: 'existing-flow',
      },
    });
    expect(wrapper.vm.csatType).toBe('custom');
    expect(wrapper.find('[data-testid="csat-flow-select"]').exists()).toBe(
      true,
    );
  });

  it('should not render flow select when csat type is default', () => {
    const wrapper = createWrapper({
      modelValue: { ...sectorMock, is_csat_enabled: true },
    });
    expect(wrapper.find('[data-testid="csat-flow-select"]').exists()).toBe(
      false,
    );
    expect(
      wrapper.find('[data-testid="csat-custom-disclaimer"]').exists(),
    ).toBe(false);
  });

  it('should render flow select and disclaimer after switching to custom type', async () => {
    const wrapper = createWrapper({
      modelValue: { ...sectorMock, is_csat_enabled: true },
    });
    wrapper.vm.handleTypeChange('custom');
    await flushPromises();

    expect(wrapper.find('[data-testid="csat-flow-select"]').exists()).toBe(
      true,
    );
    expect(
      wrapper.find('[data-testid="csat-custom-disclaimer"]').exists(),
    ).toBe(true);
  });

  it('should forward disableGetChatsTag=true to the flow select when csat type is custom', () => {
    const wrapper = createWrapper({
      modelValue: {
        ...sectorMock,
        is_csat_enabled: true,
        custom_csat_flow_uuid: 'existing-flow',
      },
    });

    const flowSelect = wrapper.findComponent(
      '[data-testid="csat-flow-select"]',
    );
    expect(flowSelect.exists()).toBe(true);
    expect(flowSelect.props('disableGetChatsTag')).toBe(true);
  });

  it('should set is_csat_enabled to true and reset uuid on enabling switch', async () => {
    const wrapper = createWrapper();
    wrapper.vm.handleEnabledChange(true);
    await flushPromises();

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted).toBeTruthy();
    expect(emitted[0][0]).toEqual({
      is_csat_enabled: true,
      custom_csat_flow_uuid: null,
    });
    expect(wrapper.vm.csatType).toBe('default');
  });

  it('should reset csat fields on disabling the switch', async () => {
    const wrapper = createWrapper({
      modelValue: {
        ...sectorMock,
        is_csat_enabled: true,
        custom_csat_flow_uuid: 'flow-uuid',
      },
    });
    wrapper.vm.handleEnabledChange(false);
    await flushPromises();

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted[0][0]).toEqual({
      is_csat_enabled: false,
      custom_csat_flow_uuid: null,
    });
    expect(wrapper.vm.csatType).toBe('default');
  });

  it('should clear custom_csat_flow_uuid when switching to default type', async () => {
    const wrapper = createWrapper({
      modelValue: {
        ...sectorMock,
        is_csat_enabled: true,
        custom_csat_flow_uuid: 'flow-uuid',
      },
    });
    wrapper.vm.handleTypeChange('default');
    await flushPromises();

    expect(wrapper.vm.csatType).toBe('default');
    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted[0][0]).toEqual({
      is_csat_enabled: true,
      custom_csat_flow_uuid: null,
    });
  });

  it('should not emit update:modelValue when switching to custom without prior uuid', async () => {
    const wrapper = createWrapper({
      modelValue: { ...sectorMock, is_csat_enabled: true },
    });
    wrapper.vm.handleTypeChange('custom');
    await flushPromises();

    expect(wrapper.vm.csatType).toBe('custom');
    expect(wrapper.emitted('update:modelValue')).toBeFalsy();
  });

  it('should update custom_csat_flow_uuid when a flow is selected', async () => {
    const wrapper = createWrapper({
      modelValue: {
        ...sectorMock,
        is_csat_enabled: true,
        custom_csat_flow_uuid: 'old-flow',
      },
    });
    wrapper.vm.handleFlowChange('new-flow-uuid');
    await flushPromises();

    const emitted = wrapper.emitted('update:modelValue');
    expect(emitted[0][0].custom_csat_flow_uuid).toBe('new-flow-uuid');
  });

  describe('change-is-valid emission', () => {
    it('should emit true when csat is disabled', () => {
      const wrapper = createWrapper();
      const emitted = wrapper.emitted('change-is-valid');
      expect(emitted).toBeTruthy();
      expect(emitted.at(-1)[0]).toBe(true);
    });

    it('should emit true when csat is enabled with default type', () => {
      const wrapper = createWrapper({
        modelValue: { ...sectorMock, is_csat_enabled: true },
      });
      const emitted = wrapper.emitted('change-is-valid');
      expect(emitted.at(-1)[0]).toBe(true);
    });

    it('should emit false when csat is custom without a flow uuid', async () => {
      const wrapper = createWrapper({
        modelValue: { ...sectorMock, is_csat_enabled: true },
      });
      wrapper.vm.handleTypeChange('custom');
      await flushPromises();

      const emitted = wrapper.emitted('change-is-valid');
      expect(emitted.at(-1)[0]).toBe(false);
    });

    it('should emit true when csat is custom with a flow uuid', () => {
      const wrapper = createWrapper({
        modelValue: {
          ...sectorMock,
          is_csat_enabled: true,
          custom_csat_flow_uuid: 'flow-uuid',
        },
      });
      const emitted = wrapper.emitted('change-is-valid');
      expect(emitted.at(-1)[0]).toBe(true);
    });
  });
});
