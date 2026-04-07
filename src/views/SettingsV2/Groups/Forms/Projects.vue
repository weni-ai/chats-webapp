<template>
  <section :class="{ 'groups-projects-form': true, 'is-editing': isEditing }">
    <h2 class="groups-projects-form__title">
      {{ $t('config_chats.groups.projects_form.title') }}
    </h2>
    <fieldset>
      <UnnnicSelect
        v-model="selectedSector"
        :options="sectorProjectsNames"
        :label="$t('config_chats.groups.projects_form.field.project.label')"
        :placeholder="
          $t('config_chats.groups.projects_form.field.project.placeholder')
        "
        returnObject
        clearable
        enableSearch
        :search="searchSector"
        @update:search="searchSector = $event"
      />
    </fieldset>
    <section
      v-if="group.sectors?.length"
      class="groups-projects-form__list"
    >
      <section
        v-for="sector in group.sectors"
        :key="sector.uuid"
        class="groups-projects-form__list-item"
      >
        <p class="list-item-name">{{ sector.project?.name || sector.name }}</p>
        <UnnnicIcon
          icon="close"
          clickable
          @click="removeSector(sector.uuid)"
        />
      </section>
    </section>
  </section>
</template>

<script>
import { useSettings } from '@/store/modules/settings';
import { mapActions } from 'pinia';
import unnnic from '@weni/unnnic-system';

import Sector from '@/services/api/resources/settings/sector';
import { removeDuplicatedItems } from '@/utils/array';

export default {
  name: 'ProjectGroupProjectsForm',
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
  emits: ['update:modelValue', 'changeValid', 'remove-sector'],
  data() {
    return {
      selectedSector: null,
      searchSector: '',
      sectors: [],
      sectorPage: 0,
      sectorRequestResultsLimit: 20,
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
    sectorProjectsNames() {
      return this.sectors.map((sector) => {
        const { name, uuid } = sector;

        return {
          value: uuid,
          label: name,
        };
      });
    },
    valid() {
      return !!this.group.sectors?.length;
    },
  },

  watch: {
    valid() {
      this.$emit('changeValid', this.valid);
    },
    selectedSector(newVal) {
      if (!newVal?.value) {
        return;
      }
      const sector = this.sectors.find((s) => s.uuid === newVal.value);
      if (!sector) {
        return;
      }
      if (sector.has_group_sector) {
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t(
              'config_chats.groups.projects_form.message.has_group_sector',
              { sectorName: sector.name },
            ),
            type: 'error',
          },
        });
        this.$nextTick(() => {
          this.selectedSector = null;
        });
        return;
      }
      this.addGroupSector(sector);
      this.$nextTick(() => {
        this.selectedSector = null;
      });
    },
  },

  mounted() {
    this.listAllSectors();
  },

  methods: {
    ...mapActions(useSettings, ['getSectors']),

    async listAllSectors() {
      let hasNext = false;
      try {
        const { results, next } = await Sector.list({
          limit: this.sectorRequestResultsLimit,
          offset: this.sectorPage * this.sectorRequestResultsLimit,
        });
        this.sectors = removeDuplicatedItems([...this.sectors, ...results]);
        hasNext = next;
        this.sectorPage += 1;
      } catch (error) {
        console.error(error);
      } finally {
        if (hasNext) this.listAllSectors();
      }
    },

    addGroupSector(sector) {
      if (!sector) return;
      const sectors = this.group.sectors.some(
        (mappedSector) => mappedSector.uuid === sector.uuid,
      )
        ? this.group.sectors
        : [{ ...sector, new: true }, ...this.group.sectors];

      this.group.sectors = sectors;
    },
    removeSector(sectorUuid) {
      const sector = this.group.sectors.find(
        (sector) => sector.uuid === sectorUuid,
      );

      if (this.isEditing && !sector?.new) this.$emit('remove-sector', sector);

      this.group.sectors = this.group.sectors.filter(
        (sector) => sector.uuid !== sectorUuid,
      );
    },
  },
};
</script>

<style lang="scss" scoped>
.groups-projects-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-sm;

  &.is-editing {
    margin-top: -$unnnic-spacing-sm;
  }

  &__title {
    font-family: $unnnic-font-family-secondary;
    margin-top: $unnnic-spacing-sm;
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-fg-base;
    font-size: $unnnic-font-size-body-lg;
    line-height: $unnnic-line-height-large * 1.5;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-xs;
    &-item {
      display: flex;
      justify-content: space-between;
      width: 100%;
      padding-bottom: $unnnic-spacing-xs;
      border-bottom: 1px solid $unnnic-color-border-soft;
      .list-item-name {
        font-family: $unnnic-font-family-secondary;
        color: $unnnic-color-fg-base;
        font-weight: $unnnic-font-weight-bold;
        font-size: $unnnic-font-size-body-gt;
        line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
      }
    }
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
