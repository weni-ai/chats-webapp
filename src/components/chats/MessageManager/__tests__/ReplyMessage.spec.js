import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import UnnnicSystem from '@/plugins/UnnnicSystem';

import { createI18n } from 'vue-i18n';
import en from '@/locales/en.json';

const i18n = createI18n({
  legacy: false,
  locale: 'en',
  messages: { en },
  fallbackWarn: false,
  missingWarn: false,
});

config.global.plugins = [i18n, UnnnicSystem];

import ReplyMessage from '../ReplyMessage.vue';

const messageTextMock = {
  uuid: '1',
  user: null,
  room: '1',
  contact: { name: 'Contact' },
  text: 'text message',
  media: [],
  content_type: 'text',
};

describe('ReplyMessage', () => {
  let wrapper;

  beforeEach(() => {
    wrapper = mount(ReplyMessage, { props: { replyMessage: messageTextMock } });
  });

  it('renders text content correctly', () => {
    console.log(wrapper.html());
    expect(wrapper.find('.reply-message__content-text').text()).toBe(
      'text message',
    );
  });
});
