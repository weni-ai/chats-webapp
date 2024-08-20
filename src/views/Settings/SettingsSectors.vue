<template>
  <section class="settings-view__sectors">
    <UnnnicCard
      type="blank"
      :text="$t('config_chats.new_sector')"
      icon="add"
      class="sectors__new-sector-card"
      @click="navigate('sectors.new')"
    />

    <UnnnicCardProject
      v-for="sector in sectors"
      :key="sector.id"
      class="sectors__card"
      :actionText="$t('config_chats.open')"
      :name="sector.name"
      :statuses="[
        {
          title: $t('config_chats.agent_title'),
          icon: 'headphones',
          scheme: 'aux-purple',
          count: sector.agents,
        },
        {
          title: $t('config_chats.contacts'),
          icon: 'person',
          scheme: 'aux-lemon',
          count: sector.contacts,
        },
      ]"
      @action="navigate('sectors.edit', { uuid: sector.uuid })"
    />
  </section>

  <section
    v-if="isLoadingSectors"
    class="settings-view__loading-sectors"
  >
    <img
      src="@/assets/LogoWeniAnimada4.svg"
      width="40"
    />
  </section>
</template>

<script>
import { mapState } from 'pinia';
import { useSettings } from '@/store/modules/settings';

export default {
  name: 'SettingsSectors',

  computed: {
    ...mapState(useSettings, ['sectors', 'isLoadingSectors']),
  },

  methods: {
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
.settings-view {
  &__sectors {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $unnnic-spacing-sm;

    .sectors__new-sector-card {
      height: 100%;
    }
    .sectors__card {
      background-color: $unnnic-color-background-carpet;
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
