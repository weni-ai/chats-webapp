<template>
  <section :class="{ 'groups-general-form': true, 'is-editing': isEditing }">
    <h2 class="groups-general-form__title">
      {{
        isEditing
          ? $t('config_chats.groups.general_form.service_managers')
          : $t('config_chats.groups.general_form.title')
      }}
    </h2>
    <UnnnicInput
      v-if="!isEditing"
      v-model="group.name"
      :label="$t('config_chats.groups.general_form.field.name.label')"
      :placeholder="
        $t('config_chats.groups.general_form.field.name.placeholder')
      "
    />
    <fieldset>
      <UnnnicLabel
        style="margin-top: 0"
        :label="$t('config_chats.groups.general_form.field.manager.label')"
      />
      <UnnnicSelectSmart
        v-model="selectedManager"
        :options="managersNames"
        autocomplete
        autocompleteIconLeft
        autocompleteClearOnFocus
        @update:model-value="selectManager"
      />
    </fieldset>
    <section
      v-if="group.managers?.length > 0"
      class="form-sector-container__managers"
    >
      <SelectedMember
        v-for="manager in group.managers"
        :key="manager.uuid"
        :name="
          manager.user
            ? `${manager.user.first_name} ${manager.user.last_name}`
            : manager.user_name
        "
        :email="manager.user?.email || manager.user_email"
        :avatarUrl="photo(manager.user?.photo_url)"
        :roleName="$t('manager')"
        @remove="removeManager(manager.uuid)"
      />
    </section>
    <UnnnicInput
      v-model="group.maxSimultaneousChatsByAgent"
      :label="$t('sector.managers.working_day.limit_agents.label')"
      placeholder="4"
    />
  </section>
</template>

<script>
import Project from '@/services/api/resources/settings/project';
import Group from '@/services/api/resources/settings/group';

import SelectedMember from '@/components/settings/forms/SelectedMember.vue';

export default {
  name: 'ProjectGroupGeneralForm',
  components: {
    SelectedMember,
  },
  props: {
    isEditing: {
      type: Boolean,
      default: false,
    },
    modelValue: {
      type: Object,
      required: true,
    },
  },

  emits: ['update:modelValue', 'changeValid'],

  data() {
    return {
      managers: [],
      managersPage: 0,
      managersLimitPerPage: 50,
      selectedManager: [],
      removedManagers: [],
    };
  },

  computed: {
    group: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      },
    },
    managersNames() {
      const managersNames = [
        {
          value: '',
          label: this.$t(
            'config_chats.groups.general_form.field.manager.placeholder',
          ),
        },
      ];

      this.managers.forEach((manager) => {
        const {
          user: { email, first_name, last_name },
          uuid,
        } = manager;

        managersNames.push({
          value: uuid,
          label: first_name || last_name ? `${first_name} ${last_name}` : email,
        });
      });

      return managersNames;
    },
    valid() {
      const { name, managers, maxSimultaneousChatsByAgent } = this.group;
      const valid =
        !!name?.trim() &&
        Number(maxSimultaneousChatsByAgent || 0) >= 1 &&
        !!managers.length;
      return valid;
    },
  },

  watch: {
    valid() {
      this.$emit('changeValid', this.valid);
    },
  },

  mounted() {
    if (this.isEditing) this.listGroupManagers();

    this.listProjectManagers();
  },

  methods: {
    async listProjectManagers() {
      let hasNext = false;
      try {
        const offset = this.managersPage * this.managersLimitPerPage;
        const { results, next } = await Project.managers(
          offset,
          this.managersLimitPerPage,
        );
        this.managersPage += 1;
        this.managers = this.managers.concat(results);

        hasNext = next;
      } finally {
        if (hasNext) {
          this.listProjectManagers();
        }
      }
    },

    async listGroupManagers() {
      const managers = await Group.listAuthorization({
        groupSectorUuid: this.group.uuid,
        role: 1,
      });
      this.group.managers = managers.results;
    },

    selectManager(selectedManager) {
      if (selectedManager.length > 0) {
        const manager = this.managers.find((manager) => {
          const { uuid } = manager;

          return uuid === selectedManager[0].value;
        });

        this.addGroupManager(manager);
      }
    },

    addGroupManager(manager) {
      if (manager) {
        const managers = this.group.managers.some(
          (mappedManager) =>
            (mappedManager.user?.email || mappedManager.user_email) ===
            manager.user.email,
        )
          ? this.group.managers
          : [...this.group.managers, { ...manager, role: 1, new: true }];

        this.group.managers = managers;

        // if (this.isEditing) this.addManager(manager);
        this.selectedManager = [this.managersNames[0]];
      }
    },

    async removeManager(managerUuid) {
      // if (this.isEditing) await Sector.removeManager(managerUuid);
      const manager = this.group.managers.find(
        (manager) => manager.uuid === managerUuid,
      );

      this.removedManagers.push(manager);
      this.group.managers = this.group.managers.filter(
        (manager) => manager.uuid !== managerUuid,
      );
    },

    photo(link) {
      if (![null, undefined, ''].includes(link)) {
        const getOnlyPhoto = link.split('?')[0];
        return getOnlyPhoto;
      }
      return link;
    },
  },
};
</script>

<style lang="scss" scoped>
.groups-general-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-sm;

  &.is-editing {
    margin-top: -$unnnic-spacing-sm;
  }

  &__title {
    margin-top: $unnnic-spacing-sm;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: $unnnic-line-height-large * 1.5;
  }

  :deep(.unnnic-form__label) {
    margin-top: 0;
    margin-bottom: $unnnic-spacing-xs;
  }
}

fieldset {
  border: none;
  padding: 0;
  margin: 0;
}
</style>
