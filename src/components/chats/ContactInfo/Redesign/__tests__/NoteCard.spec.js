import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import NoteCard from '../NoteCard.vue';
import i18n from '@/plugins/i18n';

vi.mock('@/utils/string', () => ({
  formatMessageText: (text) => text,
}));

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

const mockNote = {
  uuid: 'note-1',
  text: 'Internal note: Problem solved',
  is_deletable: true,
  user: {
    name: 'Representative name',
    email: 'agent@weni.ai',
  },
};

const createWrapper = (props = {}, piniaState = {}) =>
  mount(NoteCard, {
    props: {
      message: mockNote,
      ...props,
    },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            profile: {
              me: { email: 'agent@weni.ai' },
            },
            rooms: {
              activeRoom: { ended_at: null },
            },
            ...piniaState,
          },
        }),
      ],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: {
          name: 'UnnnicIcon',
          template:
            '<button class="unnnic-icon" :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')" />',
          props: ['icon', 'size', 'scheme', 'clickable'],
          emits: ['click'],
        },
        ModalDeleteInternalNote: true,
      },
    },
  });

describe('NoteCard', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders agent name and note text', () => {
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="note-card"]').exists()).toBe(true);
    expect(wrapper.text()).toContain('Representative name');
    expect(wrapper.text()).toContain('Internal note: Problem solved');
  });

  it('emits click-note when content is clicked', async () => {
    wrapper = createWrapper();

    await wrapper.find('.note-card__content').trigger('click');

    expect(wrapper.emitted('click-note')).toBeTruthy();
  });

  it('shows delete icon when the note is deletable by current user', () => {
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="note-card-delete"]').exists()).toBe(
      true,
    );
  });
});
