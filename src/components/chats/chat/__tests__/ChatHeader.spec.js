import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach } from 'vitest';

import ChatHeader from '../ChatHeader.vue';
import i18n from '@/plugins/i18n';
import UnnnicSystem from '@/plugins/UnnnicSystem';

const room = {
  contact: {
    name: 'John Doe',
    photo_url: 'https://example.com/photo.jpg',
  },
  user: true,
  is_active: true,
  queue: {
    name: 'Support Queue',
  },
  ended_at: null,
  created_on: new Date(),
};

const createWrapper = () => {
  return mount(ChatHeader, {
    global: {
      plugins: [i18n, UnnnicSystem],
      mocks: {
        $t: (msg) => msg,
      },
    },
    props: {
      closeButtonTooltip: 'Close Chat',
      room,
      usePhoto: true,
      alert: false,
      alertNetwork: false,
    },
  });
};

describe('ChatHeader.vue', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = createWrapper();
  });

  it('renders the contact name correctly', () => {
    const username = wrapper.find('[data-testid="contact-username"]');
    expect(username.text()).toBe(room.contact.name);
  });

  it('emits "show-contact-info" when the contact info is clicked', async () => {
    const username = wrapper.find('[data-testid="contact-username"]');
    await username.trigger('click');
    expect(wrapper.emitted('show-contact-info')).toBeTruthy();
  });

  it('should emit "show-contact-info" when username is clicked or "Enter" key is pressed', async () => {
    const username = wrapper.find('[data-testid="contact-username"]');

    await username.trigger('keypress.enter');
    expect(wrapper.emitted('show-contact-info')).toBeTruthy();
  });

  it('renders the photo when "usePhoto" is true', () => {
    const avatar = wrapper.findComponent({ name: 'UserAvatar' });
    expect(avatar.props('photoUrl')).toBe(room.contact.photo_url);
  });

  it('does not render the photo when "usePhoto" is false', async () => {
    await wrapper.setProps({ usePhoto: false });
    const avatar = wrapper.findComponent({ name: 'UserAvatar' });
    expect(avatar.props('photoUrl')).toBe('');
  });

  it('emits "close" when the close button is clicked', async () => {
    const closeButton = wrapper.find('[data-testid="close"]');
    await closeButton.trigger('click');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('should emit "close" when close button is clicked or "Enter" key is pressed', async () => {
    const closeButton = wrapper.find('[data-testid="close"]');

    await closeButton.trigger('keypress.enter');
    expect(wrapper.emitted('close')).toBeTruthy();
  });

  it('renders the alert network message when "alertNetwork" is true', async () => {
    await wrapper.setProps({ alertNetwork: true });
    expect(
      wrapper.find('[data-testid="no-internet-connection"]').exists(),
    ).toBe(true);
  });

  it('emits "reconnect" when the alert network message is clicked', async () => {
    await wrapper.setProps({ alertNetwork: true });
    const alertText = wrapper.find('[data-testid="reconnect"]');
    await alertText.trigger('click');
    expect(wrapper.emitted('reconnect')).toBeTruthy();
  });

  it('renders the alert message when "alert" is true', async () => {
    await wrapper.setProps({ alert: true });
    expect(wrapper.find('[data-testid="header-info-message"]').exists()).toBe(
      true,
    );
  });

  it('emits "open-send-flow" when the alert message is clicked', async () => {
    await wrapper.setProps({ alert: true });
    const alertText = wrapper.find('[data-testid="alert-text"]');
    await alertText.trigger('click');
    expect(wrapper.emitted('open-send-flow')).toBeTruthy();
  });

  it('shows contact in queue message when "room.user" is false', async () => {
    await wrapper.setProps({
      room: { ...room, user: false, is_active: true },
    });
    const infoMessage = wrapper.find('.header-info-message .message');
    expect(infoMessage.exists()).toBe(true);
    expect(infoMessage.text()).toContain(wrapper.vm.$t('contact_in_queue'));
  });
});
