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
import MediasContent from '../MediasContent.vue';
import i18n from '@/plugins/i18n';

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
});

afterAll(() => {
  if (!config.global.plugins.includes(i18n)) {
    config.global.plugins.push(i18n);
  }
});

const mockImages = [
  {
    url: 'https://example.com/image1.png',
    content_type: 'image/png',
    created_on: '2024-01-01',
  },
  {
    url: 'https://example.com/video1.mp4',
    content_type: 'video/mp4',
    created_on: '2024-01-02',
  },
];

const createWrapper = (props = {}, storeOverrides = {}) => {
  const wrapper = mount(MediasContent, {
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
      stubs: {
        MediaPreview: {
          template:
            '<div data-testid="media-preview" @click="$emit(\'click\')"></div>',
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

describe('MediasContent', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoadingMedias is true', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingMedias = true;
      wrapper.vm.contactInfosStore.hasMedias = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="medias-container"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="medias-content"]').exists()).toBe(
        true,
      );
    });

    it('should show content when not loading', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingMedias = false;
      wrapper.vm.contactInfosStore.medias = mockImages;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="medias-content"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="medias-empty"]').exists()).toBe(
        false,
      );
    });

    it('should show empty state when no medias and not loading', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingMedias = false;
      wrapper.vm.contactInfosStore.medias = [];
      wrapper.vm.contactInfosStore.hasMedias = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="medias-empty"]').exists()).toBe(true);
      expect(wrapper.find('[data-testid="medias-content"]').exists()).toBe(
        false,
      );
    });
  });

  describe('Media Rendering', () => {
    it('should render MediaPreview for each image', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.medias = mockImages;
      wrapper.vm.contactInfosStore.isLoadingMedias = false;
      await wrapper.vm.$nextTick();

      const previews = wrapper.findAll('[data-testid="media-preview"]');
      expect(previews).toHaveLength(mockImages.length);
    });

    it('should emit fullscreen event when media is clicked', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.medias = mockImages;
      wrapper.vm.contactInfosStore.isLoadingMedias = false;
      await wrapper.vm.$nextTick();

      const preview = wrapper.find('[data-testid="media-preview"]');
      await preview.trigger('click');

      expect(wrapper.emitted('fullscreen')).toBeTruthy();
    });
  });

  describe('Store Integration', () => {
    it('should not load medias if already loaded', async () => {
      wrapper = createWrapper();
      const loadMediasSpy = vi.fn();
      wrapper.vm.contactInfosStore.loadMedias = loadMediasSpy;
      wrapper.vm.contactInfosStore.hasMedias = true;

      await wrapper.vm.$nextTick();
      await flushPromises();

      expect(loadMediasSpy).not.toHaveBeenCalled();
    });

    it('should load medias on mount if not loaded', async () => {
      const loadMediasSpy = vi.fn().mockResolvedValue();

      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.hasMedias = false;
      wrapper.vm.contactInfosStore.isLoadingMedias = false;
      wrapper.vm.contactInfosStore.loadMedias = loadMediasSpy;

      await wrapper.vm.contactInfosStore.loadMedias({
        contact: 'contact-123',
        room: 'room-123',
        history: false,
        contactInfo: 'contact-123',
      });

      expect(loadMediasSpy).toHaveBeenCalledWith({
        contact: 'contact-123',
        room: 'room-123',
        history: false,
        contactInfo: 'contact-123',
      });
    });

    it('should handle history mode correctly', async () => {
      const loadMediasSpy = vi.fn().mockResolvedValue();

      wrapper = createWrapper({ history: true });
      wrapper.vm.contactInfosStore.hasMedias = false;
      wrapper.vm.contactInfosStore.isLoadingMedias = false;
      wrapper.vm.contactInfosStore.loadMedias = loadMediasSpy;

      await wrapper.vm.contactInfosStore.loadMedias({
        contact: 'contact-123',
        room: 'room-123',
        history: true,
        contactInfo: 'contact-123',
      });

      expect(loadMediasSpy).toHaveBeenCalledWith(
        expect.objectContaining({ history: true }),
      );
    });

    it('should not load if already loading', async () => {
      wrapper = createWrapper();
      const loadMediasSpy = vi.fn();
      wrapper.vm.contactInfosStore.loadMedias = loadMediasSpy;
      wrapper.vm.contactInfosStore.hasMedias = false;
      wrapper.vm.contactInfosStore.isLoadingMedias = true;

      await flushPromises();
      expect(loadMediasSpy).not.toHaveBeenCalled();
    });
  });
});
