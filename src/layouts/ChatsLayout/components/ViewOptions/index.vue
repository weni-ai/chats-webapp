<template>
  <footer class="footer">
    <ViewButton
      v-if="!isOpen"
      :handleClick="openDrawer"
      :expandedMore="isOpen"
    />
  </footer>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="drawer-overlay"
      @click="closeDrawer"
    ></div>
    <div
      class="drawer"
      :class="{ open: isOpen }"
    >
      <ViewButton
        :handleClick="closeDrawer"
        :expandedMore="isOpen"
      />
      <section class="drawer__options">
        <section class="drawer__option">
          <UnnnicSwitch
            data-testid="switch-sound"
            size="small"
            :textRight="$t('preferences.notifications.sound')"
          />
        </section>

        <section class="drawer__option">
          <UnnnicButton
            data-testid="show-flows-trigger"
            :text="$t('flows')"
            size="small"
            type="tertiary"
            iconLeft="send"
            @mousedown.prevent
          />
        </section>
        <section class="drawer__option">
          <UnnnicButton
            data-testid="show-quick-messages"
            :text="$t('quick_messages.title')"
            iconLeft="bolt"
            type="tertiary"
            size="small"
            @mousedown.prevent
          />
        </section>
        <section class="drawer__option">
          <UnnnicButton
            data-testid="show-dashboard"
            text="Dashboard"
            iconLeft="bar_chart_4_bars"
            type="tertiary"
            size="small"
            @mousedown.prevent
          />
        </section>
        <section class="drawer__option">
          <UnnnicButton
            class="chats-layout-footer-button__button"
            :text="$t('chats.see_history')"
            iconLeft="history"
            type="tertiary"
            size="small"
          />
        </section>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import ViewButton from './ViewButton.vue';

const isOpen = ref(false);

const closeDrawer = () => {
  isOpen.value = false;
};

const openDrawer = () => {
  isOpen.value = true;
};
</script>

<style lang="scss" scoped>
section.chats-layout .sidebar .footer {
  padding-right: 0;
}

.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.drawer {
  position: fixed;
  bottom: -(calc(100vw * (3 / 12)));
  width: calc(100vw * (3 / 12));
  transition: bottom 0.3s ease-in-out;
  z-index: 1000;

  border-top: 1px solid $unnnic-color-neutral-soft;
  border-bottom: 1px solid $unnnic-color-neutral-soft;
  border-left: 1px solid $unnnic-color-neutral-soft;
  background-color: $unnnic-color-neutral-lightest;

  &__option {
    width: 100%;
    :hover {
      background-color: $unnnic-color-neutral-light;
    }
    :deep(.unnnic-switch) {
      padding: $unnnic-spacing-nano + 1px $unnnic-spacing-sm;
      width: 100%;
      cursor: pointer;
    }

    :deep(.unnnic-switch__label__small) {
      color: $unnnic-color-neutral-cloudy;

      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-gt;
      font-style: normal;
      font-weight: $unnnic-font-weight-regular;
      line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    }

    :deep(.unnnic-button--size-small) {
      padding: 0 $unnnic-spacing-sm;
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: start;
    }

    :deep(.material-symbols-rounded.unnnic-icon-size--sm) {
      font-size: $unnnic-avatar-size-nano;
      color: $unnnic-color-neutral-cloudy;
    }

    :deep(.unnnic-button__label) {
      color: $unnnic-color-neutral-cloudy;
    }
  }
}

.drawer.open {
  bottom: 0;

  display: flex;
  flex-direction: column;
}
</style>
