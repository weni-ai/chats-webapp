<template>
  <footer class="chats-layout-footer">
    <ViewButton
      v-if="!isOpen"
      :handleClick="openDrawer"
      :expandedMore="isOpen"
    />
  </footer>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="chats-layout-drawer__overlay"
      @click="closeDrawer"
    ></div>
    <div
      class="chats-layout-drawer"
      :class="{ 'chats-layout-drawer--open': isOpen }"
    >
      <ViewButton
        :handleClick="closeDrawer"
        :expandedMore="isOpen"
      />
      <section class="chats-layout-drawer__options">
        <section class="chats-layout-drawer__option">
          <UnnnicSwitch
            v-model="sound"
            data-testid="switch-sound"
            size="small"
            :textRight="$t('preferences.notifications.sound')"
            @update:model-value="changeSound"
          />
        </section>

        <section class="chats-layout-drawer__option">
          <UnnnicButton
            v-if="showFlowsTriggerButton"
            data-testid="show-flows-trigger"
            :text="$t('flows')"
            size="small"
            type="tertiary"
            iconLeft="send"
            @mousedown.prevent
            @click="openFlowsTrigger"
          />
        </section>
        <section class="chats-layout-drawer__option">
          <UnnnicButton
            data-testid="show-quick-messages"
            :text="$t('quick_messages.title')"
            iconLeft="bolt"
            type="tertiary"
            size="small"
            @mousedown.prevent
            @click="openQuickMessage"
          />
        </section>
        <section class="chats-layout-drawer__option">
          <UnnnicButton
            v-if="dashboard"
            data-testid="show-dashboard"
            text="Dashboard"
            iconLeft="bar_chart_4_bars"
            type="tertiary"
            size="small"
            @mousedown.prevent
            @click="navigate('dashboard.manager')"
          />
        </section>
        <section class="chats-layout-drawer__option">
          <UnnnicButton
            class="chats-layout-drawer__button"
            :text="$t('chats.see_history')"
            iconLeft="history"
            type="tertiary"
            size="small"
            @click="navigate('closed-rooms')"
          />
        </section>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onBeforeMount, defineEmits } from 'vue';
import ViewButton from './ViewButton.vue';
import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';
import { useRouter } from 'vue-router';

defineProps({
  showFlowsTriggerButton: {
    type: Boolean,
    default: false,
  },
  dashboard: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['open-flows-trigger', 'show-quick-messages']);

const { push } = useRouter();

const isOpen = ref(false);
const sound = ref(false);

const closeDrawer = () => {
  isOpen.value = false;
};

const openDrawer = () => {
  isOpen.value = true;
};

const changeSound = () => {
  localStorage.setItem(PREFERENCES_SOUND, sound.value ? 'yes' : 'no');
};

const openFlowsTrigger = () => {
  emit('open-flows-trigger');
};

const openQuickMessage = () => {
  emit('show-quick-messages');
};

const navigate = (name) => {
  push({
    name,
  });
};

onBeforeMount(() => {
  sound.value = (localStorage.getItem(PREFERENCES_SOUND) || 'yes') === 'yes';
});
</script>

<style lang="scss" scoped>
.chats-layout-drawer__overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.chats-layout-drawer {
  position: fixed;
  bottom: -(calc(100vw * (3 / 12)));
  width: calc(100vw * (3 / 12));
  transition: bottom 0.3s ease-in-out;
  z-index: 1000;

  border-top: 1px solid $unnnic-color-neutral-soft;
  border-bottom: 1px solid $unnnic-color-neutral-soft;
  border-left: 1px solid $unnnic-color-neutral-soft;
  background-color: $unnnic-color-neutral-lightest;

  &--open {
    bottom: 0;
    display: flex;
    flex-direction: column;
  }

  &__option {
    width: 100%;

    &:hover {
      background-color: $unnnic-color-neutral-light;
    }

    :deep(.unnnic-switch) {
      padding: $unnnic-spacing-nano + 1px $unnnic-spacing-sm;
      width: 100%;
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

section.chats-layout .sidebar .chats-layout-footer {
  padding-right: 0;
}
</style>
