<template>
  <section
    v-if="currentSector"
    class="sector-edit"
  >
    <UnnnicPageHeader
      :title="currentSector.name"
      hasBackButton
      @back="router.push('/settings/')"
    >
      <template #actions>
        <UnnnicButton
          v-if="['general', 'extra_options'].includes(activeTab?.id)"
          :text="$t('save_changes')"
          :disabled="!hasChanges || !isValid"
          @click="handleSaveChanges"
        />
        <UnnnicButton
          v-if="activeTab?.id === 'quick_messages'"
          iconLeft="add"
          :text="$t('quick_messages.new')"
          @click="listSectorMessagesRef?.openConfigMessageDrawer()"
        />
        <UnnnicButton
          v-if="activeTab?.id === 'queues'"
          iconLeft="add"
          :text="$t('config_chats.queues.add_queue')"
          @click="listSectorQueuesRef?.openConfigQueueDrawer()"
        />
      </template>
      <template #tabs>
        <UnnnicTabs
          defaultValue="general"
          :modelValue="activeTab?.id"
          @update:model-value="updateTab"
        >
          <UnnnicTabsList>
            <UnnnicTabsTrigger
              v-for="tab in tabs"
              :key="tab.id"
              :value="tab.id"
            >
              {{ tab.name }}
            </UnnnicTabsTrigger>
          </UnnnicTabsList>
          <UnnnicTabsContent value="general">
            <section class="sector-edit__content">
              <FormSectorGeneral
                v-if="sector.uuid"
                v-model="sector"
                isEditing
                data-testid="general-form"
                @change-is-valid="validGeneralForm = $event"
                @has-changes-workday="hasChangesWorkday = $event"
                @sector-form-initial-sync="syncFormBaselinesAfterChildren"
              />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="queues">
            <section class="sector-edit__content">
              <ListSectorQueues
                v-if="sector.uuid"
                ref="listSectorQueues"
                :sector="sector"
                :data-testid="`sector-queues-list`"
              />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="extra_options">
            <section class="sector-edit__content">
              <FormSectorExtraOptions
                v-if="sector.uuid"
                v-model="sector"
                data-testid="extra-options-form"
                isEditing
                @change-is-valid="validExtraOptionsForm = $event"
              />
            </section>
          </UnnnicTabsContent>
          <UnnnicTabsContent value="quick_messages">
            <section class="sector-edit__content">
              <ListSectorMessages
                v-if="sector.uuid"
                ref="listSectorMessages"
                data-testid="sector-quick-messages-list"
                :sector="sector"
              />
            </section>
          </UnnnicTabsContent>
        </UnnnicTabs>
      </template>
    </UnnnicPageHeader>
  </section>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  ref,
  useTemplateRef,
  watch,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useRoute, useRouter } from 'vue-router';

import { useSettings } from '@/store/modules/settings';
import { useConfig } from '@/store/modules/config';

import FormSectorGeneral from '@/views/Settings/Forms/General.vue';
import FormSectorExtraOptions from '@/views/Settings/Forms/ExtraOptions.vue';
import ListSectorQueues from '@/views/Settings/Lists/ListSectorQueues/index.vue';
import ListSectorMessages from '@/views/Settings/Lists/ListSectorMessages/index.vue';

import i18n from '@/plugins/i18n';

import { useForm } from '@/composables/useForm';

import type { Sector } from '@/types/Sector';

defineOptions({
  name: 'EditSectorView',
});

const { t } = i18n.global;

const router = useRouter();
const route = useRoute();

const settingsStore = useSettings();
const { getCurrentSector } = settingsStore;
const { currentSector } = storeToRefs(settingsStore);

const configStore = useConfig();
const { setCopilotActive, setCopilotCustomRulesActive, setCopilotCustomRules } =
  configStore;

const listSectorMessagesRef = useTemplateRef('listSectorMessages');
const listSectorQueuesRef = useTemplateRef('listSectorQueues');

const activeTab = ref<{ name: string; id: string } | null>(null);

const sector = ref<Sector>({
  uuid: '',
  name: '',
  config: {} as Record<string, any>,
  can_trigger_flows: false,
  can_edit_custom_fields: false,
  automatic_message: {
    is_active: false,
    text: '',
  },
  sign_messages: false,
  rooms_limit: 0,
  required_tags: false,
  is_csat_enabled: false,
  managers: [],
});

const validExtraOptionsForm = ref(false);
const validGeneralForm = ref(false);
const hasChangesWorkday = ref(false);

const {
  hasChanges: sectorDirty,
  isValid,
  resetBaseline,
} = useForm({
  source: sector,
  ignorePaths: ['managers'],
  validate: () => {
    const tabId = activeTab.value?.id;
    if (tabId === 'general') {
      return validGeneralForm.value;
    }
    if (tabId === 'extra_options') {
      return validExtraOptionsForm.value;
    }
    return true;
  },
});

const hasChanges = computed(() => sectorDirty.value || hasChangesWorkday.value);

const tabs = computed(() => [
  { name: t('sector.general'), id: 'general' },
  { name: t('sector.queues'), id: 'queues' },
  { name: t('sector.extra_options'), id: 'extra_options' },
  { name: t('quick_message'), id: 'quick_messages' },
]);

const updateTab = (newTab: string) => {
  const newActiveTab = tabs.value.find((tab) =>
    [tab.name, tab.id].includes(newTab),
  );

  if (!newActiveTab) return;

  activeTab.value = newActiveTab;

  if (activeTab.value) {
    router.replace({
      name: route.name,
      query: {
        tab: activeTab.value.id,
      },
    });
  }
};

const syncFormBaselinesAfterChildren = async () => {
  nextTick(() => resetBaseline());
};

const handlerSectorData = async () => {
  const {
    name,
    can_trigger_flows,
    can_edit_custom_fields,
    config,
    sign_messages,
    rooms_limit,
    uuid,
    automatic_message,
    required_tags,
    is_csat_enabled,
  } = currentSector.value;
  sector.value = {
    ...sector.value,
    uuid,
    name,
    can_trigger_flows,
    can_edit_custom_fields,
    config,
    sign_messages,
    rooms_limit: rooms_limit.toString(),
    automatic_message,
    required_tags,
    is_csat_enabled,
  };
  setCopilotActive(sector.value.config?.can_use_chat_completion);
  setCopilotCustomRulesActive(sector.value.config?.can_input_context);
  setCopilotCustomRules(sector.value.config?.completion_context);

  await syncFormBaselinesAfterChildren();
};

const handleSaveChanges = () => {
  console.log('save changes');
};

onMounted(async () => {
  const { params, query } = route;

  await getCurrentSector(params.uuid);

  updateTab(query.tab as string);
});

onUnmounted(() => {
  currentSector.value = null;
});

watch(currentSector, (sector) => {
  if (sector) handlerSectorData();
});
</script>

<style lang="scss" scoped>
.sector-edit {
  display: grid;
  gap: $unnnic-space-4;
  padding: $unnnic-space-4;
  &__content {
    margin-top: $unnnic-space-6;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
    width: 100%;
    overflow-y: auto;
  }
}
</style>
