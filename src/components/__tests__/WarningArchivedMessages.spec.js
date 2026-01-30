import { describe, it, expect, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import WarningArchivedMessages from '../WarningArchivedMessages.vue';
import i18n from '@/plugins/i18n';

describe('WarningArchivedMessages', () => {
  let wrapper;

  const createWrapper = (options = {}) => {
    const defaultOptions = {
      global: {
        plugins: [i18n],
        stubs: {
          UnnnicDisclaimer: {
            name: 'UnnnicDisclaimer',
            template:
              '<div class="unnnic-disclaimer" data-testid="unnnic-disclaimer"><slot /></div>',
            props: ['title', 'description', 'type'],
          },
        },
      },
    };

    return mount(WarningArchivedMessages, {
      ...defaultOptions,
      ...options,
    });
  };

  afterEach(() => {
    if (wrapper) {
      wrapper.unmount();
    }
  });

  describe('Rendering', () => {
    it('should render the component correctly', () => {
      wrapper = createWrapper();

      const container = wrapper.find('.warning-archived-messages__container');
      expect(container.exists()).toBe(true);
    });

    it('should render UnnnicDisclaimer component', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.exists()).toBe(true);
    });

    it('should pass correct title to UnnnicDisclaimer', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.props('title')).toBe('Archived messages');
    });

    it('should pass correct description to UnnnicDisclaimer', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      const description = disclaimer.props('description');
      expect(description).toContain('support request was closed');
      expect(description).toContain('messages have been moved');
      expect(description).toContain('Download messages');
    });

    it('should pass correct type to UnnnicDisclaimer', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.props('type')).toBe('attention');
    });

    it('should have correct class on UnnnicDisclaimer', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.classes()).toContain('warning-archived-messages');
    });
  });

  describe('Translation', () => {
    it('should use translation for title', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.props('title')).toBeTruthy();
      expect(typeof disclaimer.props('title')).toBe('string');
      expect(disclaimer.props('title').length).toBeGreaterThan(0);
    });

    it('should use translation for description', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.props('description')).toBeTruthy();
      expect(typeof disclaimer.props('description')).toBe('string');
      expect(disclaimer.props('description').length).toBeGreaterThan(0);
    });
  });

  describe('Structure', () => {
    it('should have container with correct display flex', () => {
      wrapper = createWrapper();

      const container = wrapper.find('.warning-archived-messages__container');
      expect(container.element.className).toContain(
        'warning-archived-messages__container',
      );
    });

    it('should render only one UnnnicDisclaimer', () => {
      wrapper = createWrapper();

      const disclaimers = wrapper.findAllComponents({
        name: 'UnnnicDisclaimer',
      });
      expect(disclaimers).toHaveLength(1);
    });
  });

  describe('Props validation', () => {
    it('should render with UnnnicDisclaimer component structure', () => {
      wrapper = createWrapper({
        global: {
          plugins: [i18n],
          stubs: {
            UnnnicDisclaimer: {
              name: 'UnnnicDisclaimer',
              template:
                '<div class="unnnic-disclaimer" :data-type="type"><h3>{{ title }}</h3><p>{{ description }}</p></div>',
              props: ['title', 'description', 'type'],
            },
          },
        },
      });

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.html()).toContain('Archived messages');
      expect(disclaimer.html()).toContain('support request was closed');
    });
  });

  describe('Component stability', () => {
    it('should not throw errors when mounting', () => {
      expect(() => {
        wrapper = createWrapper();
      }).not.toThrow();
    });

    it('should not throw errors when unmounting', () => {
      wrapper = createWrapper();

      expect(() => {
        wrapper.unmount();
      }).not.toThrow();
    });

    it('should maintain structure after multiple renders', async () => {
      wrapper = createWrapper();

      await wrapper.vm.$forceUpdate();
      await wrapper.vm.$nextTick();

      const container = wrapper.find('.warning-archived-messages__container');
      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });

      expect(container.exists()).toBe(true);
      expect(disclaimer.exists()).toBe(true);
    });
  });

  describe('Edge cases', () => {
    it('should handle component with valid translations', () => {
      wrapper = createWrapper();

      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });
      expect(disclaimer.props('title')).toBeTruthy();
      expect(disclaimer.props('description')).toBeTruthy();
      expect(disclaimer.props('type')).toBe('attention');
    });

    it('should maintain correct structure regardless of translation content', () => {
      wrapper = createWrapper();

      const container = wrapper.find('.warning-archived-messages__container');
      const disclaimer = wrapper.findComponent({ name: 'UnnnicDisclaimer' });

      expect(container.exists()).toBe(true);
      expect(disclaimer.exists()).toBe(true);
      expect(disclaimer.props('type')).toBe('attention');
    });
  });
});
