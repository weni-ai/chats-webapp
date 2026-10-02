import {
  computed,
  ref,
  toValue,
  watch,
  type MaybeRefOrGetter,
  type Ref,
} from 'vue';
import isMobile from 'is-mobile';

import type { ContactInfoTab } from '@/components/chats/ContactInfo/Redesign/Header.vue';
import { isCopilotConnectionConfigured } from '@/composables/useCopilotConnection';
import { useAssistedSalesFeatureFlag } from '@/composables/useAssistedSalesFeatureFlag';
import { useConfig } from '@/store/modules/config';
import { useFeatureFlag } from '@/store/modules/featureFlag';
import { moduleStorage } from '@/utils/storage';

export const CONTACT_INFO_ACTIVE_TAB_KEY = 'contactInfoActiveTab';
export const DESK_COPILOT_TAB: ContactInfoTab = 'desk_copilot';
export const INFORMATION_TAB: ContactInfoTab = 'information';

const VALID_TABS = new Set<ContactInfoTab>([DESK_COPILOT_TAB, INFORMATION_TAB]);

function readStoredTab(): ContactInfoTab {
  const storedTab = moduleStorage.getItem(
    CONTACT_INFO_ACTIVE_TAB_KEY,
    DESK_COPILOT_TAB,
  );

  if (
    typeof storedTab !== 'string' ||
    !VALID_TABS.has(storedTab as ContactInfoTab)
  ) {
    return DESK_COPILOT_TAB;
  }

  return storedTab as ContactInfoTab;
}

const activeTab: Ref<ContactInfoTab> = ref(readStoredTab());

export function openDeskCopilotTab() {
  activeTab.value = DESK_COPILOT_TAB;
  moduleStorage.setItem(CONTACT_INFO_ACTIVE_TAB_KEY, DESK_COPILOT_TAB);
}

export function shouldOpenDeskCopilotAfterTakeOver(
  room?: { queue?: { sector?: string } } | null,
): boolean {
  if (isMobile()) {
    return false;
  }

  const { featureFlags } = useFeatureFlag();
  if (!useAssistedSalesFeatureFlag(featureFlags)) {
    return false;
  }

  const { project } = useConfig();
  if (project?.config?.hide_desk_copilot_tab) {
    return false;
  }

  return isCopilotConnectionConfigured(room);
}

export function useContactInfoTab(
  showDeskCopilotTab: MaybeRefOrGetter<boolean>,
) {
  activeTab.value = readStoredTab();

  const isDeskCopilotVisible = computed(() => !!toValue(showDeskCopilotTab));

  watch(activeTab, (tab) => {
    moduleStorage.setItem(CONTACT_INFO_ACTIVE_TAB_KEY, tab);
  });

  watch(
    isDeskCopilotVisible,
    (isVisible) => {
      if (!isVisible && activeTab.value === DESK_COPILOT_TAB) {
        activeTab.value = INFORMATION_TAB;
      }
    },
    { immediate: true },
  );

  return {
    activeTab,
    openDeskCopilotTab,
  };
}
