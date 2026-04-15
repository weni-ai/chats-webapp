<template>
  <section
    class="sector-card"
    @click="emit('click', props.sector)"
  >
    <section class="sector-card__info">
      <p class="sector-card__title">
        {{ props.sector.name }}
      </p>
    </section>
    <section
      class="sector-card__actions"
      @click.stop
    >
      <UnnnicPopover
        :open="openPopover"
        @update:open="openPopover = $event"
      >
        <UnnnicPopoverTrigger>
          <UnnnicButton
            iconCenter="more_vert"
            type="tertiary"
          />
        </UnnnicPopoverTrigger>
        <UnnnicPopoverContent size="small">
          <UnnnicPopoverOption
            :label="$t('edit')"
            icon="edit_square"
            @click="emitEdit"
          />
          <UnnnicPopoverOption
            :label="$t('delete')"
            icon="delete"
            scheme="fg-critical"
            @click="showModalConfirmDelete()"
          />
        </UnnnicPopoverContent>
      </UnnnicPopover>
    </section>
    <ModalConfirmDelete
      v-if="openModalConfirmDelete"
      v-model="openModalConfirmDelete"
      :title="titleModalConfirmDelete"
      :description="$t('delete_sector') + ` ${props.sector.name}`"
      :confirmText="props.sector.name"
      :isLoading="isLoadingDelete"
      @confirm="handleDeleteSector"
      @cancel="openModalConfirmDelete = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { UnnnicToastManager, UnnnicCallAlert } from '@weni/unnnic-system';

import ModalConfirmDelete from '@/components/ModalConfirmDelete.vue';

import { useSettings } from '@/store/modules/settings';

import type { Sector } from '@/types/Sector';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'SectorCard',
});

interface Props {
  sector: Sector;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  click: [Sector];
  delete: [Sector];
}>();

const settingsStore = useSettings();
const { deleteSector } = settingsStore;

const openPopover = ref(false);
const openModalConfirmDelete = ref(false);
const isLoadingDelete = ref(false);

const titleModalConfirmDelete = computed(() => {
  return `${t('delete')} ${props.sector.name}`;
});

const showModalConfirmDelete = () => {
  openPopover.value = false;
  openModalConfirmDelete.value = true;
};

const emitEdit = () => {
  openPopover.value = false;
  emit('click', props.sector);
};

const handleDeleteSector = async () => {
  try {
    isLoadingDelete.value = true;
    await deleteSector(props.sector.uuid);
    UnnnicCallAlert({
      props: {
        text: t('sector_deleted_success'),
        type: 'success',
      },
    });
    emit('delete', props.sector);
  } catch (error) {
    console.error(error);
    UnnnicToastManager.error(t('sector_delete_error'), '', {
      button: {
        text: t('try_again'),
        action: () => showModalConfirmDelete(),
      },
    });
  } finally {
    openModalConfirmDelete.value = false;
    isLoadingDelete.value = false;
  }
};
</script>

<style lang="scss" scoped>
.sector-card {
  display: flex;
  width: 100%;
  height: 100%;
  padding: $unnnic-space-6;

  border-radius: $unnnic-radius-2;
  border: 1px solid $unnnic-color-border-base;

  cursor: pointer;

  &__info {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
    width: 100%;
  }
  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    flex: 1;
  }
}
</style>
