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

vi.mock('@/utils/env', () => ({
  default: vi.fn(() => 'https://dash.stg.cloud.weni.ai'),
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

const createWrapper = ({
  projectPermissionRole = 1,
  projectConfig = {},
  props = {},
} = {}) =>
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
            config: {
              project: {
                uuid: 'current-project',
                name: 'Desk',
                config: { ...projectConfig },
              },
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
    vi.restoreAllMocks();
  });

  it('renders title, description and checklist items', () => {
    wrapper = createWrapper();

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer"]').exists(),
    ).toBe(true);
    expect(wrapper.text()).toContain(
      'contact_info.desk_copilot.disclaimer.title_without_summary',
    );
    expect(wrapper.text()).toContain(
      'contact_info.desk_copilot.disclaimer.description',
    );
    expect(wrapper.text()).toContain(
      'contact_info.desk_copilot.disclaimer.items.product_recommendations',
    );
  });

  it('keeps the summary title when the project uses chats summary', () => {
    wrapper = createWrapper({ props: { hasSummary: true } });

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer-title"]').text(),
    ).toBe('contact_info.desk_copilot.disclaimer.title');
  });

  it('uses the title without summary when chats summary is disabled', () => {
    wrapper = createWrapper({ props: { hasSummary: false } });

    expect(
      wrapper.find('[data-testid="desk-copilot-disclaimer-title"]').text(),
    ).toBe('contact_info.desk_copilot.disclaimer.title_without_summary');
  });

  it('shows the enable button for admin users, including history screens', () => {
    // Intentional: Figma keeps Enable visible for admins on closed-room history.
    // View-mode is the only screen that hides it (besides non-admin roles).
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

  it('hides the enable button in view mode', () => {
    wrapper = createWrapper({
      projectPermissionRole: 1,
      props: { isViewMode: true },
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
      path: 'chats-settings:?tab=desk_copilot',
    });
  });

  it('opens the secondary project settings in a new tab on the primary project', async () => {
    const windowOpen = vi.spyOn(window, 'open').mockImplementation(() => null);

    wrapper = createWrapper({
      projectPermissionRole: 1,
      projectConfig: { its_principal: true },
      props: { originProjectUuid: 'secondary-uuid' },
    });

    await wrapper
      .find('[data-testid="desk-copilot-enable-button"]')
      .trigger('click');

    expect(windowOpen).toHaveBeenCalledWith(
      'https://dash.stg.cloud.weni.ai/projects/secondary-uuid/settings/chats?tab=desk_copilot',
      '_blank',
      'noopener,noreferrer',
    );
    expect(emitToHost).not.toHaveBeenCalled();
  });

  it('hides the enable button on the primary project when there is no origin project uuid', () => {
    wrapper = createWrapper({
      projectPermissionRole: 1,
      projectConfig: { its_principal: true },
    });

    expect(
      wrapper.find('[data-testid="desk-copilot-enable-button"]').exists(),
    ).toBe(false);
  });
});
