import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  beforeEach,
} from 'vitest';
import { mount, config } from '@vue/test-utils';

import AiTransferModal from '@/views/Settings/SettingsProjectOptions/AiTransferModal.vue';
import i18n from '@/plugins/i18n';
import agentBuilder from '@/services/api/resources/settings/agentBuilder';
import callUnnnicAlert from '@/utils/callUnnnicAlert';

vi.mock('@/services/api/resources/settings/agentBuilder', () => ({
  default: {
    updateAiTransferConfig: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('@/utils/callUnnnicAlert', () => ({
  default: vi.fn(),
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const createWrapper = (props = {}) => {
  return mount(AiTransferModal, {
    props: {
      modelValue: true,
      initialCriteria: '',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicDialog: {
          template: '<div><slot /></div>',
          props: ['open'],
        },
        UnnnicDialogContent: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogHeader: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogTitle: {
          template: '<div><slot /></div>',
        },
        UnnnicDialogClose: {
          template:
            '<button data-testid="dialog-close" @click="$emit(\'click\')"></button>',
        },
        UnnnicDialogFooter: {
          template: '<div><slot /></div>',
        },
      },
    },
  });
};

describe('AiTransferModal.vue', () => {
  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    wrapper = createWrapper();
  });

  describe('Rendering', () => {
    it('should render the modal component', () => {
      expect(wrapper.vm.isOpen).toBe(true);
    });

    it('should render textarea with correct label', () => {
      const textarea = wrapper.find(
        '[data-testid="ai-transfer-criteria-textarea"]',
      );
      expect(textarea.exists()).toBe(true);
    });

    it('should render cancel and save buttons', () => {
      expect(
        wrapper.find('[data-testid="ai-transfer-cancel-btn"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="ai-transfer-save-btn"]').exists(),
      ).toBe(true);
    });
  });

  describe('Initial criteria', () => {
    it('should populate textarea with initialCriteria when opened', async () => {
      wrapper = createWrapper({
        modelValue: false,
        initialCriteria: 'Pre-filled criteria',
      });

      await wrapper.setProps({ modelValue: true });
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.criteriaText).toBe('Pre-filled criteria');
    });

    it('should have empty textarea when no initial criteria', () => {
      expect(wrapper.vm.criteriaText).toBe('');
    });
  });

  describe('Save button', () => {
    it('should disable save button when textarea is empty', () => {
      const saveBtn = wrapper.find('[data-testid="ai-transfer-save-btn"]');
      expect(saveBtn.attributes('disabled')).toBeDefined();
    });

    it('should enable save button when textarea has content', async () => {
      wrapper.vm.criteriaText = 'Some criteria';
      await wrapper.vm.$nextTick();

      const saveBtn = wrapper.find('[data-testid="ai-transfer-save-btn"]');
      expect(saveBtn.attributes('disabled')).toBeUndefined();
    });

    it('should call agentBuilder.updateAiTransferConfig on save', async () => {
      wrapper.vm.criteriaText = 'My criteria';
      await wrapper.vm.$nextTick();

      await wrapper.vm.save();

      expect(agentBuilder.updateAiTransferConfig).toHaveBeenCalledWith({
        enabled: true,
        criteria: 'My criteria',
      });
    });

    it('should emit saved event with trimmed criteria', async () => {
      wrapper.vm.criteriaText = '  Trimmed criteria  ';
      await wrapper.vm.$nextTick();

      await wrapper.vm.save();

      expect(wrapper.emitted('saved')).toBeTruthy();
      expect(wrapper.emitted('saved')[0]).toEqual(['Trimmed criteria']);
    });

    it('should close modal after saving', async () => {
      wrapper.vm.criteriaText = 'Some criteria';
      await wrapper.vm.$nextTick();

      await wrapper.vm.save();

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const lastEmit =
        wrapper.emitted('update:modelValue')[
          wrapper.emitted('update:modelValue').length - 1
        ];
      expect(lastEmit).toEqual([false]);
    });

    it('should show success alert after saving', async () => {
      wrapper.vm.criteriaText = 'Some criteria';
      await wrapper.vm.$nextTick();

      await wrapper.vm.save();

      expect(callUnnnicAlert).toHaveBeenCalledWith({
        props: {
          text: expect.any(String),
          type: 'success',
        },
        seconds: 5,
      });
    });

    it('should not save when textarea is empty', async () => {
      wrapper.vm.criteriaText = '   ';
      await wrapper.vm.$nextTick();

      await wrapper.vm.save();

      expect(agentBuilder.updateAiTransferConfig).not.toHaveBeenCalled();
    });
  });

  describe('Cancel button', () => {
    it('should close modal on cancel', async () => {
      const cancelBtn = wrapper.find('[data-testid="ai-transfer-cancel-btn"]');
      await cancelBtn.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
    });
  });

  describe('Error handling', () => {
    it('should show error alert when save fails', async () => {
      agentBuilder.updateAiTransferConfig.mockRejectedValueOnce(
        new Error('API Error'),
      );

      wrapper.vm.criteriaText = 'Some criteria';
      await wrapper.vm.$nextTick();

      await wrapper.vm.save();

      expect(callUnnnicAlert).toHaveBeenCalledWith({
        props: {
          text: expect.any(String),
          type: 'error',
        },
        seconds: 5,
      });
      expect(wrapper.vm.isSaving).toBe(false);
    });

    it('should not emit saved or close modal on error', async () => {
      agentBuilder.updateAiTransferConfig.mockRejectedValueOnce(
        new Error('API Error'),
      );

      wrapper.vm.criteriaText = 'Some criteria';
      await wrapper.vm.$nextTick();

      await wrapper.vm.save();

      expect(wrapper.emitted('saved')).toBeFalsy();
    });
  });
});
