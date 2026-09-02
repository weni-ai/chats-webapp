import { describe, it, expect, afterEach, beforeAll, afterAll } from 'vitest';
import { mount, config } from '@vue/test-utils';
import AboutContactCard from '../AboutContactCard.vue';
import i18n from '@/plugins/i18n';

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n,
  );
});

afterAll(() => {
  if (config.global.plugins && !config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const createWrapper = (props = {}) =>
  mount(AboutContactCard, {
    props: {
      contactName: 'Aline',
      contactNumber: '+5565469488148',
      lastMessageText: 'Last message 10 days ago',
      ...props,
    },
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicSwitch: true,
        UnnnicToolTip: true,
        UnnnicIcon: true,
        UnnnicIconSvg: true,
        CopyValueButton: true,
        CustomField: true,
      },
    },
  });

describe('AboutContactCard', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders contact name, number and last message', () => {
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="about-contact-card"]').exists()).toBe(
      true,
    );
    expect(wrapper.text()).toContain('Aline');
    expect(wrapper.text()).toContain('+5565469488148');
    expect(wrapper.text()).toContain('Last message 10 days ago');
  });

  it('shows link switch when enabled', () => {
    wrapper = createWrapper({ showLinkSwitch: true });

    expect(wrapper.findComponent({ name: 'UnnnicSwitch' }).exists()).toBe(true);
  });

  it('emits open custom fields toggle', async () => {
    wrapper = createWrapper({
      customFields: { city: 'São Paulo' },
      openCustomFields: true,
    });

    const icon = wrapper.findComponent({ name: 'UnnnicIcon' });
    await icon.vm.$emit('click');

    expect(wrapper.emitted('update:openCustomFields')).toBeTruthy();
    expect(wrapper.emitted('update:openCustomFields')[0]).toEqual([false]);
  });
});
