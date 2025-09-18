import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { mount, config } from '@vue/test-utils';
import ViewButton from '@/layouts/ChatsLayout/components/ViewOptions/ViewButton.vue';
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

describe('ViewButton', () => {
  let wrapper;

  const createWrapper = (props) => {
    return mount(ViewButton, {
      props,
      global: {
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          UnnnicButton: {
            template: '<button><slot /></button>',
          },
          UnnnicIcon: {
            template: '<span data-testid="icon" :data-icon="icon"></span>',
            props: ['icon'],
          },
        },
      },
    });
  };

  describe('Props', () => {
    it('should receive expandedMore as true', () => {
      wrapper = createWrapper({ expandedMore: true });
      expect(wrapper.props('expandedMore')).toBe(true);
    });

    it('should receive expandedMore as false', () => {
      wrapper = createWrapper({ expandedMore: false });
      expect(wrapper.props('expandedMore')).toBe(false);
    });
  });

  describe('Rendering Content', () => {
    it('should display translated text inside the button', () => {
      wrapper = createWrapper({ expandedMore: true });
      expect(wrapper.find('[data-testid="header-text"]').text()).toBe(
        'view-option',
      );
    });

    it('should display correct icon when expandedMore is true', () => {
      wrapper = createWrapper({ expandedMore: true });
      const icon = wrapper.find('[data-testid="header-icon-expand"]');
      expect(icon.attributes('data-icon')).toBe('expand_more');
    });

    it('should display correct icon when expandedMore is false', () => {
      wrapper = createWrapper({ expandedMore: false });
      const icon = wrapper.find('[data-testid="header-icon-expand"]');
      expect(icon.attributes('data-icon')).toBe('expand_less');
    });
  });

  describe('Events', () => {
    it('should call handleClick when button is clicked', async () => {
      const handleClick = vi.fn();
      wrapper = createWrapper({ expandedMore: true, handleClick });
      await wrapper.find('button').trigger('click');
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      wrapper = createWrapper({ expandedMore: true });
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
