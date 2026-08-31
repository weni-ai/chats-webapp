import {
  describe,
  it,
  expect,
  afterEach,
  beforeAll,
  afterAll,
  vi,
} from 'vitest';
import { mount, config } from '@vue/test-utils';
import { createTestingPinia } from '@pinia/testing';
import ContactInfo from '../index.vue';
import i18n from '@/plugins/i18n';
import { ASSISTED_SALES_FEATURE_FLAG } from '@/composables/useAssistedSalesFeatureFlag';

vi.mock('@/services/api/resources/chats/linkContact', () => ({
  default: {
    getLinketContact: vi.fn(() => Promise.resolve({ Detail: true })),
    linkContactToAgent: vi.fn(),
    removeContactFromAgent: vi.fn(),
  },
}));

vi.mock('is-mobile', () => ({
  default: () => false,
}));

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

const mockRoom = {
  uuid: 'room-1',
  queue: { sector: 'sector-1', uuid: 'queue-1' },
  contact: {
    uuid: 'contact-1',
    name: 'Aline',
    status: 'offline',
    created_on: '2024-01-01',
  },
  custom_fields: {},
  can_edit_custom_fields: false,
  user: { first_name: 'Agent', last_name: 'One' },
  linked_user: '',
};

const createWrapper = ({ activeFeatures = [] } = {}) =>
  mount(ContactInfo, {
    props: {
      isHistory: false,
      isViewMode: false,
    },
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            rooms: {
              activeRoom: mockRoom,
            },
            roomMessages: {
              roomMessages: [],
              roomInternalNotes: [],
            },
            featureFlag: {
              featureFlags: {
                active_features: activeFeatures,
              },
              featureFlagsLoaded: true,
            },
          },
        }),
      ],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        ContactInfosLoading: true,
        ContactInfoRedesign: {
          name: 'ContactInfoRedesign',
          template:
            '<div data-testid="contact-info-redesign"><slot name="previews" /></div>',
        },
        AsideSlotTemplate: {
          name: 'AsideSlotTemplate',
          template:
            '<div data-testid="contact-info-legacy"><slot name="header" /><slot /></div>',
        },
        AsideSlotTemplateSection: true,
        AboutSupport: true,
        ContactMedia: true,
        CustomField: true,
        CopyValueButton: true,
        FullscreenPreview: true,
        VideoPreview: true,
        UnnnicButton: true,
        UnnnicSwitch: true,
        UnnnicToolTip: true,
        UnnnicIcon: true,
        UnnnicIconSvg: true,
      },
    },
  });

describe('ContactInfo feature flag branching', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
  });

  it('renders legacy layout when assisted sales flag is disabled', async () => {
    wrapper = createWrapper({ activeFeatures: [] });
    wrapper.vm.isLoading = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="contact-info-legacy"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="contact-info-redesign"]').exists()).toBe(
      false,
    );
  });

  it('renders redesign layout when assisted sales flag is enabled', async () => {
    wrapper = createWrapper({
      activeFeatures: [ASSISTED_SALES_FEATURE_FLAG],
    });
    wrapper.vm.isLoading = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('[data-testid="contact-info-redesign"]').exists()).toBe(
      true,
    );
    expect(wrapper.find('[data-testid="contact-info-legacy"]').exists()).toBe(
      false,
    );
  });
});
