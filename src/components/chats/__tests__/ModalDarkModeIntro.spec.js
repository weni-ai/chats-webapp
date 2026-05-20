import { mount, config } from '@vue/test-utils';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';

const setThemeMock = vi.fn();
const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();

vi.mock('@weni/unnnic-system', () => ({
  default: {},
  useTheme: () => ({ setTheme: setThemeMock }),
  unnnicToastManager: {
    success: (...args) => toastSuccessMock(...args),
    error: (...args) => toastErrorMock(...args),
  },
}));

import ModalDarkModeIntro from '../ModalDarkModeIntro.vue';
import i18n from '@/plugins/i18n';

const UnnnicSystemPlugin = config.global.plugins.find(
  (p) => p !== i18n && typeof p !== 'function',
);

beforeAll(() => {
  config.global.plugins = (config.global.plugins || []).filter(
    (plugin) => plugin !== i18n && plugin !== UnnnicSystemPlugin,
  );
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  if (
    UnnnicSystemPlugin &&
    !config.global.plugins.includes(UnnnicSystemPlugin)
  ) {
    config.global.plugins.push(UnnnicSystemPlugin);
  }
});

const stubs = {
  UnnnicButton: {
    template: '<button type="button">{{ text }}</button>',
    props: ['text', 'type'],
  },
};

const createWrapper = (props = {}) =>
  mount(ModalDarkModeIntro, {
    props: { open: true, ...props },
    global: { stubs },
  });

describe('ModalDarkModeIntro', () => {
  beforeEach(() => {
    setThemeMock.mockReset();
    toastSuccessMock.mockReset();
    toastErrorMock.mockReset();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('rendering', () => {
    it('renders the title with the moon emoji', () => {
      const wrapper = createWrapper();
      const title = wrapper.find('[data-testid="dark-mode-intro-title"]');
      expect(title.exists()).toBe(true);
      expect(title.text()).toContain('Dark mode is here 🌙');
    });

    it('renders both description paragraphs and the tagline', () => {
      const wrapper = createWrapper();
      expect(
        wrapper.find('[data-testid="dark-mode-intro-description-1"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="dark-mode-intro-description-2"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="dark-mode-intro-tagline"]').exists(),
      ).toBe(true);
    });

    it('renders the preview image', () => {
      const wrapper = createWrapper();
      const img = wrapper.find('[data-testid="dark-mode-intro-preview"]');
      expect(img.exists()).toBe(true);
      expect(img.attributes('src')).toBeTruthy();
    });

    it('renders both action buttons', () => {
      const wrapper = createWrapper();
      expect(
        wrapper.find('[data-testid="dark-mode-intro-not-now"]').exists(),
      ).toBe(true);
      expect(
        wrapper.find('[data-testid="dark-mode-intro-switch"]').exists(),
      ).toBe(true);
    });
  });

  describe('dismiss interaction', () => {
    it('emits update:open=false on "Not now" click and never touches the theme', async () => {
      const wrapper = createWrapper();

      await wrapper
        .find('[data-testid="dark-mode-intro-not-now"]')
        .trigger('click');

      expect(wrapper.emitted('update:open')).toEqual([[false]]);
      expect(setThemeMock).not.toHaveBeenCalled();
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(toastErrorMock).not.toHaveBeenCalled();
    });
  });

  describe('switch to dark interaction', () => {
    it('applies dark theme, closes the modal and triggers a success toast', async () => {
      setThemeMock.mockImplementation(() => {
        localStorage.setItem('unnnic-theme', 'dark');
      });

      const wrapper = createWrapper();

      await wrapper
        .find('[data-testid="dark-mode-intro-switch"]')
        .trigger('click');

      expect(setThemeMock).toHaveBeenCalledWith('dark');
      expect(wrapper.emitted('update:open')).toEqual([[false]]);
      expect(toastSuccessMock).toHaveBeenCalledTimes(1);
      expect(toastErrorMock).not.toHaveBeenCalled();

      const [title, description, options] = toastSuccessMock.mock.calls[0];
      expect(title).toBe('Dark mode applied successfully');
      expect(description).toBeUndefined();
      expect(options.button.text).toBe('Back to light mode');
      expect(typeof options.button.action).toBe('function');
    });

    it('the success toast action callback reverts to light theme', async () => {
      setThemeMock.mockImplementation((theme) => {
        localStorage.setItem('unnnic-theme', theme);
      });

      const wrapper = createWrapper();
      await wrapper
        .find('[data-testid="dark-mode-intro-switch"]')
        .trigger('click');

      const { action } = toastSuccessMock.mock.calls[0][2].button;
      setThemeMock.mockClear();
      action();

      expect(setThemeMock).toHaveBeenCalledWith('light');
    });

    it('triggers an error toast when the theme write does not persist', async () => {
      setThemeMock.mockImplementation(() => {
        // Simulate localStorage being unavailable / write failing
      });

      const wrapper = createWrapper();

      await wrapper
        .find('[data-testid="dark-mode-intro-switch"]')
        .trigger('click');

      expect(setThemeMock).toHaveBeenCalledWith('dark');
      expect(toastSuccessMock).not.toHaveBeenCalled();
      expect(toastErrorMock).toHaveBeenCalledTimes(1);
      expect(wrapper.emitted('update:open')).toBeFalsy();

      const [title, description, options] = toastErrorMock.mock.calls[0];
      expect(title).toBe('Error applying dark mode');
      expect(description).toBeUndefined();
      expect(options.button.text).toBe('Try again');
      expect(typeof options.button.action).toBe('function');
    });

    it('the error toast "Try again" action retries the switch', async () => {
      let attempt = 0;
      setThemeMock.mockImplementation(() => {
        attempt += 1;
        if (attempt === 2) {
          localStorage.setItem('unnnic-theme', 'dark');
        }
      });

      const wrapper = createWrapper();

      await wrapper
        .find('[data-testid="dark-mode-intro-switch"]')
        .trigger('click');

      const { action } = toastErrorMock.mock.calls[0][2].button;
      action();

      expect(setThemeMock).toHaveBeenCalledTimes(2);
      expect(setThemeMock).toHaveBeenLastCalledWith('dark');
      expect(toastSuccessMock).toHaveBeenCalledTimes(1);
    });
  });
});
