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
import HighlightMessageCard from '../HighlightMessageCard.vue';
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

const createMessage = (overrides = {}) => ({
  uuid: 'msg-1',
  text: 'Hello world',
  created_on: '2024-01-15T10:30:00Z',
  user: { email: 'agent@test.com', first_name: 'John', last_name: 'Doe' },
  media: [],
  ...overrides,
});

describe('HighlightMessageCard', () => {
  let wrapper;

  const defaultProps = {
    message: createMessage(),
    searchTerm: 'hello',
  };

  const mountComponent = (props = {}, options = {}) => {
    return mount(HighlightMessageCard, {
      props: { ...defaultProps, ...props },
      global: {
        mocks: { $t: (key) => key },
        stubs: {
          HighlightMessageText: {
            name: 'HighlightMessageTextStub',
            props: ['text', 'searchTerm'],
            template:
              '<span class="highlight-message-text-stub">{{ text }}</span>',
          },
        },
        ...options.global,
      },
      ...options,
    });
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('render', () => {
    it('renders the message card section', () => {
      wrapper = mountComponent();
      expect(wrapper.find('[data-testid="message-card"]').exists()).toBe(true);
    });

    it('renders header with sender name and time', () => {
      wrapper = mountComponent();
      expect(wrapper.find('[data-testid="message-card-header"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="message-card-sender"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="message-card-time"]').exists()).toBe(
        true,
      );
    });

    it('renders content section with HighlightMessageText', () => {
      wrapper = mountComponent();
      expect(
        wrapper.find('[data-testid="message-card-content"]').exists(),
      ).toBe(true);
      const highlightText = wrapper.findComponent({
        name: 'HighlightMessageTextStub',
      });
      expect(highlightText.exists()).toBe(true);
    });

    it('passes message text and searchTerm to HighlightMessageText', () => {
      wrapper = mountComponent({
        message: createMessage({ text: 'Find this term' }),
        searchTerm: 'term',
      });
      const highlightText = wrapper.findComponent({
        name: 'HighlightMessageTextStub',
      });
      expect(highlightText.props('text')).toBe('Find this term');
      expect(highlightText.props('searchTerm')).toBe('term');
    });
  });

  describe('sender name', () => {
    it('shows user first_name and last_name when no name property', () => {
      wrapper = mountComponent({
        message: createMessage({
          user: { first_name: 'Jane', last_name: 'Smith' },
        }),
      });
      expect(wrapper.find('[data-testid="message-card-sender"]').text()).toBe(
        'Jane Smith',
      );
    });

    it('shows only first_name when last_name is missing', () => {
      wrapper = mountComponent({
        message: createMessage({
          user: { first_name: 'Agent', last_name: '' },
        }),
      });
      expect(wrapper.find('.message-card__header-sender').text()).toBe('Agent');
    });

    it('uses sender.name when present (user)', () => {
      wrapper = mountComponent({
        message: createMessage({
          user: {
            name: 'Support Bot',
            first_name: 'Bot',
            last_name: 'Support',
          },
        }),
      });
      expect(wrapper.find('[data-testid="message-card-sender"]').text()).toBe(
        'Support Bot',
      );
    });

    it('uses contact when message has contact instead of user', () => {
      wrapper = mountComponent({
        message: createMessage({
          user: undefined,
          contact: { name: 'Maria Silva' },
        }),
      });
      expect(wrapper.find('[data-testid="message-card-sender"]').text()).toBe(
        'Maria Silva',
      );
    });

    it('uses contact.name when present', () => {
      wrapper = mountComponent({
        message: createMessage({
          user: undefined,
          contact: { name: 'Customer Name', first_name: 'Customer' },
        }),
      });
      expect(wrapper.find('[data-testid="message-card-sender"]').text()).toBe(
        'Customer Name',
      );
    });

    it('shows automated_support translation when no sender', () => {
      const tSpy = vi
        .spyOn(i18n.global, 't')
        .mockReturnValue('chats.search_messages.automated_support');
      wrapper = mountComponent({
        message: createMessage({
          user: undefined,
          contact: undefined,
        }),
      });
      expect(tSpy).toHaveBeenCalledWith(
        'chats.search_messages.automated_support',
      );
      expect(wrapper.find('[data-testid="message-card-sender"]').text()).toBe(
        'chats.search_messages.automated_support',
      );
      tSpy.mockRestore();
    });
  });

  describe('formatted time', () => {
    it('formats created_on with moment (L, HH:mm)', () => {
      wrapper = mountComponent({
        message: createMessage({ created_on: '2024-06-20T14:45:00Z' }),
      });
      const timeEl = wrapper.find('[data-testid="message-card-time"]');
      expect(timeEl.text()).toMatch(/\d{1,2}\/\d{1,2}\/\d{2,4}, \d{2}:\d{2}/);
    });

    it('shows empty string when created_on is missing', () => {
      wrapper = mountComponent({
        message: createMessage({ created_on: undefined }),
      });
      expect(wrapper.find('[data-testid="message-card-time"]').text()).toBe('');
    });
  });

  describe('accessibility / interaction', () => {
    it('has message-card root so parent can listen to native click', () => {
      wrapper = mountComponent();
      const card = wrapper.find('[data-testid="message-card"]');
      expect(card.exists()).toBe(true);
      expect(card.element.tagName).toBe('SECTION');
    });
  });
});
