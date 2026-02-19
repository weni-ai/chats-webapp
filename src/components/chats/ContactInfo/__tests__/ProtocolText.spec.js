import {
  describe,
  it,
  expect,
  beforeEach,
  vi,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config, flushPromises } from '@vue/test-utils';
import ProtocolText from '../ProtocolText.vue';
import i18n from '@/plugins/i18n';

// Remove i18n plugin to avoid "Cannot mutate script setup binding $t" with script setup components
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

// Mock so component's i18n.global.t returns key (tooltip assertions)
vi.spyOn(i18n.global, 't').mockImplementation((key) => key);

describe('ProtocolText - copy protocol', () => {
  let writeTextMock;

  beforeEach(() => {
    writeTextMock = vi.fn(() => Promise.resolve());
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  const createWrapper = (props = {}) =>
    mount(ProtocolText, {
      props: {
        protocol: 'PROT-123',
        ...props,
      },
      global: {
        plugins: [],
        mocks: {
          $t: (key) => key,
        },
        stubs: {
          UnnnicToolTip: {
            name: 'UnnnicToolTip',
            template: '<div class="unnnic-tooltip"><slot /></div>',
            props: ['enabled', 'text', 'side'],
          },
          UnnnicIconSvg: {
            name: 'UnnnicIconSvg',
            template: '<span class="unnnic-icon-svg"></span>',
            props: ['icon', 'scheme', 'size'],
          },
        },
      },
    });

  it('renders protocol section when protocol has length', () => {
    const wrapper = createWrapper({ protocol: 'TICKET-001' });

    expect(wrapper.find('.protocol-text').exists()).toBe(true);
    expect(wrapper.find('.protocol-text__ticket-value').text()).toBe(
      'TICKET-001',
    );
  });

  it('does not render when protocol is empty', () => {
    const wrapper = createWrapper({ protocol: '' });

    expect(wrapper.find('.protocol-text').exists()).toBe(false);
  });

  it('calls navigator.clipboard.writeText with protocol on click', async () => {
    const wrapper = createWrapper({ protocol: 'PROT-456' });

    await wrapper.find('.protocol-text').trigger('click');

    expect(writeTextMock).toHaveBeenCalledTimes(1);
    expect(writeTextMock).toHaveBeenCalledWith('PROT-456');
  });

  it('does not call clipboard when protocol is empty', async () => {
    const wrapper = mount(ProtocolText, {
      props: { protocol: '' },
      global: {
        plugins: [],
        mocks: { $t: (key) => key },
        stubs: {
          UnnnicToolTip: true,
          UnnnicIconSvg: true,
        },
      },
    });

    if (wrapper.find('.protocol-text').exists()) {
      await wrapper.find('.protocol-text').trigger('click');
    }
    expect(writeTextMock).not.toHaveBeenCalled();
  });

  it('schedules reset of copy feedback after 3 seconds on successful copy', async () => {
    vi.useFakeTimers();
    const setTimeoutSpy = vi.spyOn(global, 'setTimeout');

    const wrapper = createWrapper({ protocol: 'P1' });
    await wrapper.find('.protocol-text').trigger('click');

    expect(writeTextMock).toHaveBeenCalled();
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 3000);

    setTimeoutSpy.mockRestore();
    vi.useRealTimers();
  });

  it('logs error when clipboard.writeText fails', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    writeTextMock.mockRejectedValueOnce(new Error('Clipboard denied'));

    const wrapper = createWrapper({ protocol: 'P1' });
    await wrapper.find('.protocol-text').trigger('click');
    await flushPromises();

    expect(consoleSpy).toHaveBeenCalledWith(
      'Failed to copy protocol:',
      expect.any(Error),
    );

    consoleSpy.mockRestore();
  });
});
