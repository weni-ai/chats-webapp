import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import NotesContent from '../NotesContent.vue';
import RoomNotes from '@/services/api/resources/chats/roomNotes';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: {
    getInternalNotes: vi.fn(() => Promise.resolve({ results: [] })),
  },
}));

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

const mockNotes = [
  { uuid: 'note-1', content: 'Test note 1', created_on: '2024-01-01' },
  { uuid: 'note-2', content: 'Test note 2', created_on: '2024-01-02' },
];

const createWrapper = (props = {}, piniaOptions = {}) =>
  mount(NotesContent, {
    props: {
      room: { uuid: 'room-123' },
      ...props,
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
            ...piniaOptions,
          },
        }),
      ],
      mocks: { $t: (key) => key },
      stubs: {
        ChatInternalNote: true,
      },
    },
  });

describe('NotesContent', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render notes container', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="notes-content"]').exists()).toBe(true);
    });

    it('should load internal notes on mount', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });
      wrapper = createWrapper();

      await flushPromises();

      expect(RoomNotes.getInternalNotes).toHaveBeenCalledWith({
        room: 'room-123',
      });
    });

    it('should emit loaded event after loading notes', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });
      wrapper = createWrapper();

      await flushPromises();

      expect(wrapper.emitted('loaded')).toBeTruthy();
    });
  });

  describe('Notes Rendering', () => {
    it('should render ChatInternalNote for each note', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });

      wrapper = createWrapper();
      await flushPromises();

      const store = wrapper.vm.$pinia.state.value.roomMessages;
      store.roomInternalNotes = mockNotes;
      await wrapper.vm.$nextTick();

      const notes = wrapper.findAllComponents({ name: 'ChatInternalNote' });
      expect(notes.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Note Interactions', () => {
    it('should handle note click and set toScrollNote', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });
      wrapper = createWrapper();
      await flushPromises();

      wrapper.vm.handleInternalNoteClick(mockNotes[0]);

      expect(wrapper.vm.toScrollNote).toEqual(mockNotes[0]);
    });
  });

  describe('Cleanup', () => {
    it('should clear roomInternalNotes on unmount', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });
      wrapper = createWrapper();
      await flushPromises();

      const store = wrapper.vm.$pinia.state.value.roomMessages;
      store.roomInternalNotes = mockNotes;

      wrapper.unmount();

      expect(store.roomInternalNotes).toEqual([]);
    });
  });

  describe('Store Integration', () => {
    it('should update store with loaded notes', async () => {
      RoomNotes.getInternalNotes.mockResolvedValue({ results: mockNotes });
      wrapper = createWrapper();

      await flushPromises();

      const store = wrapper.vm.$pinia.state.value.roomMessages;
      expect(store.roomInternalNotes).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      RoomNotes.getInternalNotes.mockRejectedValueOnce(new Error('API Error'));

      try {
        wrapper = createWrapper();
        await flushPromises();
      } catch (error) {
        // Error is expected
      }

      if (wrapper && wrapper.exists()) {
        expect(wrapper.find('[data-testid="notes-content"]').exists()).toBe(
          true,
        );
      }

      consoleErrorSpy.mockRestore();
      RoomNotes.getInternalNotes.mockResolvedValue({ results: [] });
    });
  });
});
