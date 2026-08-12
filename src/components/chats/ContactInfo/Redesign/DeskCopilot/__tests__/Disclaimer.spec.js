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
import Disclaimer from '../Disclaimer.vue';
import i18n from '@/plugins/i18n';
import { emitToHost } from '@/utils/hostBridge';

vi.mock('@/utils/hostBridge', () => ({
  emitToHost: vi.fn(),
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

const createWrapper = ({ projectPermissionRole = 1, props = {} } = {}) =>
  mount(Disclaimer, {
    props,
    global: {
      plugins: [
        createTestingPinia({
          createSpy: vi.fn,
          initialState: {
            profile: {
              me: { project_permission_role: projectPermissionRole },
            },
          },
        }),
      ],
      mocks: {
        $t: (key) => key,
      },
      stubs: {
        UnnnicIcon: true,
        UnnnicButton: {
          name: 'UnnnicButton',
          template:
            '<button class="unnnic-button" :data-testid="$attrs[\'data-testid\']" @click="$emit(\'click\')"><slot /></button>',
          inheritAttrs: false,
        },
      },
    },
  });

describe('DeskCopilotDisclaimer', () => {
  let wrapper;

  afterEach(() => {
    wrapper?.unmount();
    vi.clearAllMocks();
  });

  it('renders title, description and checklist items', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain(
      'contact_info.desk_copilot.disclaimer.title',
    );
    expect(wrapper.text()).toContain(
      'contact_info.desk_copilot.disclaimer.description',
    );
    expect(wrapper.text()).toContain(
      'contact_info.desk_copilot.disclaimer.items.product_recommendations',
    );
  });

  it('shows the enable button for admin users', () => {
    wrapper = createWrapper({ projectPermissionRole: 1 });

    expect(
      wrapper.find('[data-testid="desk-copilot-enable-button"]').exists(),
    ).toBe(true);
  });

  it('hides the enable button for agent users', () => {
    wrapper = createWrapper({ projectPermissionRole: 2 });

    expect(
      wrapper.find('[data-testid="desk-copilot-enable-button"]').exists(),
    ).toBe(false);
  });

  it('hides the enable button in history or view mode', () => {
    wrapper = createWrapper({
      projectPermissionRole: 1,
      props: { isHistory: true },
    });

    expect(
      wrapper.find('[data-testid="desk-copilot-enable-button"]').exists(),
    ).toBe(false);
  });

  it('redirects to live desk settings when enable is clicked', async () => {
    wrapper = createWrapper({ projectPermissionRole: 1 });

    await wrapper
      .find('[data-testid="desk-copilot-enable-button"]')
      .trigger('click');

    expect(emitToHost).toHaveBeenCalledWith('redirect', {
      path: 'chats:settings/live-desk',
    });
  });
});
