<template>
  <section
    v-if="!isLoadingCustomBreaks"
    class="custom-breaks"
  >
    <section class="custom-breaks__header">
      <p class="custom-breaks__header__title">
        {{ $t('config_chats.custom_breaks.title') }}
      </p>
      <UnnnicToolTip
        :text="$t('config_chats.custom_breaks.description')"
        side="right"
        enabled
      >
        <section class="custom-breaks__header__tooltip">
          <UnnnicIcon
            icon="ri:question-line"
            scheme="gray-7"
            size="sm"
          />
        </section>
      </UnnnicToolTip>
    </section>
    <section class="custom-breaks__container">
      <UnnnicInput
        v-model="customBreakName"
        class="custom-breaks__input"
        :label="$t('config_chats.custom_breaks.fields.name')"
        :placeholder="$t('config_chats.custom_breaks.fields.placeholder')"
        :message="$t('config_chats.custom_breaks.fields.hint')"
        :disabled="isLimitReached"
        @keypress.enter.stop="addCustomBreak"
      />
      <UnnnicButton
        class="custom-breaks__add-button"
        :text="$t('add')"
        :disabled="disabledAddCustomBreak"
        @click="addCustomBreak"
      />
    </section>
    <section
      v-if="hasCustomBreaks"
      class="custom-breaks__list"
    >
      <TagGroup
        :tags="orderedCustomBreaks"
        disabledTag
        hasCloseIcon
        @close="openDeleteCustomBreakModal"
      />
    </section>
    <ProjectOption
      v-model="project.config.can_see_timer"
      :name="configShowAgentStatusCountTimer"
      :disabled="!hasCustomBreaks"
    />
    <DeleteCustomBreakModal
      v-if="toDeleteCustomBreak"
      v-model="showDeleteCustomBreakModal"
      :customBreak="toDeleteCustomBreak"
      @close="closeDeleteCustomBreakModal"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';
import { UnnnicCallAlert } from '@weni/unnnic-system';

import { useSettings } from '@/store/modules/settings';
import { useConfig } from '@/store/modules/config';

import TagGroup from '@/components/TagGroup.vue';
import DeleteCustomBreakModal from './DeleteCustomBreakModal.vue';
import ProjectOption from '../SettingsProjectOptions/SettingsProjectOptionsItem.vue';

import CustomBreakService from '@/services/api/resources/chats/pauseStatus';
import ProjectService from '@/services/api/resources/settings/project';

import i18n from '@/plugins/i18n';

import { CustomBreak } from './types';

defineOptions({
  name: 'CustomBreaks',
});

const { t } = i18n.global;

const settingsStore = useSettings();
const { customBreaks, isLoadingCustomBreaks } = storeToRefs(settingsStore);
const { getCustomBreaks } = settingsStore;

const configStore = useConfig();
const { project } = storeToRefs(configStore);

onMounted(() => {
  getCustomBreaks();
});

const customBreakName = ref('');
const isLoadingAddCustomBreak = ref(false);
const showDeleteCustomBreakModal = ref(false);
const toDeleteCustomBreak = ref<CustomBreak | null>(null);

const hasCustomBreaks = computed(() => {
  return customBreaks.value.length > 0;
});
const isLimitReached = computed(() => {
  return customBreaks.value.length >= 10;
});
const disabledAddCustomBreak = computed(() => {
  const isDuplicate = customBreaks.value.some(
    (customBreak) => customBreak.name === customBreakName.value.trim(),
  );

  return !customBreakName.value.trim() || isDuplicate || isLimitReached.value;
});
const orderedCustomBreaks = computed(() => {
  return [...customBreaks.value].sort((a, b) => a.name.localeCompare(b.name));
});
const configShowAgentStatusCountTimer = computed(() => {
  const showAgentStatusCountTimer = project.value.config.can_see_timer;
  return t(
    `config_chats.project_configs.show_agent_status_count_timer.switch_${
      showAgentStatusCountTimer ? 'active' : 'inactive'
    }`,
  );
});
const addCustomBreak = async () => {
  if (disabledAddCustomBreak.value || isLoadingAddCustomBreak.value) return;
  try {
    isLoadingAddCustomBreak.value = true;
    const data = {
      name: customBreakName.value.trim(),
      project: project.value.uuid,
    };
    const [response] = await CustomBreakService.createCustomStatusType({
      status: data,
    });
    customBreaks.value.push(response);
    UnnnicCallAlert({
      props: {
        text: t('config_chats.custom_breaks.status_success'),
        type: 'success',
      },
      seconds: 5,
    });
    customBreakName.value = '';
  } catch (error) {
    console.error('error add custom break', error);
    UnnnicCallAlert({
      props: {
        text: t('config_chats.custom_breaks.status_error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isLoadingAddCustomBreak.value = false;
  }
};
const openDeleteCustomBreakModal = (customBreak: CustomBreak) => {
  showDeleteCustomBreakModal.value = true;
  toDeleteCustomBreak.value = customBreak;
};
const closeDeleteCustomBreakModal = () => {
  showDeleteCustomBreakModal.value = false;
  toDeleteCustomBreak.value = null;
};

watch(
  () => project.value.config.can_see_timer,
  (newValue, oldValue) => {
    if (oldValue === undefined) return;

    ProjectService.update({
      ...project.value.config,
      can_see_timer: newValue,
    });
  },
);
watch(hasCustomBreaks, (newVal) => {
  if (!newVal) {
    project.value.config.can_see_timer = false;
  }
});
</script>

<style lang="scss" scoped>
.custom-breaks {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  &__header {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    &__title {
      font: $unnnic-font-display-3;
      color: $unnnic-color-fg-emphasized;
    }
    &__tooltip {
      display: flex;
    }
  }
  &__container {
    display: flex;
    gap: $unnnic-space-2;
  }
  &__input {
    flex: 1;
  }
  &__add-button {
    align-self: center;
  }
}
</style>
