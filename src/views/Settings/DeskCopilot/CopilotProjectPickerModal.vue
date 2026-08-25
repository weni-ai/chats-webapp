<template>
  <UnnnicDialog
    v-model:open="isOpen"
    data-testid="copilot-project-picker-modal"
  >
    <UnnnicDialogContent size="medium">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle data-testid="copilot-project-picker-title">
          {{ $t(titleKey) }}
        </UnnnicDialogTitle>
        <UnnnicDialogClose
          data-testid="copilot-project-picker-close"
          @click="close"
        />
      </UnnnicDialogHeader>

      <section class="copilot-project-picker-modal__body">
        <UnnnicInput
          v-model="searchTerm"
          iconLeft="search-1"
          :placeholder="
            $t('config_chats.desk_copilot.picker_modal.search_placeholder')
          "
          data-testid="copilot-project-picker-search"
        />

        <ul
          ref="listRef"
          class="copilot-project-picker-modal__list"
          :class="{
            'copilot-project-picker-modal__list--scrollable': hasOverflow,
          }"
          data-testid="copilot-project-picker-list"
        >
          <li
            v-for="item in filteredProjects"
            :key="item.uuid"
            class="copilot-project-picker-modal__option"
            :class="{
              'copilot-project-picker-modal__option--selected':
                selectedUuid === item.uuid,
            }"
            :data-testid="`copilot-project-picker-option-${item.uuid}`"
            @click="selectedUuid = item.uuid"
          >
            <UnnnicRadio
              :modelValue="selectedUuid"
              :value="item.uuid"
              size="md"
              @update:model-value="selectedUuid = $event"
            >
              {{ item.name }}
            </UnnnicRadio>
            <UnnnicTag
              :text="
                $t(
                  'config_chats.desk_copilot.picker_modal.assigned_agents_tag',
                  { count: item.assignedAgents },
                )
              "
              type="next"
              scheme="bg-blue-plain"
            />
          </li>
        </ul>
      </section>

      <UnnnicDialogFooter>
        <UnnnicButton
          type="tertiary"
          :text="$t('cancel')"
          data-testid="copilot-project-picker-cancel"
          @click="close"
        />
        <UnnnicButton
          type="primary"
          :text="$t(submitLabelKey)"
          :loading="isSaving"
          :disabled="!canSubmit"
          data-testid="copilot-project-picker-submit"
          @click="submit"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue';

import { useCopilotProject } from '@/composables/useCopilotProject';
import { useCopilotProjectsList } from '@/composables/useCopilotProjectsList';
import { buildCopilotProjectUrl } from '@/utils/copilotProject';
import callUnnnicAlert from '@/utils/callUnnnicAlert';
import i18n from '@/plugins/i18n';

defineOptions({
  name: 'CopilotProjectPickerModal',
});

const props = withDefaults(
  defineProps<{
    modelValue: boolean;
    mode?: 'connect' | 'change';
  }>(),
  {
    mode: 'connect',
  },
);

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
}>();

const { linkedProject, changeLinkedProject } = useCopilotProject();
const { projects } = useCopilotProjectsList();

const searchTerm = ref('');
const selectedUuid = ref('');
const isSaving = ref(false);
const listRef = ref<HTMLElement | null>(null);
const hasOverflow = ref(false);

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const isChangeMode = computed(() => props.mode === 'change');

const titleKey = computed(() =>
  isChangeMode.value
    ? 'config_chats.desk_copilot.picker_modal.change_title'
    : 'config_chats.desk_copilot.picker_modal.select_title',
);

const submitLabelKey = computed(() =>
  isChangeMode.value
    ? 'config_chats.desk_copilot.picker_modal.change_button'
    : 'config_chats.desk_copilot.picker_modal.connect_button',
);

const filteredProjects = computed(() => {
  const query = searchTerm.value.trim().toLowerCase();

  if (!query) return projects.value;

  return projects.value.filter((item) =>
    item.name.toLowerCase().includes(query),
  );
});

const canSubmit = computed(() => {
  if (!selectedUuid.value || isSaving.value) return false;

  if (isChangeMode.value && selectedUuid.value === linkedProject.value?.uuid) {
    return false;
  }

  return true;
});

function updateListOverflow() {
  const list = listRef.value;
  hasOverflow.value = !!list && list.scrollHeight > list.clientHeight;
}

watch(
  () => props.modelValue,
  (isVisible) => {
    if (!isVisible) return;

    searchTerm.value = '';
    selectedUuid.value = isChangeMode.value
      ? (linkedProject.value?.uuid ?? '')
      : '';
    nextTick(updateListOverflow);
  },
  { immediate: true },
);

watch(filteredProjects, () => {
  nextTick(updateListOverflow);
});

function close() {
  isOpen.value = false;
}

async function submit() {
  if (!canSubmit.value) return;

  isSaving.value = true;
  try {
    const updatedProject = await changeLinkedProject(selectedUuid.value);

    callUnnnicAlert({
      props: {
        text: i18n.global.t(
          isChangeMode.value
            ? 'config_chats.desk_copilot.picker_modal.change_success'
            : 'config_chats.desk_copilot.picker_modal.connect_success',
        ),
        type: 'success',
      },
      seconds: 5,
    });

    if (!isChangeMode.value) {
      window.open(
        buildCopilotProjectUrl(updatedProject.uuid),
        '_blank',
        'noopener,noreferrer',
      );
    }

    close();
  } catch {
    callUnnnicAlert({
      props: {
        text: i18n.global.t(
          isChangeMode.value
            ? 'config_chats.desk_copilot.picker_modal.change_error'
            : 'config_chats.desk_copilot.picker_modal.connect_error',
        ),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isSaving.value = false;
  }
}

defineExpose({
  searchTerm,
  selectedUuid,
  isSaving,
  isOpen,
  submit,
});
</script>

<style lang="scss" scoped>
.copilot-project-picker-modal {
  &__body {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    max-height: 320px;
    overflow-y: auto;
    margin: 0;
    padding: 0;
    list-style: none;

    &--scrollable {
      padding-right: $unnnic-space-2;
    }
  }

  &__option {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $unnnic-space-2;
    padding: $unnnic-space-4;
    border: 1px solid $unnnic-color-border-base;
    border-radius: $unnnic-radius-2;
    background-color: $unnnic-color-bg-base;
    cursor: pointer;

    :deep(.unnnic-radio) {
      flex: 1;
      min-width: 0;
    }
  }
}
</style>
