import { beforeAll, afterAll, describe, expect, it, afterEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import HeaderQuickMessages from '@/components/chats/QuickMessages/HeaderQuickMessages.vue';
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

describe('HeaderQuickMessages', () => {
  let wrapper;

  const createWrapper = (options = {}) => {
    return mount(HeaderQuickMessages, {
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          UnnnicChatsHeader: true,
        },
      },
      ...options,
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render the header component', () => {
      wrapper = createWrapper();
      expect(
        wrapper.find('[data-testid="header-quick-messages"]').exists(),
      ).toBe(true);
    });

    it('should pass correct title prop', () => {
      wrapper = createWrapper();
      const header = wrapper.findComponent({ name: 'UnnnicChatsHeader' });
      expect(header.props('title')).toBe('quick_messages.title');
    });

    it('should pass correct avatarIcon prop', () => {
      wrapper = createWrapper();
      const header = wrapper.findComponent({ name: 'UnnnicChatsHeader' });
      expect(header.props('avatarIcon')).toBe('bolt');
    });
  });

  describe('Events', () => {
    it('should emit close event when close prop is called', async () => {
      wrapper = createWrapper();
      const header = wrapper.findComponent({ name: 'UnnnicChatsHeader' });

      await header.props('close')();

      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close')).toHaveLength(1);
    });
  });
});
