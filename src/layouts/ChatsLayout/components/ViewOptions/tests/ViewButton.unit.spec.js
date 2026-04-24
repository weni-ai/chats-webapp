import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

  const createWrapper = (props) =>
    mount(ViewButton, {
      props,
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          UnnnicButton: {
            name: 'UnnnicButton',
            template:
              '<button v-bind="$attrs" :data-icon-right="iconRight" :data-icon-left="iconLeft" :data-type="type" data-testid="header-btn" @click="$emit(\'click\', $event)"><slot /></button>',
            props: ['text', 'iconLeft', 'iconRight', 'type', 'size'],
            emits: ['click'],
          },
          UnnnicTag: {
            name: 'UnnnicTag',
            template: '<span data-testid="tag" :data-text="text"></span>',
            props: ['type', 'text'],
          },
        },
      },
    });

  describe('Props', () => {
    it.each([true, false])('should receive expandedMore=%s', (value) => {
      wrapper = createWrapper({ expandedMore: value });
      expect(wrapper.props('expandedMore')).toBe(value);
    });

    it('should default expandedMore and showNewBadge to false', () => {
      wrapper = createWrapper({});
      expect(wrapper.props('expandedMore')).toBe(false);
      expect(wrapper.props('showNewBadge')).toBe(false);
    });
  });

  describe('Rendering Content', () => {
    it('should display translated text inside the button', () => {
      wrapper = createWrapper({ expandedMore: true });
      expect(wrapper.find('[data-testid="header-text"]').text()).toBe(
        'view-option',
      );
    });

    it.each([
      { expandedMore: true, expectedIcon: 'expand_more' },
      { expandedMore: false, expectedIcon: 'expand_less' },
    ])(
      'should pass iconRight=$expectedIcon when expandedMore is $expandedMore',
      ({ expandedMore, expectedIcon }) => {
        wrapper = createWrapper({ expandedMore });
        const button = wrapper.find('[data-testid="header-btn"]');
        expect(button.attributes('data-icon-right')).toBe(expectedIcon);
      },
    );

    it('should not render the new badge by default', () => {
      wrapper = createWrapper({});
      expect(wrapper.find('[data-testid="header-new-badge"]').exists()).toBe(
        false,
      );
    });

    it('should render the new badge when showNewBadge is true', () => {
      wrapper = createWrapper({ showNewBadge: true });
      expect(wrapper.find('[data-testid="header-new-badge"]').exists()).toBe(
        true,
      );
    });
  });

  describe('Events', () => {
    it('should emit click when the button is clicked', async () => {
      wrapper = createWrapper({});
      await wrapper.find('[data-testid="header-btn"]').trigger('click');
      expect(wrapper.emitted('click')).toBeTruthy();
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', () => {
      wrapper = createWrapper({ expandedMore: true, showNewBadge: true });
      expect(wrapper.element).toMatchSnapshot();
    });
  });
});
