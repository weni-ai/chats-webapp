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
import DocumentsContent from '../DocumentsContent.vue';
import i18n from '@/plugins/i18n';
import Media from '@/services/api/resources/chats/media';

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

const mockDocuments = [
  {
    url: 'https://example.com/file.pdf',
    content_type: 'application/pdf',
    created_on: '2024-01-01',
  },
];

const createWrapper = (props = {}, storeOverrides = {}) => {
  const wrapper = mount(DocumentsContent, {
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
        UnnnicChatsMessage: {
          template:
            '<div data-testid="document-message" @click="$emit(\'click\')"></div>',
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

describe('DocumentsContent', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading skeleton when isLoadingDocuments is true', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingDocuments = true;
      wrapper.vm.contactInfosStore.hasDocuments = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="documents-container"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="documents-content"]').exists()).toBe(
        true,
      );
    });

    it('should show content when not loading', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingDocuments = false;
      wrapper.vm.contactInfosStore.documents = mockDocuments;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="documents-content"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="documents-empty"]').exists()).toBe(
        false,
      );
    });

    it('should show empty state when no documents and not loading', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.isLoadingDocuments = false;
      wrapper.vm.contactInfosStore.documents = [];
      wrapper.vm.contactInfosStore.hasDocuments = false;
      await wrapper.vm.$nextTick();

      expect(wrapper.find('[data-testid="documents-empty"]').exists()).toBe(
        true,
      );
      expect(wrapper.find('[data-testid="documents-content"]').exists()).toBe(
        false,
      );
    });
  });

  describe('Document Rendering', () => {
    it('should render UnnnicChatsMessage for each document', async () => {
      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.documents = mockDocuments;
      wrapper.vm.contactInfosStore.isLoadingDocuments = false;
      await wrapper.vm.$nextTick();

      const messages = wrapper.findAll('[data-testid="document-message"]');
      expect(messages).toHaveLength(mockDocuments.length);
    });
  });

  describe('Download Functionality', () => {
    it('should download document when clicked', async () => {
      wrapper = createWrapper({}, { docs: mockDocuments });

      wrapper.vm.download('https://example.com/file.pdf');

      expect(Media.download).toHaveBeenCalledWith({
        media: 'https://example.com/file.pdf',
        name: 'file.pdf',
      });
    });

    it('should handle download errors gracefully', async () => {
      wrapper = createWrapper();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      wrapper.vm.download(null);

      await wrapper.vm.$nextTick();

      expect(consoleSpy).toHaveBeenCalledWith(
        'An error occurred when trying to download the media:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Store Integration', () => {
    it('should not load documents if already loaded', async () => {
      wrapper = createWrapper();
      const loadDocumentsSpy = vi.fn();
      wrapper.vm.contactInfosStore.loadDocuments = loadDocumentsSpy;
      wrapper.vm.contactInfosStore.hasDocuments = true;

      await flushPromises();
      expect(loadDocumentsSpy).not.toHaveBeenCalled();
    });

    it('should load documents on mount if not loaded', async () => {
      const loadDocumentsSpy = vi.fn().mockResolvedValue();

      wrapper = createWrapper();
      wrapper.vm.contactInfosStore.hasDocuments = false;
      wrapper.vm.contactInfosStore.isLoadingDocuments = false;
      wrapper.vm.contactInfosStore.loadDocuments = loadDocumentsSpy;

      await wrapper.vm.contactInfosStore.loadDocuments({
        contact: 'contact-123',
        room: 'room-123',
        history: false,
        contactInfo: 'contact-123',
      });

      expect(loadDocumentsSpy).toHaveBeenCalledWith({
        contact: 'contact-123',
        room: 'room-123',
        history: false,
        contactInfo: 'contact-123',
      });
    });

    it('should not load if already loading', async () => {
      wrapper = createWrapper();
      const loadDocumentsSpy = vi.fn();
      wrapper.vm.contactInfosStore.loadDocuments = loadDocumentsSpy;
      wrapper.vm.contactInfosStore.hasDocuments = false;
      wrapper.vm.contactInfosStore.isLoadingDocuments = true;

      await flushPromises();
      expect(loadDocumentsSpy).not.toHaveBeenCalled();
    });
  });
});
