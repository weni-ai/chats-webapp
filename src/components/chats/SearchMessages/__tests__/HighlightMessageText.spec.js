import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  afterEach,
  vi,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import HighlightMessageText from '../HighlightMessageText.vue';
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

describe('HighlightMessageText', () => {
  let wrapper;

  const mountComponent = (props = {}, options = {}) => {
    return mount(HighlightMessageText, {
      props: {
        text: 'Hello world',
        searchTerm: '',
        ...props,
      },
      global: {
        mocks: { $t: (key) => key },
        ...options.global,
      },
      ...options,
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('render', () => {
    it('renders paragraph with highlight-message-text class', () => {
      wrapper = mountComponent();
      expect(
        wrapper.find('[data-testid="highlight-message-text"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="highlight-message-text"]').element.tagName,
      ).toBe('P');
    });

    it('sets title attribute to text prop', () => {
      wrapper = mountComponent({ text: 'Some message content' });
      expect(
        wrapper
          .find('[data-testid="highlight-message-text"]')
          .attributes('title'),
      ).toBe('Some message content');
    });

    it('renders text when searchTerm is empty', () => {
      wrapper = mountComponent({ text: 'Plain text', searchTerm: '' });
      const el = wrapper.find('[data-testid="highlight-message-text"]');
      expect(el.text()).toBe('Plain text');
      expect(el.find('[data-testid="highlight"]').exists()).toBe(false);
    });
  });

  describe('highlighting', () => {
    it('wraps matching term in span.highlight (case insensitive)', () => {
      wrapper = mountComponent({ text: 'Hello world', searchTerm: 'hello' });
      const el = wrapper.find('[data-testid="highlight-message-text"]');
      const highlight = el.find('[data-testid="highlight"]');
      expect(highlight.exists()).toBe(true);
      expect(highlight.text()).toBe('Hello');
      expect(el.html()).toContain('data-testid="highlight"');
    });

    it('matches with normalized text (accents)', () => {
      wrapper = mountComponent({
        text: 'Informação importante',
        searchTerm: 'informacao',
      });
      const highlight = wrapper.find('[data-testid="highlight"]');
      expect(highlight.exists()).toBe(true);
      expect(highlight.text()).toBe('Informação');
    });

    it('highlights all non-overlapping matches', () => {
      wrapper = mountComponent({
        text: 'foo bar foo baz foo',
        searchTerm: 'foo',
      });
      const highlights = wrapper.findAll('[data-testid="highlight"]');
      expect(highlights).toHaveLength(3);
      highlights.forEach((h) => expect(h.text()).toBe('foo'));
    });

    it('returns escaped text when no match found', () => {
      wrapper = mountComponent({
        text: 'Hello world',
        searchTerm: 'xyz',
      });
      const el = wrapper.find('[data-testid="highlight-message-text"]');
      expect(el.find('[data-testid="highlight"]').exists()).toBe(false);
      expect(el.text()).toBe('Hello world');
    });
  });

  describe('HTML escaping', () => {
    it('escapes HTML in text to prevent XSS', () => {
      wrapper = mountComponent({
        text: '<script>alert(1)</script>',
        searchTerm: '',
      });
      const innerHtml = wrapper.find('[data-testid="highlight-message-text"]')
        .element.innerHTML;
      expect(innerHtml).not.toContain('<script>');
      expect(innerHtml).toContain('&lt;script&gt;');
      expect(
        wrapper.find('[data-testid="highlight-message-text"]').text(),
      ).toContain('alert');
    });

    it('escapes HTML so raw tags are not rendered', () => {
      wrapper = mountComponent({
        text: 'Say <b>hi</b> now',
        searchTerm: 'hi',
      });
      const innerHtml = wrapper.find('[data-testid="highlight-message-text"]')
        .element.innerHTML;
      expect(innerHtml).not.toContain('<b>');
      expect(innerHtml).toContain('&lt;');
      expect(innerHtml).toContain('&gt;');
    });
  });

  describe('edge cases', () => {
    it('handles empty text', () => {
      wrapper = mountComponent({ text: '', searchTerm: 'hello' });
      expect(
        wrapper.find('[data-testid="highlight-message-text"]').text(),
      ).toBe('');
      expect(wrapper.find('[data-testid="highlight"]').exists()).toBe(false);
    });

    it('handles empty searchTerm', () => {
      wrapper = mountComponent({ text: 'Some text', searchTerm: '' });
      expect(
        wrapper.find('[data-testid="highlight-message-text"]').text(),
      ).toBe('Some text');
      expect(wrapper.find('[data-testid="highlight"]').exists()).toBe(false);
    });

    it('searchTerm longer than text yields no highlight', () => {
      wrapper = mountComponent({
        text: 'hi',
        searchTerm: 'hello',
      });
      expect(wrapper.find('[data-testid="highlight"]').exists()).toBe(false);
      expect(
        wrapper.find('[data-testid="highlight-message-text"]').text(),
      ).toBe('hi');
    });
  });
});
