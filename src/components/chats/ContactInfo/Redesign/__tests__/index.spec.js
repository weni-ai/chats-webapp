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
import ContactInfoRedesign from '../index.vue';
import { moduleStorage } from '@/utils/storage';
import i18n from '@/plugins/i18n';

vi.mock('@/utils/storage', () => ({
  moduleStorage: {
    getItem: vi.fn(() => 'desk_copilot'),
    setItem: vi.fn(),
  },
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

const createWrapper = () =>
  mount(ContactInfoRedesign, {
    global: {
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        AsideSlotTemplate: {
          name: 'AsideSlotTemplate',
          template:
            '<div data-testid="contact-info-redesign"><slot name="header" /><slot /></div>',
        },
        ContactInfoRedesignHeader: {
          name: 'ContactInfoRedesignHeader',
          template: '<div data-testid="contact-info-redesign-header" />',
          props: [
            'modelValue',
            'showRefresh',
            'showClose',
            'isRefreshDisabled',
          ],
        },
        DeskCopilotTab: {
          name: 'DeskCopilotTab',
          template: '<div data-testid="desk-copilot" />',
          props: ['isHistory', 'isViewMode'],
        },
        AboutContactCard: true,
        AboutSupportCard: true,
        MediaTabs: true,
      },
    },
  });

describe('ContactInfoRedesign', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('opens the desk copilot tab by default', () => {
    moduleStorage.getItem.mockReturnValue('desk_copilot');
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="desk-copilot"]').exists()).toBe(true);
    expect(wrapper.findComponent({ name: 'AboutContactCard' }).exists()).toBe(
      false,
    );
  });

  it('renders information content when the persisted tab is information', () => {
    moduleStorage.getItem.mockReturnValue('information');
    wrapper = createWrapper();

    expect(wrapper.find('[data-testid="desk-copilot"]').exists()).toBe(false);
    expect(wrapper.findComponent({ name: 'AboutContactCard' }).exists()).toBe(
      true,
    );
  });

  it('persists tab changes in moduleStorage', async () => {
    moduleStorage.getItem.mockReturnValue('desk_copilot');
    wrapper = createWrapper();

    wrapper.vm.activeTab = 'information';
    await wrapper.vm.$nextTick();

    expect(moduleStorage.setItem).toHaveBeenCalledWith(
      'contactInfoActiveTab',
      'information',
    );
  });
});
