<template>
  <section
    v-if="groups.length === 0"
    class="settings-groups--empty"
  >
    <UnnnicIconLoading
      v-if="isLoadingGroups"
      size="lg"
    />
    <template v-else>
      <h1 class="settings-groups--empty__title">
        {{
          $t('config_chats.empty_groups.title', {
            projectName: project.name,
          })
        }}
      </h1>
      <p class="settings-groups--empty__subtitle">
        {{ $t('config_chats.empty_groups.subtitle') }}
      </p>
      <UnnnicButton
        :text="$t('config_chats.empty_groups.action')"
        type="primary"
        @click="emit('open-new-group-modal')"
      />
    </template>
  </section>
  <section
    v-else
    class="settings-groups"
  >
    <p class="settings-groups__title">
      {{ $t('config_chats.section_groups_title') }}
    </p>
    <section class="settings-groups__container">
      <section class="settings-groups__filters">
        <UnnnicInput
          v-model="groupNameFilter"
          class="settings-groups__filters__name"
          iconLeft="search-1"
          size="md"
          :label="$t('config_chats.filter_by_group_name')"
          :placeholder="$t('type_to_filter')"
        />
        <ListOrdinator
          v-model="groupOrder"
          :label="$t('order_by.label')"
        />
      </section>
      <section class="settings-groups__groups-list">
        <UnnnicSimpleCard
          v-for="group in orderedGroups"
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
      </section>
    </section>
    <EditGroupDrawer
      v-if="showEditGroupDrawer"
      :projectGroup="editGroup"
      :modelValue="showEditGroupDrawer"
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

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { storeToRefs } from 'pinia';

import ListOrdinator from '@/components/ListOrdinator.vue';
import EditGroupDrawer from './Edit.vue';
import DeleteGroupModal from './DeleteGroupModal.vue';

import { useSettings } from '@/store/modules/settings';
import { useConfig } from '@/store/modules/config';

import { handleConnectOverlay } from '@/utils/overlay';

defineOptions({
  name: 'SettingsGroups',
});

const emit = defineEmits<{
  'open-new-group-modal': [void];
}>();

onMounted(() => {
  getGroups(true);
});

const configStore = useConfig();
const { project } = storeToRefs(configStore);

const settingsStore = useSettings();
const { getGroups } = settingsStore;
const { groups, isLoadingGroups } = storeToRefs(settingsStore);

const showEditGroupDrawer = ref(false);
const showDeleteGroupModal = ref(false);
const deleteGroup = ref(null);
const editGroup = ref(null);
const groupNameFilter = ref('');
const groupOrder = ref('alphabetical');

const orderedGroups = computed(() => {
  let groupsOrdered = groups.value.slice().sort((a, b) => {
    let first = null;
    let second = null;

    if (groupOrder.value === 'alphabetical') {
      first = a.name.toLowerCase();
      second = b.name.toLowerCase();
    } else if (groupOrder.value === 'newer') {
      first = new Date(b.created_on).getTime();
      second = new Date(a.created_on).getTime();
    } else if (groupOrder.value === 'older') {
      first = new Date(a.created_on).getTime();
      second = new Date(b.created_on).getTime();
    }

    return first === second ? 0 : first > second ? 1 : -1;
  });

  return groupNameFilter.value.trim()
    ? groupsOrdered.filter(({ name }) =>
        name.toLowerCase().includes(groupNameFilter.value.trim().toLowerCase()),
      )
    : groupsOrdered;
});

const openEditGroupDrawer = (group: any) => {
  editGroup.value = group;
  handleConnectOverlay(true);
  showEditGroupDrawer.value = true;
};
const closeEditGroupDrawer = () => {
  handleConnectOverlay(false);
  showEditGroupDrawer.value = false;
  editGroup.value = null;
};
const openDeleteGroupModal = (group: any) => {
  handleConnectOverlay(true);
  deleteGroup.value = group;
  showDeleteGroupModal.value = true;
};
const closeDeleteGroupModal = () => {
  handleConnectOverlay(false);
  deleteGroup.value = null;
  showDeleteGroupModal.value = false;
};
</script>

<style lang="scss" scoped>
.settings-groups {
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
    gap: $unnnic-space-4;
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
  &__groups-list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-space-4;
  }
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
</style>
