import {
  describe,
  it,
  expect,
  vi,
  afterEach,
  beforeAll,
  afterAll,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import Media from '../Media.vue';
import i18n from '@/plugins/i18n';

vi.mock('@/services/api/resources/chats/media', () => ({
  default: {
    download: vi.fn(),
    listFromContactAndRoom: vi.fn(() =>
      Promise.resolve({ results: [], next: null }),
    ),
    listFromContactAndClosedRoom: vi.fn(() =>
      Promise.resolve({ results: [], next: null }),
    ),
  },
}));

vi.mock('@/services/api/resources/chats/roomNotes', () => ({
  default: {
    getInternalNotes: vi.fn(() => Promise.resolve({ results: [] })),
  },
}));

beforeAll(() => {
  config.global.plugins = config.global.plugins.filter(
    (plugin) => plugin !== i18n,
  );

  i18n.global.t = vi.fn((key) => key);
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
  vi.restoreAllMocks();
});

const createWrapper = (props = {}, piniaOptions = {}) =>
  mount(Media, {
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
          initialState: {
            contactInfos: {
              medias: [],
              documents: [],
              audios: [],
              isLoadingMedias: false,
              isLoadingDocuments: false,
              isLoadingAudios: false,
            },
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
        UnnnicTab: {
          template: `
            <div>
              <div v-for="key in tabs" :key="'head-' + key">
                <slot :name="'tab-head-' + key" />
              </div>
              <div v-for="key in tabs" :key="'panel-' + key">
                <slot :name="'tab-panel-' + key" />
              </div>
            </div>
          `,
          props: ['tabs', 'modelValue', 'size'],
        },
      },
    },
  });

describe('Media', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  describe('Initial Rendering', () => {
    it('should render Media component', () => {
      wrapper = createWrapper();
      expect(wrapper.exists()).toBe(true);
    });

    it('should initialize with correct tab configuration', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.tabsKeys).toEqual(['notes', 'media', 'docs', 'audio']);
      expect(wrapper.vm.activeTab).toBe('notes');
    });

    it('should have tabs configuration object', () => {
      wrapper = createWrapper();
      expect(wrapper.vm.tabs).toBeDefined();
      expect(wrapper.vm.tabs.notes).toBeDefined();
      expect(wrapper.vm.tabs.media).toBeDefined();
      expect(wrapper.vm.tabs.docs).toBeDefined();
      expect(wrapper.vm.tabs.audio).toBeDefined();
    });
  });

  describe('Props and Events', () => {
    it('should receive correct props', () => {
      wrapper = createWrapper();
      expect(wrapper.props('room')).toEqual({
        contact: { uuid: 'contact-123' },
        uuid: 'room-123',
      });
      expect(wrapper.props('contactInfo')).toEqual({ uuid: 'contact-123' });
      expect(wrapper.props('history')).toBe(false);
    });

    it('should handle fullscreen event', () => {
      wrapper = createWrapper();

      wrapper.vm.handleFullscreen('test-url', [{ url: 'test-url' }]);

      expect(wrapper.emitted('fullscreen')).toBeTruthy();
      expect(wrapper.emitted('fullscreen')[0]).toEqual([
        'test-url',
        [{ url: 'test-url' }],
      ]);
    });

    it('should emit loaded-medias when tab loaded', () => {
      wrapper = createWrapper();

      wrapper.vm.handleTabLoaded();

      expect(wrapper.emitted('loaded-medias')).toBeTruthy();
    });
  });

  describe('Component Props Filtering', () => {
    it('should filter props correctly for each tab', () => {
      wrapper = createWrapper();

      const notesProps = wrapper.vm.getComponentProps('notes');
      expect(notesProps).toHaveProperty('room');
      expect(notesProps).not.toHaveProperty('contactInfo');

      const mediaProps = wrapper.vm.getComponentProps('media');
      expect(mediaProps).toHaveProperty('room');
      expect(mediaProps).toHaveProperty('contactInfo');
      expect(mediaProps).toHaveProperty('history');
    });

    it('should configure events correctly for each tab', () => {
      wrapper = createWrapper();

      const notesEvents = wrapper.vm.getComponentEvents('notes');
      expect(notesEvents).toHaveProperty('loaded');
      expect(notesEvents).not.toHaveProperty('fullscreen');

      const mediaEvents = wrapper.vm.getComponentEvents('media');
      expect(mediaEvents).toHaveProperty('loaded');
      expect(mediaEvents).toHaveProperty('fullscreen');
    });
  });

  describe('Store Integration', () => {
    it('should clear store on unmount', () => {
      wrapper = createWrapper();
      const clearAllSpy = vi.spyOn(wrapper.vm.contactInfosStore, 'clearAll');

      wrapper.unmount();
      expect(clearAllSpy).toHaveBeenCalled();
    });
  });

  describe('History Mode', () => {
    it('should pass history prop correctly', () => {
      wrapper = createWrapper({ history: true });

      expect(wrapper.props('history')).toBe(true);
    });

    it('should filter history prop in component props', () => {
      wrapper = createWrapper({ history: true });

      const mediaProps = wrapper.vm.getComponentProps('media');
      expect(mediaProps.history).toBe(true);

      const notesProps = wrapper.vm.getComponentProps('notes');
      expect(notesProps).not.toHaveProperty('history');
    });
  });
});
