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
          UnnnicIcon: {
            name: 'UnnnicIcon',
            template:
              '<i v-bind="$attrs" :data-icon="icon" :data-scheme="scheme" :data-size="size" data-testid="header-chevron"></i>',
            props: ['icon', 'scheme', 'size'],
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
      { expandedMore: true, expectedIcon: 'keyboard_arrow_up' },
      { expandedMore: false, expectedIcon: 'keyboard_arrow_down' },
    ])(
      'should render chevron icon=$expectedIcon when expandedMore is $expandedMore',
      ({ expandedMore, expectedIcon }) => {
        wrapper = createWrapper({ expandedMore });
        const chevron = wrapper.find('[data-testid="header-chevron"]');
        expect(chevron.attributes('data-icon')).toBe(expectedIcon);
      },
    );

    it.each([
      { expandedMore: true, expected: 'true' },
      { expandedMore: false, expected: 'false' },
    ])(
      'should reflect expandedMore via aria-expanded=$expected',
      ({ expandedMore, expected }) => {
        wrapper = createWrapper({ expandedMore });
        const trigger = wrapper.find('[data-testid="header-btn"]');
        expect(trigger.attributes('aria-expanded')).toBe(expected);
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
