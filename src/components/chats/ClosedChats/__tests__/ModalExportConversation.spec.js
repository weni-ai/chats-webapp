import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';
useCompositionI18nInThisSpecFile();

import ModalExportConversation from '../ModalExportConversation.vue';
import History from '@/services/api/resources/chats/history';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/history', () => ({
  default: {
    exportRoom: vi.fn(),
  },
}));

vi.mock('@weni/unnnic-system', async (importOriginal) => {
  const mod = await importOriginal();
  return {
    ...mod,
    UnnnicToastManager: {
      ...mod.UnnnicToastManager,
      success: vi.fn(),
      error: vi.fn(),
    },
  };
});

const dialogStubs = {
  UnnnicDialog: {
    name: 'UnnnicDialogStub',
    props: ['open'],
    emits: ['update:open'],
    template: `
      <div v-if="open" data-testid="dialog">
        <slot />
      </div>
    `,
  },
  UnnnicDialogContent: {
    props: ['size'],
    template: '<div><slot /></div>',
  },
  UnnnicDialogHeader: {
    template: '<div><slot /></div>',
  },
  UnnnicDialogTitle: {
    template: '<div><slot /></div>',
  },
  UnnnicDialogFooter: {
    template: '<div><slot /></div>',
  },
  UnnnicDialogClose: {
    template: '<div @click="$emit(\'click\')"><slot /></div>',
    emits: ['click'],
  },
  UnnnicButton: {
    template:
      '<button :data-testid="$attrs[`data-testid`]" :disabled="disabled" @click="$emit(`click`)"><slot /></button>',
    props: ['text', 'type', 'loading', 'disabled'],
    emits: ['click'],
  },
  UnnnicRadio: {
    props: ['modelValue', 'value', 'size'],
    emits: ['update:model-value'],
    template: `
      <label :data-testid="'radio-' + value">
        <input
          type="radio"
          :checked="modelValue === value"
          @change="$emit('update:model-value', value)"
        />
        <slot />
      </label>
    `,
  },
  UnnnicDisclaimer: {
    props: ['type', 'description'],
    template: '<div data-testid="disclaimer">{{ description }}</div>',
  },
  UnnnicCheckbox: {
    props: ['modelValue', 'textRight'],
    emits: ['update:modelValue'],
    template: `
      <label data-testid="export-conversation-accept-terms">
        <input
          type="checkbox"
          :checked="modelValue"
          @change="$emit('update:modelValue', !modelValue)"
        />
        {{ textRight }}
      </label>
    `,
  },
};

describe('ModalExportConversation', () => {
  let wrapper;

  const createWrapper = (props = {}) => {
    return mount(ModalExportConversation, {
      props: {
        modelValue: true,
        roomId: 'room-uuid-123',
        ...props,
      },
      global: {
        stubs: dialogStubs,
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the modal when modelValue is true', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(true);
    });

    it('does not render the modal when modelValue is false', () => {
      wrapper = createWrapper({ modelValue: false });
      expect(wrapper.find('[data-testid="dialog"]').exists()).toBe(false);
    });

    it('renders the disclaimer', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="disclaimer"]').exists()).toBe(true);
    });

    it('has PDF as default selected format', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.selectedFormat).toBe('PDF');
    });

    it('renders the terms checkbox', () => {
      wrapper = createWrapper();
      expect(
        wrapper
          .find('[data-testid="export-conversation-accept-terms"]')
          .exists(),
      ).toBe(true);
    });

    it('renders the export button disabled by default', () => {
      wrapper = createWrapper();
      const submitBtn = wrapper.find(
        '[data-testid="export-conversation-submit"]',
      );
      expect(submitBtn.exists()).toBe(true);
      expect(submitBtn.attributes('disabled')).toBeDefined();
    });
  });

  describe('Interactions', () => {
    it('enables the export button when terms are accepted', async () => {
      wrapper = createWrapper();

      const checkbox = wrapper.find(
        '[data-testid="export-conversation-accept-terms"] input',
      );
      await checkbox.trigger('change');

      const submitBtn = wrapper.find(
        '[data-testid="export-conversation-submit"]',
      );
      expect(submitBtn.attributes('disabled')).toBeUndefined();
    });

    it('selects HTML format when changed', async () => {
      wrapper = createWrapper();

      wrapper.vm.selectedFormat = 'HTML';
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedFormat).toBe('HTML');
    });

    it('defaults to PDF format', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.selectedFormat).toBe('PDF');
    });
  });

  describe('Export flow', () => {
    it('calls History.exportRoom with correct params on submit', async () => {
      History.exportRoom.mockResolvedValue({});
      wrapper = createWrapper();

      const checkbox = wrapper.find(
        '[data-testid="export-conversation-accept-terms"] input',
      );
      await checkbox.trigger('change');

      const submitBtn = wrapper.find(
        '[data-testid="export-conversation-submit"]',
      );
      await submitBtn.trigger('click');

      expect(History.exportRoom).toHaveBeenCalledWith({
        room: 'room-uuid-123',
        types: ['PDF'],
      });
    });

    it('calls exportRoom with HTML type when HTML is selected', async () => {
      History.exportRoom.mockResolvedValue({});
      wrapper = createWrapper();

      wrapper.vm.selectedFormat = 'HTML';
      await wrapper.vm.$nextTick();

      const checkbox = wrapper.find(
        '[data-testid="export-conversation-accept-terms"] input',
      );
      await checkbox.trigger('change');

      const submitBtn = wrapper.find(
        '[data-testid="export-conversation-submit"]',
      );
      await submitBtn.trigger('click');

      expect(History.exportRoom).toHaveBeenCalledWith({
        room: 'room-uuid-123',
        types: ['HTML'],
      });
    });

    it('shows success toast and closes modal on successful export', async () => {
      const { UnnnicToastManager } = await import('@weni/unnnic-system');
      History.exportRoom.mockResolvedValue({});
      wrapper = createWrapper();

      const checkbox = wrapper.find(
        '[data-testid="export-conversation-accept-terms"] input',
      );
      await checkbox.trigger('change');

      const submitBtn = wrapper.find(
        '[data-testid="export-conversation-submit"]',
      );
      await submitBtn.trigger('click');

      await vi.waitFor(() => {
        expect(UnnnicToastManager.success).toHaveBeenCalledWith(
          i18n.global.t('export_conversation.success_title'),
          i18n.global.t('export_conversation.success_description'),
        );
      });

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      const emitted = wrapper.emitted('update:modelValue');
      expect(emitted[emitted.length - 1]).toEqual([false]);
    });

    it('shows error toast on failed export', async () => {
      const { UnnnicToastManager } = await import('@weni/unnnic-system');
      History.exportRoom.mockRejectedValue(new Error('Network error'));
      wrapper = createWrapper();

      const checkbox = wrapper.find(
        '[data-testid="export-conversation-accept-terms"] input',
      );
      await checkbox.trigger('change');

      const submitBtn = wrapper.find(
        '[data-testid="export-conversation-submit"]',
      );
      await submitBtn.trigger('click');

      await vi.waitFor(() => {
        expect(UnnnicToastManager.error).toHaveBeenCalledWith(
          i18n.global.t('export_conversation.error'),
        );
      });
    });

    it('resets state when modal is closed', async () => {
      wrapper = createWrapper();

      wrapper.vm.selectedFormat = 'HTML';
      wrapper.vm.acceptedTerms = true;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedFormat).toBe('HTML');
      expect(wrapper.vm.acceptedTerms).toBe(true);

      wrapper.vm.isOpen = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.selectedFormat).toBe('PDF');
      expect(wrapper.vm.acceptedTerms).toBe(false);
    });
  });
});
