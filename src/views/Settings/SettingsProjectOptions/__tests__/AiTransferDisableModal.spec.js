import { beforeAll, afterAll, describe, it, expect, beforeEach } from 'vitest';
import { mount, config } from '@vue/test-utils';

import AiTransferDisableModal from '@/views/Settings/SettingsProjectOptions/AiTransferDisableModal.vue';
import i18n from '@/plugins/i18n';

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
  return mount(AiTransferDisableModal, {
    props: {
      modelValue: true,
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

describe('AiTransferDisableModal.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  describe('Rendering', () => {
    it('should render the modal as open when modelValue is true', () => {
      expect(wrapper.vm.isOpen).toBe(true);
    });

    it('should render the description paragraph', () => {
      const description = wrapper.find(
        '[data-testid="ai-transfer-disable-description"]',
      );
      expect(description.exists()).toBe(true);
      expect(description.text()).toBe(
        'config_chats.project_configs.ai_transfer.disable_modal.description',
      );
    });

    it('should render the confirmation question paragraph', () => {
      const confirmation = wrapper.find(
        '[data-testid="ai-transfer-disable-confirmation"]',
      );
      expect(confirmation.exists()).toBe(true);
      expect(confirmation.text()).toBe(
        'config_chats.project_configs.ai_transfer.disable_modal.confirmation',
      );
    });

    it('should render cancel and confirm buttons', () => {
      expect(
        wrapper.find('[data-testid="ai-transfer-disable-cancel-btn"]').exists(),
      ).toBe(true);
      expect(
        wrapper
          .find('[data-testid="ai-transfer-disable-confirm-btn"]')
          .exists(),
      ).toBe(true);
    });
  });

  describe('Cancel button', () => {
    it('should close the modal without emitting confirm when cancel is clicked', async () => {
      const cancelBtn = wrapper.find(
        '[data-testid="ai-transfer-disable-cancel-btn"]',
      );
      await cancelBtn.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
      expect(wrapper.emitted('confirm')).toBeFalsy();
    });
  });

  describe('Dialog close button', () => {
    it('should close the modal without emitting confirm when the close icon is clicked', async () => {
      const closeBtn = wrapper.find('[data-testid="dialog-close"]');
      await closeBtn.trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
      expect(wrapper.emitted('confirm')).toBeFalsy();
    });
  });

  describe('Confirm button', () => {
    it('should emit confirm and update:modelValue=false when continue is clicked', async () => {
      const confirmBtn = wrapper.find(
        '[data-testid="ai-transfer-disable-confirm-btn"]',
      );
      await confirmBtn.trigger('click');

      expect(wrapper.emitted('confirm')).toBeTruthy();
      expect(wrapper.emitted('confirm').length).toBe(1);
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
    });
  });

  describe('isOpen computed', () => {
    it('should reflect the modelValue prop', async () => {
      wrapper = createWrapper({ modelValue: false });
      expect(wrapper.vm.isOpen).toBe(false);

      await wrapper.setProps({ modelValue: true });
      expect(wrapper.vm.isOpen).toBe(true);
    });

    it('should emit update:modelValue when isOpen is set', () => {
      wrapper.vm.isOpen = false;
      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
    });
  });
});
