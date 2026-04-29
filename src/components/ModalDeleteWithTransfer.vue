<template>
  <UnnnicDialog
    v-model:open="open"
    class="modal-delete-transfer"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader :closeButton="!isLoading">
        <UnnnicDialogTitle>
          <div class="modal-delete-transfer__title">
            <UnnnicIcon
              icon="warning"
              size="md"
              scheme="feedback-red"
            />
            {{ $t('delete_modal.title', { name }) }}
          </div>
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>

      <section class="modal-delete-transfer__body">
        <template v-if="hasActiveChats">
          <p class="modal-delete-transfer__body__description">
            {{
              $t(`delete_modal.description_${type}`, {
                count: inProgressChatsCount,
                name,
              })
            }}
          </p>

          <div class="modal-delete-transfer__body__radios">
            <UnnnicRadio
              :modelValue="selectedAction"
              value="transfer"
              size="md"
              @update:model-value="handleActionChange"
            >
              {{ $t('delete_modal.transfer_chats') }}
            </UnnnicRadio>
            <UnnnicRadio
              :modelValue="selectedAction"
              value="end_all"
              size="md"
              @update:model-value="handleActionChange"
            >
              {{ $t('delete_modal.end_all_chats') }}
            </UnnnicRadio>
          </div>

          <div
            v-if="selectedAction === 'transfer'"
            class="modal-delete-transfer__body__selects"
          >
            <div class="modal-delete-transfer__body__selects__input">
              <UnnnicSelect
                v-model="selectedSector"
                :options="sectorOptions"
                :label="$t('delete_modal.select_sector')"
                :placeholder="$t('search_or_select')"
                returnObject
                clearable
                enableSearch
                :search="searchSector"
                @update:search="searchSector = $event"
              />
            </div>
            <div class="modal-delete-transfer__body__selects__input">
              <UnnnicSelect
                v-model="selectedQueue"
                :disabled="!selectedSector?.value"
                :options="queueOptions"
                :label="$t('delete_modal.select_queue')"
                :placeholder="$t('search_or_select')"
                returnObject
                clearable
                enableSearch
                :search="searchQueue"
                @update:search="searchQueue = $event"
              />
            </div>
          </div>
        </template>

        <div class="modal-delete-transfer__body__confirm">
          <UnnnicInput
            v-model="confirmText"
            :label="$t(`delete_modal.type_name_${type}`)"
            :placeholder="name"
          />
          <p class="modal-delete-transfer__body__confirm__warning">
            {{ $t('delete_modal.cannot_be_reversed') }}
          </p>
        </div>
      </section>

      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          :disabled="isLoading"
          @click="emit('cancel')"
        />
        <UnnnicButton
          :text="$t('delete_modal.delete_button')"
          type="warning"
          :disabled="!isFormValid"
          :loading="isLoading"
          @click="handleConfirm"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup>
import { computed, ref, watch, onMounted } from 'vue';

import Sector from '@/services/api/resources/settings/sector';
import Queue from '@/services/api/resources/settings/queue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  type: {
    type: String,
    required: true,
    validator: (value) => ['sector', 'queue'].includes(value),
  },
  name: {
    type: String,
    required: true,
  },
  inProgressChatsCount: {
    type: Number,
    default: 0,
  },
  isLoading: {
    type: Boolean,
    default: false,
  },
  excludeSectorUuid: {
    type: String,
    default: '',
  },
  excludeQueueUuid: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const open = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const selectedAction = ref('transfer');
const selectedSector = ref(null);
const selectedQueue = ref(null);
const confirmText = ref('');

const sectorOptions = ref([]);
const queueOptions = ref([]);
const searchSector = ref('');
const searchQueue = ref('');

const hasActiveChats = computed(() => props.inProgressChatsCount > 0);

const isFormValid = computed(() => {
  const nameMatches = confirmText.value === props.name;
  if (!nameMatches) return false;

  if (selectedAction.value === 'transfer' && hasActiveChats.value) {
    return !!selectedSector.value?.value && !!selectedQueue.value?.value;
  }

  return true;
});

function handleActionChange(value) {
  selectedAction.value = value;
  if (value === 'end_all') {
    selectedSector.value = null;
    selectedQueue.value = null;
    searchSector.value = '';
    searchQueue.value = '';
  }
}

function handleConfirm() {
  if (!isFormValid.value) return;

  const payload = {};

  if (hasActiveChats.value) {
    payload.action = selectedAction.value;

    if (selectedAction.value === 'transfer') {
      const queueUuid = selectedQueue.value?.value;
      if (!queueUuid) return;

      payload.transferSectorUuid = selectedSector.value?.value;
      payload.transferQueueUuid = queueUuid;
    }
  }

  emit('confirm', payload);
}

async function fetchSectors() {
  try {
    const response = await Sector.list();
    const { results } = response;

    sectorOptions.value = results
      .filter(({ uuid }) => uuid !== props.excludeSectorUuid)
      .map(({ uuid, name }) => ({ value: uuid, label: name }));
  } catch (error) {
    console.error('Failed to load sectors', error);
  }
}

async function fetchQueues(sectorUuid) {
  if (!sectorUuid) {
    queueOptions.value = [];
    return;
  }

  try {
    const response = await Queue.list(sectorUuid);
    const { results } = response;

    queueOptions.value = results
      .filter(({ uuid }) => uuid !== props.excludeQueueUuid)
      .map(({ uuid, name }) => ({ value: uuid, label: name }));
  } catch (error) {
    console.error('Failed to load queues', error);
  }
}

watch(selectedSector, (newSector) => {
  selectedQueue.value = null;
  searchQueue.value = '';

  if (newSector?.value) {
    fetchQueues(newSector.value);
  } else {
    queueOptions.value = [];
  }
});

onMounted(() => {
  if (props.inProgressChatsCount > 0) {
    fetchSectors();
  }
});
</script>

<style lang="scss" scoped>
.modal-delete-transfer {
  &__title {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }

  &__body {
    display: grid;
    gap: $unnnic-space-4;
    text-align: start;
    padding: $unnnic-space-6;

    &__description {
      font: $unnnic-font-body;
      color: $unnnic-color-fg-base;
    }

    &__radios {
      display: flex;
      align-items: center;
      gap: $unnnic-space-4;
    }

    &__selects {
      display: flex;
      gap: $unnnic-space-2;

      &__input {
        flex: 1;
      }
    }

    &__confirm {
      display: grid;
      gap: $unnnic-space-1;

      &__warning {
        font: $unnnic-font-caption-2;
        color: $unnnic-color-fg-base;
      }
    }
  }
}
</style>
