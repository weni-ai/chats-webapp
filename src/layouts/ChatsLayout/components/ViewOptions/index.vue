<template>
  <footer class="chats-layout-footer">
    <ViewButton
      v-if="!isOpen"
      :handleClick="openDrawer"
      :expandedMore="isOpen"
      data-testid="view-btn"
    />
  </footer>
  <Teleport
    to="body"
    data-testid="teleport-body"
  >
    <Transition name="expand">
      <section
        v-if="isOpen"
        class="chats-layout-drawer"
        :class="{ 'chats-layout-drawer--open': isOpen }"
        data-testid="drawer"
      >
        <ViewButton
          :handleClick="closeDrawer"
          :expandedMore="isOpen"
          data-testid="view-btn-drawer"
        />
        <section class="chats-layout-drawer__options">
          <section
            class="chats-layout-drawer__option chats-layout-drawer--padding-left-space-4"
          >
            <UnnnicSwitch
              v-if="!isViewMode"
              v-model="sound"
              data-testid="switch-sound"
              size="small"
              :textRight="$t('preferences.notifications.sound')"
              @update:model-value="changeSound"
            />
          </section>

          <section class="chats-layout-drawer__option">
            <UnnnicButton
              v-if="showFlowsTriggerButton || !isViewMode"
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
              v-if="!isViewMode"
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
              v-if="dashboard || !isViewMode"
              data-testid="show-dashboard"
              text="Dashboard"
              iconLeft="bar_chart_4_bars"
              type="tertiary"
              size="small"
              @mousedown.prevent
              @click="navigateToHumanServiceDashboard"
            />
          </section>
          <section class="chats-layout-drawer__option">
            <UnnnicButton
              class="chats-layout-drawer__button"
              :text="$t('chats.see_history')"
              iconLeft="history"
              type="tertiary"
              size="small"
              data-testid="show-see_history"
              @click="navigate('closed-rooms')"
            />
          </section>
        </section>
      </section>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, onBeforeMount, onMounted, onUnmounted } from 'vue';
import ViewButton from './ViewButton.vue';
import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';
import { useRouter } from 'vue-router';
import { moduleStorage } from '@/utils/storage';

defineOptions({
  name: 'ViewOptions',
});

defineProps({
  showFlowsTriggerButton: {
    type: Boolean,
    default: false,
  },
  dashboard: {
    type: Boolean,
    default: false,
  },
  isViewMode: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['open-flows-trigger', 'show-quick-messages']);

const { push } = useRouter();

const isOpen = ref(false);
const sound = ref(false);

const handleClickOutside = (event) => {
  const drawer = event.target.closest('[data-testid="drawer"]');
  const viewButton = event.target.closest('[data-testid="view-btn"]');

  if (!drawer && !viewButton && isOpen.value) {
    isOpen.value = false;
  }
};

const closeDrawer = () => {
  isOpen.value = false;
};

const openDrawer = () => {
  isOpen.value = true;
};

const changeSound = () => {
  moduleStorage.setItem(PREFERENCES_SOUND, sound.value ? 'yes' : 'no');
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

const navigateToHumanServiceDashboard = () => {
  window.parent.postMessage(
    {
      event: 'redirect',
      path: 'insights:init/humanServiceDashboard',
    },
    '*',
  );
};

onBeforeMount(() => {
  sound.value = (moduleStorage.getItem(PREFERENCES_SOUND) || 'yes') === 'yes';
});

onMounted(async () => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style lang="scss" scoped>
.chats-layout-drawer {
  position: fixed;
  width: calc(100vw * (3 / 12));
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

  &__options {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding-top: $unnnic-space-2;
  }

  &--padding-left-space-4 {
    padding-left: $unnnic-space-4;
  }

  &__option {
    width: 100%;

    &:hover {
      background-color: $unnnic-color-neutral-light;
    }

    :deep(.unnnic-button--size-small) {
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

.expand-enter-active,
.expand-leave-active {
  transition: all 0.3s ease-out;
  max-height: calc(100vw * (3 / 12));
}

.expand-enter-from,
.expand-leave-to {
  max-height: 0;
  opacity: 0;
  overflow: hidden;
}

.expand-enter-to,
.expand-leave-from {
  max-height: calc(100vw * (3 / 12));
  opacity: 1;
  overflow: hidden;
}
</style>
