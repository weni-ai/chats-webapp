<template>
  <section class="groups-list">
    <UnnnicCard
      type="blank"
      :text="$t('config_chats.new_group')"
      icon="add"
      class="groups__new-card"
      @click="openNewGroupDrawer()"
    />
    <UnnnicSimpleCard
      v-for="group in groups"
      :key="group.id"
      :title="group.name"
      clickable
      class="groups__card"
      @click="openEditGroupDrawer(group)"
    >
      <template #headerSlot>
        <UnnnicDropdown position="top-left">
          <template #trigger>
            <UnnnicToolTip
              enabled
              :text="$t('config_chats.groups.delete_or_edit')"
              side="left"
            >
              <UnnnicButton
                iconCenter="more_vert"
                type="tertiary"
                data-testid="open-dropdown-menu-button"
              />
            </UnnnicToolTip>
          </template>
          <UnnnicDropdownItem @click="openEditGroupDrawer(group)">
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
            @click.stop="openDeleteGroupModal(group)"
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
    <NewGroupDrawer
      v-if="showNewGroupDrawer"
      :show="showNewGroupDrawer"
      @close="closeNewGroupDrawer()"
    />
    <EditGroupDrawer
      v-if="showEditGroupDrawer"
      :projectGroup="editGroup"
      :show="showEditGroupDrawer"
      @close="closeEditGroupDrawer()"
    />
    <DeleteGroupModal
      v-if="showDeleteGroupModal"
      v-model="showDeleteGroupModal"
      :group="deleteGroup"
      @close="closeDeleteGroupModal"
    />
  </section>
</template>

<script>
import { useSettings } from '@/store/modules/settings';
import { mapState } from 'pinia';
import NewGroupDrawer from './Groups/New.vue';
import EditGroupDrawer from './Groups/Edit.vue';
import DeleteGroupModal from './Groups/DeleteGroupModal.vue';
export default {
  name: 'SettingsGroups',

  components: {
    NewGroupDrawer,
    EditGroupDrawer,
    DeleteGroupModal,
  },

  data() {
    return {
      showNewGroupDrawer: false,
      showEditGroupDrawer: false,
      showDeleteGroupModal: false,
      deleteGroup: null,
      editGroup: null,
    };
  },

  computed: {
    ...mapState(useSettings, ['groups']),
  },

  methods: {
    handleConnectOverlay(active) {
      window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
    },
    openNewGroupDrawer() {
      this.handleConnectOverlay(true);
      this.showNewGroupDrawer = true;
    },
    closeNewGroupDrawer() {
      this.handleConnectOverlay(false);
      this.showNewGroupDrawer = false;
    },
    openEditGroupDrawer(group) {
      this.editGroup = group;
      this.handleConnectOverlay(true);
      this.showEditGroupDrawer = true;
    },
    closeEditGroupDrawer() {
      this.handleConnectOverlay(false);
      this.showEditGroupDrawer = false;
      this.editGroup = null;
    },
    openDeleteGroupModal(group) {
      this.handleConnectOverlay(true);
      this.deleteGroup = group;
      this.showDeleteGroupModal = true;
    },
    closeDeleteGroupModal() {
      this.handleConnectOverlay(false);
      this.deleteGroup = null;
      this.showDeleteGroupModal = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.groups-list {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: $unnnic-spacing-sm;
}

.groups__new-card:hover {
  box-shadow: $unnnic-shadow-level-far;
}
.groups__new-card:active {
  border: 1px solid $unnnic-color-neutral-cleanest;
}

.groups {
  &__new-card {
    min-height: 120px;
    :deep(.unnnic-card-blank__content) {
      flex-direction: row;
    }
    :deep(.unnnic-card-blank__content__icon) {
      font-size: $unnnic-font-size-title-md;
    }
  }
  &__card {
    min-height: 120px;
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
</style>
