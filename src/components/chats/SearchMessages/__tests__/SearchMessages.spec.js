import {
  describe,
  it,
  expect,
  beforeEach,
  beforeAll,
  afterAll,
  vi,
  afterEach,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SearchMessages from '../index.vue';
import { useRoomMessages } from '@/store/modules/chats/roomMessages';
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
  vi.restoreAllMocks();
});

vi.mock('@vueuse/core', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    watchDebounced: vi.fn((source, cb) => {
      return actual.watchDebounced(source, cb, {
        debounce: 0,
        maxWait: 0,
      });
    }),
  };
});

const createMessage = (overrides = {}) => ({
  uuid: `msg-${Math.random().toString(36).slice(2)}`,
  text: 'Hello world',
  created_on: '2024-01-15T10:00:00Z',
  user: { email: 'agent@test.com', first_name: 'Agent' },
  media: [],
  ...overrides,
});

const UnnnicInputStub = {
  name: 'UnnnicInputStub',
  props: ['modelValue', 'placeholder', 'iconLeft'],
  emits: ['update:modelValue'],
  template: `
    <div class="unnnic-input-stub">
      <div>
        <input
          data-testid="search-messages-input"
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
        />
      </div>
    </div>
  `,
};

describe('SearchMessages', () => {
  let wrapper;
  let pinia;
  let roomMessagesStore;

  const mountComponent = (options = {}) => {
    return mount(SearchMessages, {
      global: {
        plugins: [pinia],
        mocks: {
          $t: (key, params) =>
            params ? `${key} ${JSON.stringify(params)}` : key,
        },
        stubs: {
          AsideSlotTemplate: {
            name: 'AsideSlotTemplateStub',
            props: ['close'],
            template: `
              <div class="aside-slot-template-stub" data-testid="search-messages-container">
                <slot name="header" />
                <slot />
              </div>
            `,
          },
          AsideSlotTemplateSection: {
            name: 'AsideSlotTemplateSectionStub',
            template: '<div class="aside-slot-section-stub"><slot /></div>',
          },
          UnnnicInput: UnnnicInputStub,
          UnnnicButton: {
            name: 'UnnnicButtonStub',
            template:
              '<button data-testid="close-button" @click="$emit(\'click\')"><slot /></button>',
          },
          UnnnicIcon: {
            name: 'UnnnicIconStub',
            template: '<span class="unnnic-icon-stub" />',
          },
          HighlightMessageCard: {
            name: 'HighlightMessageCardStub',
            props: ['message', 'searchTerm'],
            template:
              '<div class="highlight-message-card-stub" @click="$emit(\'click\', message)">{{ message.text }}</div>',
          },
          ...options.stubs,
        },
        ...options.global,
      },
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
    pinia = createPinia();
    setActivePinia(pinia);
    roomMessagesStore = useRoomMessages();
    roomMessagesStore.roomMessages = [
      createMessage({ uuid: '1', text: 'Hello world' }),
      createMessage({ uuid: '2', text: 'Good morning' }),
      createMessage({ uuid: '3', text: 'Welcome to the chat' }),
    ];
    roomMessagesStore.roomMessagesNext = null;
    roomMessagesStore.getAllRoomsMessages = vi.fn();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('render', () => {
    it('renders the component with search container', () => {
      wrapper = mountComponent();
      expect(
        wrapper.find('[data-testid="search-messages-container"]').exists(),
      ).toBe(true);
    });

    it('renders header with title and close button', () => {
      wrapper = mountComponent();
      expect(
        wrapper.find('[data-testid="search-messages-header"]').exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="close-button"]').exists()).toBe(true);
    });

    it('renders search input', () => {
      wrapper = mountComponent();
      expect(
        wrapper.find('[data-testid="search-messages-input"]').exists(),
      ).toBe(true);
    });

    it('does not show results label when search term is empty', () => {
      wrapper = mountComponent();
      expect(
        wrapper.find('[data-testid="search-messages-results-label"]').exists(),
      ).toBe(false);
    });

    it('shows results label when search term is filled', async () => {
      wrapper = mountComponent();
      const input = wrapper.find('[data-testid="search-messages-input"]');
      await input.setValue('hello');
      expect(
        wrapper.find('[data-testid="search-messages-results-label"]').exists(),
      ).toBe(true);
    });

    it('shows no results message when no messages match', async () => {
      wrapper = mountComponent();
      await wrapper
        .find('[data-testid="search-messages-input"]')
        .setValue('xyznone');
      const resultsContainer = wrapper.find(
        '[data-testid="search-messages-results-label"]',
      );
      expect(resultsContainer.text()).toContain('no_results');
    });

    it('shows results count when messages match', async () => {
      wrapper = mountComponent();
      await wrapper
        .find('[data-testid="search-messages-input"]')
        .setValue('hello');
      const resultsContainer = wrapper.find(
        '[data-testid="search-messages-results-label"]',
      );
      expect(resultsContainer.text()).toContain('results_found');
    });
  });

  describe('search and matched messages', () => {
    it('filters messages by search term (case insensitive)', async () => {
      wrapper = mountComponent();
      await wrapper
        .find('[data-testid="search-messages-input"]')
        .setValue('HELLO');
      const cards = wrapper.findAllComponents({
        name: 'HighlightMessageCardStub',
      });
      expect(cards).toHaveLength(1);
      expect(cards[0].props('message').text).toBe('Hello world');
    });

    it('filters messages with normalized text (accents)', async () => {
      roomMessagesStore.roomMessages = [
        createMessage({ uuid: '1', text: 'Informação importante' }),
      ];
      wrapper = mountComponent();
      await wrapper
        .find('[data-testid="search-messages-input"]')
        .setValue('informacao');
      const cards = wrapper.findAllComponents({
        name: 'HighlightMessageCardStub',
      });
      expect(cards).toHaveLength(1);
    });

    it('excludes messages with valid JSON text', async () => {
      roomMessagesStore.roomMessages = [
        createMessage({ uuid: '1', text: '{"type":"card"}' }),
        createMessage({ uuid: '2', text: 'Plain text message' }),
      ];
      wrapper = mountComponent();
      await wrapper
        .find('[data-testid="search-messages-input"]')
        .setValue('text');
      const cards = wrapper.findAllComponents({
        name: 'HighlightMessageCardStub',
      });
      expect(cards).toHaveLength(1);
      expect(cards[0].props('message').text).toBe('Plain text message');
    });

    it('renders HighlightMessageCard for each matched message', async () => {
      wrapper = mountComponent();
      await wrapper.find('[data-testid="search-messages-input"]').setValue('o');
      const cards = wrapper.findAllComponents({
        name: 'HighlightMessageCardStub',
      });
      cards.forEach((card) => {
        expect(card.props('searchTerm')).toBe('o');
      });
    });
  });

  describe('store interaction', () => {
    it('sets toScrollMessage when a message card is clicked', async () => {
      wrapper = mountComponent();
      await wrapper
        .find('[data-testid="search-messages-input"]')
        .setValue('hello');
      const card = wrapper.findComponent({ name: 'HighlightMessageCardStub' });
      await card.trigger('click');
      expect(roomMessagesStore.toScrollMessage).toEqual(
        expect.objectContaining({ text: 'Hello world', uuid: '1' }),
      );
    });

    it('calls getAllRoomsMessages when search term changes (debounced)', async () => {
      roomMessagesStore.roomMessagesNext = 'next-page-url';
      wrapper = mountComponent();
      await wrapper
        .find('[data-testid="search-messages-input"]')
        .setValue('test');
      expect(roomMessagesStore.getAllRoomsMessages).toHaveBeenCalled();
    });
  });

  describe('close', () => {
    it('emits close when close button is clicked', async () => {
      wrapper = mountComponent();
      await wrapper.find('[data-testid="close-button"]').trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
      expect(wrapper.emitted('close').length).toBeGreaterThanOrEqual(1);
    });
  });
});
