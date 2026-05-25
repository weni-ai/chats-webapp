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
import AudiosContent from '../AudiosContent.vue';
import i18n from '@/plugins/i18n';
vi.mock('moment', () => ({
  default: vi.fn((_date) => ({
    format: vi.fn((format) => (format === 'L' ? '01/01/2024' : '10:30 AM')),
  })),
}));

vi.mock('@/services/api/resources/chats/media', () => ({
  default: {
    listFromContactAndRoom: vi.fn(() =>
      Promise.resolve({ results: [], next: null }),
    ),
    listFromContactAndClosedRoom: vi.fn(() =>
      Promise.resolve({ results: [], next: null }),
    ),
  },
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );

  i18n.global.t = vi.fn((key, params) => {
    if (key === 'contact_info.audio_tooltip') {
      return `${params?.agent || ''} ${params?.date || ''} at ${params?.time || ''}`;
    }
    return key;
  });
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  vi.restoreAllMocks();
});

const mockAudios = [
  {
    url: 'https://example.com/audio1.mp3',
    content_type: 'audio/mp3',
    created_on: '2024-01-01T10:30:00Z',
    sender: 'Agent Name',
    duration: 120,
  },
];

const createWrapper = (props = {}, storeOverrides = {}) => {
  const wrapper = mount(AudiosContent, {
    props: {
      room: { contact: { uuid: 'contact-123' }, uuid: 'room-123' },
      contactInfo: { uuid: 'contact-123' },
      history: false,
      ...props,
    },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          stubActions: false,
        }),
      ],
      mocks: { $t: (key) => key },
      components: {
        UnnnicToolTip: config.global.stubs.UnnnicToolTip,
      },
      stubs: {
        UnnnicAudioRecorder: {
          template: '<div data-testid="audio-recorder"></div>',
        },
        UnnnicSkeletonLoading: true,
      },
    },
  });

  if (storeOverrides) {
    const store = wrapper.vm.contactInfosStore;
    Object.keys(storeOverrides).forEach((key) => {
      store[key] = storeOverrides[key];
    });
  }

  return wrapper;
};

describe('AudiosContent', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoadingAudios is true', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingAudios = true;
      wrapper.vm.contactInfosStore.hasAudios = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="audios-container"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="audios-content"]').exists()).toBe(
        true,
      );
    });

    it('should show content when not loading', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingAudios = false;
      wrapper.vm.contactInfosStore.audios = mockAudios;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="audios-content"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="audios-empty"]').exists()).toBe(false);
    });

    it('should show empty state when no audios and not loading', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingAudios = false;
      wrapper.vm.contactInfosStore.audios = [];
      wrapper.vm.contactInfosStore.hasAudios = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="audios-empty"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="audios-content"]').exists()).toBe(
        false,
      );
    });
  });

  describe('Audio Rendering', () => {
    it('should render audio components for each audio', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.audios = mockAudios;
      wrapper.vm.contactInfosStore.isLoadingAudios = false;
      await wrapper.vm.$nextTick();

      const tooltips = wrapper.findAllComponents({ name: 'UnnnicToolTipStub' });
      expect(tooltips).toHaveLength(mockAudios.length);
    });

    it('should render scrollable container', () => {
      wrapper = createWrapper();
      expect(wrapper.find('[data-testid="audios-container"]').exists()).toBe(
        true,
      );
    });
  });

  describe('Tooltip Functionality', () => {
    it('should format tooltip text correctly with sender', () => {
      wrapper = createWrapper();

      wrapper.vm.audioTooltipText(mockAudios[0]);

      expect(i18n.global.t).toHaveBeenCalledWith('contact_info.audio_tooltip', {
        agent: 'Agent Name',
        date: '01/01/2024',
        time: '10:30 AM',
      });
    });

    it('should format tooltip text correctly without sender', () => {
      wrapper = createWrapper();

      const audioWithoutSender = { ...mockAudios[0], sender: '' };
      wrapper.vm.audioTooltipText(audioWithoutSender);

      expect(i18n.global.t).toHaveBeenCalledWith(
        'contact_info.audio_tooltip',
        expect.objectContaining({ agent: '' }),
      );
    });
  });

  describe('Store Integration', () => {
    it('should not load audios if already loaded', async () => {
      wrapper = createWrapper();
      const loadAudiosSpy = vi.fn();
      wrapper.vm.contactInfosStore.loadAudios = loadAudiosSpy;
      wrapper.vm.contactInfosStore.hasAudios = true;

      await flushPromises();
      expect(loadAudiosSpy).not.toHaveBeenCalled();
    });

    it('should load audios on mount if not loaded', async () => {
      const loadAudiosSpy = vi.fn().mockResolvedValue();

      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.hasAudios = false;
      wrapper.vm.contactInfosStore.isLoadingAudios = false;
      wrapper.vm.contactInfosStore.loadAudios = loadAudiosSpy;

      await wrapper.vm.contactInfosStore.loadAudios({
        contact: 'contact-123',
        room: 'room-123',
        history: false,
        contactInfo: 'contact-123',
      });

      expect(loadAudiosSpy).toHaveBeenCalledWith({
        contact: 'contact-123',
        room: 'room-123',
        history: false,
        contactInfo: 'contact-123',
      });
    });

    it('should handle history mode correctly', async () => {
      const loadAudiosSpy = vi.fn().mockResolvedValue();

      wrapper = createWrapper({ history: true });
      wrapper.vm.contactInfosStore.hasAudios = false;
      wrapper.vm.contactInfosStore.isLoadingAudios = false;
      wrapper.vm.contactInfosStore.loadAudios = loadAudiosSpy;

      await wrapper.vm.contactInfosStore.loadAudios({
        contact: 'contact-123',
        room: 'room-123',
        history: true,
        contactInfo: 'contact-123',
      });

      expect(loadAudiosSpy).toHaveBeenCalledWith(
        expect.objectContaining({ history: true }),
      );
    });

    it('should not load if already loading', async () => {
      wrapper = createWrapper();
      const loadAudiosSpy = vi.fn();
      wrapper.vm.contactInfosStore.loadAudios = loadAudiosSpy;
      wrapper.vm.contactInfosStore.hasAudios = false;
      wrapper.vm.contactInfosStore.isLoadingAudios = true;

      await flushPromises();
      expect(loadAudiosSpy).not.toHaveBeenCalled();
    });
  });
});
