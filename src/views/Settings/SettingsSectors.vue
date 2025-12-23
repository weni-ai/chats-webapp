<template>
  <SettingsSectionHeader
    data-testid="settings-sectors-header"
    :title="$t('config_chats.section_sectors_title', { project: projectName })"
    :subtitle="$t('config_chats.section_sectors_subtitle')"
  />
  <section class="settings-sectors__filters">
    <UnnnicInput
      v-model="sectorNameFilter"
      class="settings-sectors__filters__name"
      iconLeft="search-1"
      size="md"
      :placeholder="$t('search')"
    />
    <ListOrdinator
      v-model="sectorOrder"
      :label="$t('order_by.label')"
    />
  </section>

  <section class="settings-view__sectors">
    <UnnnicCard
      data-testid="settings-sectors-blank-card"
      type="blank"
      :text="$t('config_chats.new_sector')"
      icon="add"
      class="sectors__new-sector-card"
      @click="openNewSectorModal()"
    />

    <UnnnicSimpleCard
      v-for="sector in sectorsOrdered"
      :key="sector.id"
      :title="sector.name"
      clickable
      class="sectors__card"
      data-testid="settings-sectors-sector-card"
      @click="navigate('sectors.edit', { uuid: sector.uuid })"
    >
      <template #headerSlot>
        <UnnnicDropdown position="top-left">
          <template #trigger>
            <UnnnicToolTip
              enabled
              :text="$t('quick_messages.delete_or_edit')"
              side="left"
            >
              <UnnnicButton
                iconCenter="more_vert"
                type="tertiary"
                data-testid="open-dropdown-menu-button"
              />
            </UnnnicToolTip>
          </template>
          <UnnnicDropdownItem
            data-testid="dropdown-edit"
            @click="navigate('sectors.edit', { uuid: sector.uuid })"
          >
            <section class="dropdown-item-content">
              <UnnnicIconSvg
                class="icon"
                icon="edit_square"
                size="sm"
              />
              <p>{{ $t('edit') }}</p>
            </section>
          </UnnnicDropdownItem>
          <UnnnicDropdownItem
            data-testid="dropdown-delete"
            @click.stop="handlerOpenDeleteSectorModal(sector)"
          >
            <section
              class="dropdown-item-content dropdown-item-content__delete"
            >
              <UnnnicIconSvg
                class="icon"
                icon="delete"
                size="sm"
                scheme="danger"
              />
              <p>{{ $t('exclude') }}</p>
            </section>
          </UnnnicDropdownItem>
        </UnnnicDropdown>
      </template>
    </UnnnicSimpleCard>
  </section>

  <section
    v-if="isLoadingSectors"
    data-testid="settings-sectors-loading-section"
    class="settings-view__loading-sectors"
  >
    <img
      src="@/assets/LogoWeniAnimada4.svg"
      width="40"
    />
  </section>
  <NewSectorDrawer
    v-if="showNewSectorModal"
    v-model="showNewSectorModal"
    data-testid="new-sector-drawer"
    @close="closeNewSectorModal()"
  />
  <UnnnicModalNext
    v-if="showDeleteSectorModal"
    type="alert"
    icon="alert-circle-1"
    scheme="feedback-red"
    :title="$t('delete_sector') + ` ${toDeleteSector.name}`"
    :description="$t('cant_revert')"
    :validate="`${toDeleteSector.name}`"
    :validatePlaceholder="`${toDeleteSector.name}`"
    :validateLabel="
      $t('confirm_typing') + ` &quot;${toDeleteSector.name}&quot;`
    "
    :actionPrimaryLabel="$t('confirm')"
    :actionSecondaryLabel="$t('cancel')"
    data-testid="modal-delete-sector"
    @click-action-primary="deleteSector(toDeleteSector.uuid)"
    @click-action-secondary="handlerCloseDeleteSectorModal()"
  />
</template>

<script>
import unnnic from '@weni/unnnic-system';
import { mapActions, mapState } from 'pinia';

import { useConfig } from '@/store/modules/config';
import { useSettings } from '@/store/modules/settings';

import SettingsSectionHeader from './SettingsSectionHeader.vue';

import NewSectorDrawer from './Sectors/New/NewSectorDrawer.vue';
import ListOrdinator from '@/components/settings/ListOrdinator.vue';

export default {
  name: 'SettingsSectors',

  components: {
    SettingsSectionHeader,
    NewSectorDrawer,
    ListOrdinator,
  },

  data() {
    return {
      showNewSectorModal: false,
      showDeleteSectorModal: false,
      sectorNameFilter: '',
      sectorOrder: 'alphabetical',
      toDeleteSector: {},
    };
  },

  computed: {
    ...mapState(useConfig, {
      projectName: (store) => store.project.name,
    }),
    ...mapState(useSettings, ['sectors', 'isLoadingSectors']),

    sectorsOrdered() {
      let sectorsOrdered = this.sectors.slice().sort((a, b) => {
        let first = null;
        let second = null;

        if (this.sectorOrder === 'alphabetical') {
          first = a.name.toLowerCase();
          second = b.name.toLowerCase();
        } else if (this.sectorOrder === 'newer') {
          first = new Date(b.created_on).getTime();
          second = new Date(a.created_on).getTime();
        } else if (this.sectorOrder === 'older') {
          first = new Date(a.created_on).getTime();
          second = new Date(b.created_on).getTime();
        }

        return first === second ? 0 : first > second ? 1 : -1;
      });

      return this.sectorNameFilter.trim()
        ? sectorsOrdered.filter(({ name }) =>
            name
              .toLowerCase()
              .includes(this.sectorNameFilter.trim().toLowerCase()),
          )
        : sectorsOrdered;
    },
  },

  methods: {
    ...mapActions(useSettings, {
      actionDeleteSector: 'deleteSector',
    }),
    handlerOpenDeleteSectorModal(sector) {
      this.toDeleteSector = sector;
      this.handleConnectOverlay(true);
      this.showDeleteSectorModal = true;
    },

    handlerCloseDeleteSectorModal() {
      this.toDeleteSector = {};
      this.handleConnectOverlay(false);
      this.showDeleteSectorModal = false;
    },

    async deleteSector(sectorUuid) {
      try {
        await this.actionDeleteSector(sectorUuid);

        this.$router.push({ name: 'sectors' });
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('sector_deleted_success'),
            type: 'success',
          },
          seconds: 5,
        });
      } catch (error) {
        console.log(error);
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('sector_delete_error'),
            type: 'error',
          },
          seconds: 5,
        });
      } finally {
        this.showDeleteSectorModal = false;
        this.handleConnectOverlay(false);
      }
    },
    handleConnectOverlay(active) {
      window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
    },
    openNewSectorModal() {
      setTimeout(() => {
        this.handleConnectOverlay(true);
      }, 1);
      this.showNewSectorModal = true;
    },
    closeNewSectorModal() {
      setTimeout(() => {
        this.handleConnectOverlay(false);
      }, 1);
      this.showNewSectorModal = false;
    },
    navigate(name, params) {
      this.$router.push({
        name,
        params,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.settings-sectors {
  &__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $unnnic-spacing-stack-sm $unnnic-spacing-inline-md;

    &__name {
      flex: 1;
    }
  }
}
.settings-view {
  &__sectors {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: $unnnic-spacing-sm;

    .sectors__card {
      min-height: 120px;

      :deep(.unnnic-simple-card-header-container__title) {
        color: $unnnic-color-neutral-darkest;
      }
    }
  }

  .sectors__new-sector-card:hover {
    box-shadow: $unnnic-shadow-level-far;
  }
  .sectors__new-sector-card:active {
    border: 1px solid $unnnic-color-neutral-cleanest;
  }
  .sectors__new-sector-card {
    min-height: 120px;
    :deep(.unnnic-card-blank__content) {
      flex-direction: row;
    }
    :deep(.unnnic-card-blank__content__icon) {
      font-size: $unnnic-font-size-title-md;
    }
  }

  .dropdown-item-content {
    display: flex;
    align-items: center;
    gap: $unnnic-spacing-xs;

    white-space: nowrap;

    &__delete {
      color: red;
    }
  }

  &__loading-sectors {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: $unnnic-spacing-sm;
  }
}
</style>
