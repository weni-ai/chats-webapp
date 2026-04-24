<template>
  <section
    v-if="sectors.length === 0"
    class="settings-sectors--empty"
  >
    <UnnnicIconLoading
      v-if="isLoadingSectors"
      size="lg"
    />
    <template v-else>
      <h1 class="settings-sectors--empty__title">
        {{ $t('config_chats.empty_sectors.title') }}
      </h1>
      <p class="settings-sectors--empty__subtitle">
        {{ $t('config_chats.empty_sectors.subtitle') }}
      </p>
      <UnnnicButton
        :text="$t('config_chats.empty_sectors.action')"
        type="primary"
        @click="emit('open-new-sector-modal')"
      />
    </template>
  </section>
  <section
    v-else
    class="settings-sectors"
  >
    <p class="settings-sectors__title">
      {{ $t('config_chats.section_sectors_title') }}
    </p>
    <section class="settings-sectors__container">
      <section class="settings-sectors__filters">
        <UnnnicInput
          v-model="sectorNameFilter"
          class="settings-sectors__filters__name"
          iconLeft="search-1"
          size="md"
          :label="$t('config_chats.filter_by_sector_name')"
          :placeholder="$t('type_to_filter')"
        />
        <ListOrdinator
          v-model="sectorOrder"
          :label="$t('order_by.label')"
        />
      </section>
      <section class="settings-sectors__sectors-list">
        <SectorCard
          v-for="sector in sectorsOrdered"
          :key="sector.id"
          :sector="sector"
          @click="
            navigate('sectors.edit', { uuid: sector.uuid }, { tab: 'general' })
          "
          @delete="handlerOpenDeleteSectorModal"
        />
      </section>

      <section
        v-if="isLoadingSectors"
        data-testid="settings-sectors-loading-section"
        class="settings-sectors__loading-sectors"
      >
        <img
          src="@/assets/LogoWeniAnimada4.svg"
          width="40"
        />
      </section>
    </section>
    <ModalDeleteWithTransfer
      v-if="showDeleteSectorModal"
      v-model="showDeleteSectorModal"
      data-testid="modal-delete-sector"
      type="sector"
      :name="toDeleteSector.name"
      :excludeSectorUuid="toDeleteSector.uuid"
      :inProgressChatsCount="sectorRoomsCount"
      :isLoading="isLoadingDeleteSector"
      @confirm="handlerDeleteSector(toDeleteSector.uuid, $event)"
      @cancel="handlerCloseDeleteSectorModal()"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { storeToRefs } from 'pinia';

import ModalDeleteWithTransfer from '@/components/ModalDeleteWithTransfer.vue';
import ListOrdinator from '@/components/ListOrdinator.vue';
import SectorCard from './SectorCard.vue';

import Rooms from '@/services/api/resources/settings/rooms';
import { useSettings } from '@/store/modules/settings';

import Sector from '@/services/api/resources/settings/sector';

import { UnnnicCallAlert } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'SettingsSectors',
});

const { t } = i18n.global;
const router = useRouter();

const emit = defineEmits<{
  'open-new-sector-modal': [void];
}>();

const showDeleteSectorModal = ref(false);
const sectorNameFilter = ref('');
const sectorOrder = ref('alphabetical');
const toDeleteSector = ref<{ uuid: string; name: string }>({
  uuid: '',
  name: '',
});
const sectorRoomsCount = ref(0);
const isLoadingDeleteSector = ref(false);

const settingsStore = useSettings();
const { sectors, isLoadingSectors } = storeToRefs(settingsStore);
const { getSectors, deleteSector } = settingsStore;

const sectorsOrdered = computed(() => {
  let sectorsOrdered = sectors.value.slice().sort((a, b) => {
    let first = null;
    let second = null;

    if (sectorOrder.value === 'alphabetical') {
      first = a.name.toLowerCase();
      second = b.name.toLowerCase();
    } else if (sectorOrder.value === 'newer') {
      first = new Date(b.created_on).getTime();
      second = new Date(a.created_on).getTime();
    } else if (sectorOrder.value === 'older') {
      first = new Date(a.created_on).getTime();
      second = new Date(b.created_on).getTime();
    }

    return first === second ? 0 : first > second ? 1 : -1;
  });

  return sectorNameFilter.value.trim()
    ? sectorsOrdered.filter(({ name }) =>
        name
          .toLowerCase()
          .includes(sectorNameFilter.value.trim().toLowerCase()),
      )
    : sectorsOrdered;
});

onMounted(() => {
  getSectors(true, true);
});

const handlerOpenDeleteSectorModal = async (sector) => {
  toDeleteSector.value = sector;
  handleConnectOverlay(true);
  try {
    const { waiting, in_service } = await Rooms.count({
      sector: sector.uuid,
    });
    sectorRoomsCount.value = waiting + in_service;
  } catch {
    sectorRoomsCount.value = 0;
  }

  showDeleteSectorModal.value = true;
};

const handlerCloseDeleteSectorModal = () => {
  toDeleteSector.value = { uuid: '', name: '' };
  handleConnectOverlay(false);
  showDeleteSectorModal.value = false;
};

const handlerDeleteSector = async (sectorUuid, transferPayload) => {
  try {
    isLoadingDeleteSector.value = true;

    const options: Record<string, any> = {};

    if (transferPayload.action === 'transfer') {
      options.transferToQueue = transferPayload.transferQueueUuid;
    } else if (transferPayload.action === 'end_all') {
      options.endAllChats = true;
    }

    await deleteSector(sectorUuid, options);

    router.push({ name: 'sectors' });

    UnnnicCallAlert({
      props: {
        text: t('delete_modal.sector_success'),
        type: 'success',
      },
      seconds: 5,
    });
  } catch (error) {
    const isTransferConflict = error?.response?.status === 409;
    UnnnicCallAlert({
      props: {
        text: isTransferConflict
          ? t('delete_modal.transfer_error_sector')
          : t('delete_modal.sector_error'),
        type: 'error',
      },
      seconds: 5,
    });
  } finally {
    isLoadingDeleteSector.value = false;
    showDeleteSectorModal.value = false;
    handleConnectOverlay(false);
  }
};

const handleConnectOverlay = (active) => {
  window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
};

const navigate = (name, params, query = {}) => {
  router.push({
    name,
    params,
    query,
  });
};
</script>

<style lang="scss" scoped>
.settings-sectors {
  display: flex;
  flex-direction: column;

  &--empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: $unnnic-space-3;
    height: 80vh;

    &__title {
      font: $unnnic-font-display-2;
      color: $unnnic-color-fg-emphasized;
    }
    &__subtitle {
      font: $unnnic-font-emphasis;
      color: $unnnic-color-fg-base;
    }
  }

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    margin-bottom: $unnnic-space-4;
  }

  &__container {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-6;
  }

  &__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $unnnic-space-4 $unnnic-space-6;

    &__name {
      flex: 1;
    }
  }

  &__sectors-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-space-4;
  }

  &__loading-sectors {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $unnnic-space-4;
  }

  .dropdown-item-content {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;

    white-space: nowrap;

    &__delete {
      color: $unnnic-color-fg-critical;
    }
  }
}
</style>
