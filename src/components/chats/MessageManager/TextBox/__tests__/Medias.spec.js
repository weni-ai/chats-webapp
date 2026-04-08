import { config, mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import { createTestingPinia } from '@pinia/testing';
import { setActivePinia } from 'pinia';

import i18n from '@/plugins/i18n';
import MessageManagerTextBoxMedias from '../Medias.vue';
import { useMessageManager } from '@/store/modules/chats/messageManager';

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

describe('MessageManagerTextBoxMedias.vue', () => {
  let pinia;

  beforeEach(() => {
    pinia = createTestingPinia({ stubActions: false });
    setActivePinia(pinia);
  });

  const createWrapper = () =>
    mount(MessageManagerTextBoxMedias, {
      global: {
        plugins: [pinia],
        mocks: { $t: (key) => key },
        stubs: {
          UnnnicIcon: {
            props: ['icon', 'clickable', 'scheme', 'size'],
            inheritAttrs: false,
            template:
              '<span class="unnnic-icon-stub" v-bind="$attrs" :data-icon="icon" @click="$emit(\'click\')" />',
          },
        },
      },
    });

  it('renders the list and one row per file', () => {
    const messageManagerStore = useMessageManager();
    messageManagerStore.mediaUploadFiles = [
      new File(['a'], 'a.png', { type: 'image/png' }),
      new File(['b'], 'b.jpg', { type: 'image/jpeg' }),
    ];

    const wrapper = createWrapper();

    expect(wrapper.find('[data-testid="medias-list"]').exists()).toBe(true);
    const items = wrapper.findAll('[data-testid="media-upload-item"]');
    expect(items).toHaveLength(2);
    expect(items[0].text()).toContain('a.png');
    expect(items[1].text()).toContain('b.jpg');
  });

  it('removes only the file when its remove control is used', async () => {
    const messageManagerStore = useMessageManager();
    const f1 = new File(['a'], 'keep.png', { type: 'image/png' });
    const f2 = new File(['b'], 'drop.png', { type: 'image/png' });
    messageManagerStore.mediaUploadFiles = [f1, f2];

    const wrapper = createWrapper();
    const rows = wrapper.findAll('[data-testid="media-upload-item"]');
    const removeOnSecondRow = rows[1].find(
      '[data-testid="media-upload-item-remove"]',
    );

    expect(removeOnSecondRow.exists()).toBe(true);
    await removeOnSecondRow.trigger('click');

    expect(messageManagerStore.mediaUploadFiles).toHaveLength(1);
    expect(messageManagerStore.mediaUploadFiles[0].name).toBe('keep.png');
  });
});
