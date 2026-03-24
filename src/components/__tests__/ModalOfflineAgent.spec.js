import {
  beforeAll,
  afterAll,
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import ModalOfflineAgent from '@/components/ModalOfflineAgent.vue';
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

describe('ModalOfflineAgent', () => {
  let wrapper;

  const createWrapper = (props = {}) => {
    return mount(ModalOfflineAgent, {
      props: {
        modelValue: false,
        username: 'John Doe',
        ...props,
      },
      global: {
        mocks: {
          $t: (key, params) => {
            if (key === 'offline_agent_modal.title') {
              return 'Agent Offline';
            }
            if (key === 'offline_agent_modal.description') {
              const username =
                params?.username !== undefined ? params.username : 'John Doe';
              return `Your status has been changed to offline by ${username}. To return to support, change your status to online.`;
            }
            return key;
          },
        },
      },
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render the component', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should not show modal when modelValue is false', () => {
      wrapper = createWrapper({ modelValue: false });
      expect(wrapper.find('[data-testid="modal-dialog"]').exists()).toBe(false);
    });

    it('should show modal when modelValue is true', () => {
      wrapper = createWrapper({ modelValue: true });
      expect(wrapper.getComponent({ name: 'UnnnicDialog' }).isVisible()).toBe(
        true,
      );
    });
  });

  describe('Props and Content', () => {
    it('should display correct title', () => {
      wrapper = createWrapper({ modelValue: true });
      expect(wrapper.find('[data-testid="modal-title"]').text()).toBe(
        'Agent Offline',
      );
    });

    it('should display description with default username', () => {
      wrapper = createWrapper({ modelValue: true });
      const description = wrapper.find('[data-testid="modal-description"]');
      expect(description.text()).toBe(
        'Your status has been changed to offline by John Doe. To return to support, change your status to online.',
      );
    });

    it('should display description with custom username', () => {
      wrapper = createWrapper({
        modelValue: true,
        username: 'Jane Smith',
      });
      const description = wrapper.find('[data-testid="modal-description"]');
      expect(description.text()).toBe(
        'Your status has been changed to offline by Jane Smith. To return to support, change your status to online.',
      );
    });

    it('should render modal content section', () => {
      wrapper = createWrapper({ modelValue: true });
      expect(wrapper.find('[data-testid="modal-content"]').exists()).toBe(true);
    });
  });

  describe('Modal Interactions', () => {
    it('should emit update:modelValue when close is triggered', async () => {
      wrapper = createWrapper({ modelValue: true });

      await wrapper.find('.unnnic-dialog-close').trigger('click');

      expect(wrapper.emitted('update:modelValue')).toBeTruthy();
      expect(wrapper.emitted('update:modelValue')[0]).toEqual([false]);
    });
  });

  describe('Component Structure', () => {
    it('should have correct CSS classes', () => {
      wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('.modal-offline-agent__content').exists()).toBe(true);
      expect(
        wrapper.find('.modal-offline-agent__content__description').exists(),
      ).toBe(true);
    });

    it('should have correct data-testids', () => {
      wrapper = createWrapper({ modelValue: true });

      expect(wrapper.find('[data-testid="modal-content"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="modal-title"]').exists()).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty username gracefully', () => {
      wrapper = createWrapper({
        modelValue: true,
        username: '',
      });
      const description = wrapper.find('[data-testid="modal-description"]');
      expect(description.text()).toBe(
        'Your status has been changed to offline by . To return to support, change your status to online.',
      );
    });

    it('should handle undefined username', () => {
      wrapper = createWrapper({
        modelValue: true,
        username: undefined,
      });
      const description = wrapper.find('[data-testid="modal-description"]');
      expect(description.text()).toBe(
        'Your status has been changed to offline by -. To return to support, change your status to online.',
      );
    });
  });
});
