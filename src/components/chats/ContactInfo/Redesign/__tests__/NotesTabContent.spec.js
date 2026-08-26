import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import NotesTabContent from '../NotesTabContent.vue';
import RoomNotes from '@/services/api/resources/chats/roomNotes';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: {
    getInternalNotes: vi.fn(() => Promise.resolve({ results: [] })),
  },
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

const mockNotes = [
  {
    uuid: 'note-1',
    text: 'Note 1',
    user: { name: 'Agent', email: 'a@weni.ai' },
  },
];

const createWrapper = () =>
  mount(NotesTabContent, {
    props: {
      room: { uuid: 'room-123' },
    },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            roomMessages: {
              toScrollNote: null,
              roomInternalNotes: [],
            },
          },
        }),
      ],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        NoteCard: true,
      },
    },
  });

describe('NotesTabContent', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('loads internal notes and emits loaded', async () => {
    RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });
    wrapper = createWrapper();

    await flushPromises();

    expect(RoomNotes.getInternalNotes).toHaveBeenCalledWith({
      room: 'room-123',
    });
    expect(wrapper.emitted('loaded')).toBeTruthy();
  });

  it('renders note cards from store', async () => {
    RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });
    wrapper = createWrapper();
    await flushPromises();

    const store = wrapper.vm.$pinia.state.value.roomMessages;
    store.roomInternalNotes = mockNotes;
    await wrapper.vm.$nextTick();

    expect(wrapper.findAllComponents({ name: 'NoteCard' }).length).toBe(1);
  });
});
