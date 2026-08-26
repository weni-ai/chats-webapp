<template>
  <AsideSlotTemplate
    class="contact-info-redesign"
    data-testid="contact-info-redesign"
  >
    <template #header>
      <ContactInfoRedesignHeader
        v-model="activeTab"
        :showRefresh="!isHistory"
        :showClose="!isHistory"
        :isRefreshDisabled="isRefreshDisabled"
        :showDeskCopilotTab="showDeskCopilotTab"
        @refresh="emit('refresh')"
        @close="emit('close')"
      />
    </template>

    <DeskCopilotTab
      v-if="activeTab === 'desk_copilot'"
      :isHistory="isHistory"
      :isViewMode="isViewMode"
      @loaded="emit('loaded-medias')"
    />

    <section
      v-else
      class="contact-info-redesign__scrollable"
    >
      <AboutContactCard
        :contactName="contactName"
        :contactNumber="contactNumber"
        :contactPlatform="contactPlatform"
        :isOnline="isOnline"
        :lastMessageText="lastMessageText"
        :customFields="customFields"
        :currentCustomField="currentCustomField"
        :canEditCustomFields="canEditCustomFields"
        :openCustomFields="openCustomFields"
        :isLinkedUser="isLinkedUser"
        :isLinkedToOtherAgent="isLinkedToOtherAgent"
        :linkedUserName="linkedUserName"
        :showLinkSwitch="showLinkSwitch"
        @update:is-linked-user="emit('update:isLinkedUser', $event)"
        @update:open-custom-fields="emit('update:openCustomFields', $event)"
        @update-current-custom-field="
          emit('update-current-custom-field', $event)
        "
        @save-value="emit('save-value')"
      />

      <AboutSupportCard
        :closedRoom="closedRoom"
        :isHistory="isHistory"
        :isViewMode="isViewMode"
      />

      <MediaTabs
        :room="room"
        :history="isHistory"
        :contactInfo="contactInfo"
        @fullscreen="handleFullscreen"
        @loaded-medias="emit('loaded-medias')"
      />
    </section>

    <slot name="previews" />
  </AsideSlotTemplate>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate/index.vue';
import ContactInfoRedesignHeader, { type ContactInfoTab } from './Header.vue';
import AboutContactCard from './AboutContactCard.vue';
import AboutSupportCard from './AboutSupportCard.vue';
import MediaTabs from './MediaTabs.vue';
import DeskCopilotTab from './DeskCopilot/index.vue';
import { moduleStorage } from '@/utils/storage';
import { useConfig } from '@/store/modules/config';

defineOptions({
  name: 'ContactInfoRedesign',
});

const { project } = storeToRefs(useConfig());

const showDeskCopilotTab = computed(
  () => !project.value?.config?.hide_desk_copilot_tab,
);

const CONTACT_INFO_ACTIVE_TAB_KEY = 'contactInfoActiveTab';
const DESK_COPILOT_TAB: ContactInfoTab = 'desk_copilot';
const INFORMATION_TAB: ContactInfoTab = 'information';
const VALID_TABS = new Set<ContactInfoTab>([DESK_COPILOT_TAB, INFORMATION_TAB]);

function getDefaultTab(): ContactInfoTab {
  return showDeskCopilotTab.value ? DESK_COPILOT_TAB : INFORMATION_TAB;
}

function getPersistedTab(): ContactInfoTab {
  const storedTab = moduleStorage.getItem(
    CONTACT_INFO_ACTIVE_TAB_KEY,
    getDefaultTab(),
  );

  if (!VALID_TABS.has(storedTab)) {
    return getDefaultTab();
  }

  if (storedTab === DESK_COPILOT_TAB && !showDeskCopilotTab.value) {
    return INFORMATION_TAB;
  }

  return storedTab;
}

type CustomFields = Record<string, string>;

type Room = {
  uuid?: string;
  [key: string]: unknown;
};

type ClosedRoom = {
  uuid?: string;
  [key: string]: unknown;
};

type ContactInfo = Record<string, unknown>;

type MediaItem = {
  url: string;
  [key: string]: unknown;
};

withDefaults(
  defineProps<{
    room?: Room;
    closedRoom?: ClosedRoom;
    contactInfo?: ContactInfo;
    isHistory?: boolean;
    isViewMode?: boolean;
    isRefreshDisabled?: boolean;
    contactName?: string;
    contactNumber?: string;
    contactPlatform?: string;
    isOnline?: boolean;
    lastMessageText?: string;
    customFields?: CustomFields;
    currentCustomField?: CustomFields;
    canEditCustomFields?: boolean;
    openCustomFields?: boolean;
    isLinkedUser?: boolean;
    isLinkedToOtherAgent?: boolean;
    linkedUserName?: string;
    showLinkSwitch?: boolean;
  }>(),
  {
    room: () => ({}),
    closedRoom: () => ({}),
    contactInfo: () => ({}),
    isHistory: false,
    isViewMode: false,
    isRefreshDisabled: false,
    contactName: '',
    contactNumber: '',
    contactPlatform: '',
    isOnline: false,
    lastMessageText: '',
    customFields: () => ({}),
    currentCustomField: () => ({}),
    canEditCustomFields: false,
    openCustomFields: true,
    isLinkedUser: false,
    isLinkedToOtherAgent: false,
    linkedUserName: '',
    showLinkSwitch: false,
  },
);

const emit = defineEmits<{
  refresh: [];
  close: [];
  'update:isLinkedUser': [value: boolean];
  'update:openCustomFields': [value: boolean];
  'update-current-custom-field': [customField: CustomFields];
  'save-value': [];
  fullscreen: [url: string, images: MediaItem[]];
  'loaded-medias': [];
}>();

const activeTab = ref<ContactInfoTab>(getPersistedTab());

watch(activeTab, (tab) => {
  moduleStorage.setItem(CONTACT_INFO_ACTIVE_TAB_KEY, tab);
});

watch(showDeskCopilotTab, (visible) => {
  if (!visible && activeTab.value === DESK_COPILOT_TAB) {
    activeTab.value = INFORMATION_TAB;
  }
});

const handleFullscreen = (url: string, images: MediaItem[]) => {
  emit('fullscreen', url, images);
};
</script>

<style lang="scss" scoped>
.contact-info-redesign {
  &__scrollable {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    padding: $unnnic-space-2;
    overflow: hidden auto;
    height: 100%;
  }
}
</style>
