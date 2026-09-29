import { describe, it, expect, beforeEach, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import isMobile from 'is-mobile';

import { ASSISTED_SALES_FEATURE_FLAG } from '@/composables/useAssistedSalesFeatureFlag';
import { isCopilotConnectionConfigured } from '@/composables/useCopilotConnection';
import {
  CONTACT_INFO_ACTIVE_TAB_KEY,
  DESK_COPILOT_TAB,
  INFORMATION_TAB,
  openDeskCopilotTab,
  shouldOpenDeskCopilotAfterTakeOver,
  useContactInfoTab,
} from '../useContactInfoTab';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { moduleStorage } from '@/utils/storage';

vi.mock('is-mobile', () => ({
  default: vi.fn(() => false),
}));

vi.mock('@/composables/useCopilotConnection', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    isCopilotConnectionConfigured: vi.fn(() => false),
  };
});

describe('useContactInfoTab', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    vi.mocked(isMobile).mockReturnValue(false);
    vi.mocked(isCopilotConnectionConfigured).mockReturnValue(false);
    localStorage.clear();
  });

  it('persists the desk copilot tab when openDeskCopilotTab is called', () => {
    moduleStorage.setItem(CONTACT_INFO_ACTIVE_TAB_KEY, INFORMATION_TAB);

    openDeskCopilotTab();

    expect(moduleStorage.getItem(CONTACT_INFO_ACTIVE_TAB_KEY)).toBe(
      DESK_COPILOT_TAB,
    );
  });

  it('falls back to information when the desk copilot tab is hidden', async () => {
    moduleStorage.setItem(CONTACT_INFO_ACTIVE_TAB_KEY, DESK_COPILOT_TAB);
    const showDeskCopilotTab = ref(true);
    const scope = effectScope();
    const { activeTab } = scope.run(() =>
      useContactInfoTab(showDeskCopilotTab),
    );

    expect(activeTab.value).toBe(DESK_COPILOT_TAB);

    showDeskCopilotTab.value = false;
    await nextTick();

    expect(activeTab.value).toBe(INFORMATION_TAB);
    expect(moduleStorage.getItem(CONTACT_INFO_ACTIVE_TAB_KEY)).toBe(
      INFORMATION_TAB,
    );

    scope.stop();
  });

  it('does not open desk copilot after take over without assisted sales', () => {
    vi.mocked(isCopilotConnectionConfigured).mockReturnValue(true);

    expect(shouldOpenDeskCopilotAfterTakeOver({ queue: { sector: '1' } })).toBe(
      false,
    );
  });

  it('opens desk copilot after take over when assisted sales and copilot are ready', () => {
    const featureFlagStore = useFeatureFlag();
    featureFlagStore.featureFlags = {
      active_features: [ASSISTED_SALES_FEATURE_FLAG],
    };
    vi.mocked(isCopilotConnectionConfigured).mockReturnValue(true);

    expect(shouldOpenDeskCopilotAfterTakeOver({ queue: { sector: '1' } })).toBe(
      true,
    );
  });

  it('does not open desk copilot after take over on mobile or when the tab is hidden', () => {
    const featureFlagStore = useFeatureFlag();
    featureFlagStore.featureFlags = {
      active_features: [ASSISTED_SALES_FEATURE_FLAG],
    };
    vi.mocked(isCopilotConnectionConfigured).mockReturnValue(true);

    vi.mocked(isMobile).mockReturnValue(true);
    expect(shouldOpenDeskCopilotAfterTakeOver({ queue: { sector: '1' } })).toBe(
      false,
    );

    vi.mocked(isMobile).mockReturnValue(false);
    useConfig().project = {
      uuid: 'project-1',
      config: { hide_desk_copilot_tab: true },
    };
    expect(shouldOpenDeskCopilotAfterTakeOver({ queue: { sector: '1' } })).toBe(
      false,
    );
  });
});
