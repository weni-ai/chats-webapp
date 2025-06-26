<template>
  <header
    v-if="viewedAgent"
    class="view-mode__header"
    data-testid="view-mode-header"
  >
    <h1
      class="title"
      data-testid="header-title"
    >
      <UnnnicIcon
        icon="visibility"
        size="md"
        data-testid="visibility-icon"
      />
      {{ $t('dashboard.view-mode.title', { viewedAgent }) }}
    </h1>
    <div
      class="close-button"
      data-testid="close-button"
      @click="closeViewMode"
      @keypress.enter="closeViewMode"
    >
      <UnnnicToolTip
        :text="$t('dashboard.view-mode.close')"
        enabled
        side="left"
        data-testid="close-tooltip"
      >
        <UnnnicIcon
          size="sm"
          icon="close-1"
          data-testid="close-icon"
        />
      </UnnnicToolTip>
    </div>
  </header>
</template>
<script>
import { mapActions } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

export default {
  name: 'ViewModeHeader',

  props: {
    viewedAgent: {
      required: true,
      type: String,
    },
  },

  data() {
    return {
      isInsight: false,
    };
  },

  methods: {
    ...mapActions(useRooms, ['setActiveRoom']),
    async closeViewMode() {
      await this.setActiveRoom(null);
      this.$router.push({ name: 'dashboard.manager' });

      if (this.$route.params.oldModule === 'insights')
        return window.parent.postMessage(
          {
            event: 'redirect',
            path: 'insights:init',
          },
          '*',
        );
    },
  },
};
</script>

<style lang="scss" scoped>
.view-mode__header {
  position: absolute;
  top: 0;
  left: 0;

  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: $unnnic-spacing-stack-xs 0;

  width: 100%;

  background: $unnnic-color-brand-weni;
  color: $unnnic-color-neutral-black;

  cursor: default;

  .title {
    display: flex;
    gap: $unnnic-spacing-inline-xs;
    justify-content: center;

    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-regular;

    flex: 1;
  }

  .close-button {
    margin-right: calc(
      ($unnnic-font-size-body-lg / 100 * 50) + $unnnic-spacing-stack-xs
    );
    cursor: pointer;

    .unnnic-tooltip {
      display: flex;
    }
  }
}
</style>
