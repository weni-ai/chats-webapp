import { mount } from '@vue/test-utils';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { createTestingPinia } from '@pinia/testing';
import { createMemoryHistory, createRouter } from 'vue-router';

import SettingsPage from '@/views/Settings/index.vue';

import { useCompositionI18nInThisSpecFile } from '@/utils/test/compositionI18nVitest';
import { ASSISTED_SALES_FEATURE_FLAG } from '@/composables/useAssistedSalesFeatureFlag';
import { resetCopilotProjectState } from '@/composables/useCopilotProject';

vi.mock('@/services/api/resources/chats/copilotProject', () => ({
  default: {
    getLinkedProject: vi.fn().mockResolvedValue(null),
    create: vi.fn(),
  },
  normalizeCopilotProject: vi.fn(),
}));

const routes = [{ path: '/settings', name: 'settings' }];
const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

router.push = vi.fn();
router.replace = vi.fn();

const SettingsProjectOptionsStub = {
  name: 'SettingsProjectOptions',
  template: '<section data-testid="settings-project-options" />',
};
const CustomBreaksStub = {
  name: 'CustomBreaks',
  template: '<section data-testid="custom-breaks" />',
};

const createWrapper = ({ projectConfig = {}, activeFeatures = [] } = {}) => {
  return mount(SettingsPage, {
    global: {
      plugins: [
        router,
        createTestingPinia({
          initialState: {
            config: {
              project: {
                uuid: 'test-uuid',
                name: 'Test Project',
                config: { ...projectConfig },
              },
            },
            featureFlag: {
              featureFlags: { active_features: activeFeatures },
            },
            settings: {
              sectors: [],
              groups: [],
            },
          },
        }),
      ],
      stubs: {
        SettingsProjectOptions: SettingsProjectOptionsStub,
        CustomBreaks: CustomBreaksStub,
        SectorsList: true,
        GroupsList: true,
        RepresentativesSettings: true,
        DeskCopilotSettings: true,
        NewSectorDrawer: true,
        NewGroupDrawer: true,
      },
    },
  });
};

describe('Settings/index.vue (SettingsPage)', () => {
  useCompositionI18nInThisSpecFile();

  let wrapper;

  beforeEach(() => {
    vi.clearAllMocks();
    resetCopilotProjectState();
  });

  describe('Regular project (not in groups mode)', () => {
    beforeEach(() => {
      wrapper = createWrapper();
    });

    it('renders the settings page', () => {
      expect(wrapper.find('.settings-page').exists()).toBe(true);
    });

    it('renders SettingsProjectOptions and CustomBreaks on the general tab', () => {
      expect(
        wrapper.find('[data-testid="settings-project-options"]').exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="custom-breaks"]').exists()).toBe(true);
    });

    it('exposes general and sectors tabs at minimum', () => {
      const tabValues = wrapper.vm.settingsTabs.map((tab) => tab.value);
      expect(tabValues).toContain('general');
      expect(tabValues).toContain('sectors');
    });
  });

  describe('Main groups project (its_principal: true)', () => {
    beforeEach(() => {
      wrapper = createWrapper({ projectConfig: { its_principal: true } });
    });

    it('renders the settings page', () => {
      expect(wrapper.find('.settings-page').exists()).toBe(true);
    });

    it('still renders CustomBreaks', () => {
      expect(wrapper.find('[data-testid="custom-breaks"]').exists()).toBe(true);
    });

    it('exposes general, sectors and groups tabs', () => {
      const tabValues = wrapper.vm.settingsTabs.map((tab) => tab.value);
      expect(tabValues).toEqual(
        expect.arrayContaining(['general', 'sectors', 'groups']),
      );
    });
  });

  describe('Secondary groups project (its_principal: false)', () => {
    beforeEach(() => {
      wrapper = createWrapper({ projectConfig: { its_principal: false } });
    });

    it('still renders the settings page', () => {
      expect(wrapper.find('.settings-page').exists()).toBe(true);
    });

    it('renders SettingsProjectOptions but hides CustomBreaks', () => {
      expect(
        wrapper.find('[data-testid="settings-project-options"]').exists(),
      ).toBe(true);
      expect(wrapper.find('[data-testid="custom-breaks"]').exists()).toBe(
        false,
      );
    });

    it('exposes only the general tab', () => {
      expect(wrapper.vm.settingsTabs).toHaveLength(1);
      expect(wrapper.vm.settingsTabs[0].value).toBe('general');
    });
  });

  describe('Assisted sales feature flag', () => {
    it('hides the Desk Copilot tab when the flag is off', () => {
      wrapper = createWrapper();
      const tabValues = wrapper.vm.settingsTabs.map((tab) => tab.value);

      expect(tabValues).not.toContain('desk_copilot');
      expect(
        wrapper.find('[data-testid="desk-copilot-new-tag"]').exists(),
      ).toBe(false);
    });

    it('shows the Desk Copilot tab and New badge when the flag is on', () => {
      wrapper = createWrapper({
        activeFeatures: [ASSISTED_SALES_FEATURE_FLAG],
      });
      const tabValues = wrapper.vm.settingsTabs.map((tab) => tab.value);

      expect(tabValues).toContain('desk_copilot');
      expect(
        wrapper.find('[data-testid="desk-copilot-new-tag"]').exists(),
      ).toBe(true);
    });
  });
});
