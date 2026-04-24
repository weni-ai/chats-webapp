<template>
  <footer class="chats-layout-footer">
    <UnnnicPopover
      v-model:open="isOpen"
      data-testid="view-options-popover"
    >
      <UnnnicPopoverTrigger
        as="div"
        @click="handleTriggerClick"
      >
        <ViewButton
          :expandedMore="isOpen"
          :showNewBadge="showNewBadge"
          data-testid="view-btn"
        />
      </UnnnicPopoverTrigger>

      <UnnnicPopoverContent
        class="view-options__content"
        side="top"
        align="start"
        :sideOffset="0"
        width="var(--reka-popper-anchor-width)"
        data-testid="view-options-content"
      >
        <section class="view-options__items">
          <UnnnicButton
            class="view-options__item"
            type="tertiary"
            size="small"
            iconLeft="history"
            :text="$t('chats.see_history')"
            data-testid="show-see_history"
            @click="navigate('closed-rooms')"
          />

          <UnnnicButton
            v-if="showFlowsTriggerButton || !isViewMode"
            class="view-options__item"
            type="tertiary"
            size="small"
            iconLeft="send"
            :text="$t('flows')"
            data-testid="show-flows-trigger"
            @mousedown.prevent
            @click="openFlowsTrigger"
          />

          <UnnnicButton
            v-if="!isViewMode"
            class="view-options__item"
            type="tertiary"
            size="small"
            iconLeft="bolt"
            :text="$t('quick_messages.title')"
            data-testid="show-quick-messages"
            @mousedown.prevent
            @click="openQuickMessage"
          />

          <UnnnicButton
            v-if="dashboard || !isViewMode"
            class="view-options__item"
            type="tertiary"
            size="small"
            iconLeft="bar_chart_4_bars"
            text="Dashboard"
            data-testid="show-dashboard"
            @mousedown.prevent
            @click="navigateToHumanServiceDashboard"
          />
        </section>

        <hr class="view-options__separator" />

        <section class="view-options__group">
          <p class="view-options__group-label">
            {{ $t('preferences.appearance.live_desk_theme') }}
          </p>
          <section
            class="view-options__theme"
            :aria-label="$t('preferences.appearance.live_desk_theme')"
          >
            <UnnnicButton
              class="view-options__theme-button"
              :class="{
                'view-options__theme-button--selected': !isDark,
              }"
              type="secondary"
              size="small"
              iconLeft="clear_day"
              :text="$t('preferences.appearance.light')"
              :aria-pressed="!isDark"
              data-testid="theme-light-button"
              @click="setTheme(THEMES.LIGHT)"
            />
            <UnnnicButton
              class="view-options__theme-button"
              :class="{
                'view-options__theme-button--selected': isDark,
              }"
              type="secondary"
              size="small"
              iconLeft="dark_mode"
              :text="$t('preferences.appearance.dark')"
              :aria-pressed="isDark"
              data-testid="theme-dark-button"
              @click="setTheme(THEMES.DARK)"
            />
          </section>
        </section>

        <section
          v-if="!isViewMode"
          class="view-options__group"
          data-testid="sound-notifications-group"
        >
          <p class="view-options__group-label">
            {{ $t('preferences.notifications.sound_notifications') }}
          </p>
          <UnnnicSwitch
            v-model="sound"
            data-testid="switch-sound"
            size="small"
            :textRight="
              sound
                ? $t('preferences.notifications.on')
                : $t('preferences.notifications.off')
            "
            @update:model-value="changeSound"
          />
        </section>
      </UnnnicPopoverContent>
    </UnnnicPopover>
  </footer>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref } from 'vue';
import { useRouter } from 'vue-router';

import ViewButton from './ViewButton.vue';

import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';
import { moduleStorage } from '@/utils/storage';
import { useTheme } from '@/store/modules/theme';
import { THEMES } from '@/utils/theme';

type ThemeValue = (typeof THEMES)[keyof typeof THEMES];

defineOptions({
  name: 'ViewOptions',
});

withDefaults(
  defineProps<{
    showFlowsTriggerButton?: boolean;
    dashboard?: boolean;
    isViewMode?: boolean;
  }>(),
  {
    showFlowsTriggerButton: false,
    dashboard: false,
    isViewMode: false,
  },
);

const emit = defineEmits<{
  'open-flows-trigger': [void];
  'show-quick-messages': [void];
}>();

const { push } = useRouter();

const VIEW_OPTIONS_NEW_SEEN_KEY = 'viewOptionsNewSeen';

const isOpen = ref(false);
const sound = ref(false);
const showNewBadge = ref(false);

const themeStore = useTheme();
const isDark = computed(() => themeStore.isDark);
const setTheme = (theme: ThemeValue) => themeStore.setTheme(theme);

function handleTriggerClick() {
  if (!isOpen.value && showNewBadge.value) {
    showNewBadge.value = false;
    moduleStorage.setItem(VIEW_OPTIONS_NEW_SEEN_KEY, true);
  }
}

function changeSound() {
  moduleStorage.setItem(PREFERENCES_SOUND, sound.value ? 'yes' : 'no');
}

function openFlowsTrigger() {
  emit('open-flows-trigger');
  isOpen.value = false;
}

function openQuickMessage() {
  emit('show-quick-messages');
  isOpen.value = false;
}

function navigate(name: string) {
  push({ name });
  isOpen.value = false;
}

function navigateToHumanServiceDashboard() {
  window.parent.postMessage(
    {
      event: 'redirect',
      path: 'insights:init/humanServiceDashboard',
    },
    '*',
  );
  isOpen.value = false;
}

onBeforeMount(() => {
  sound.value = (moduleStorage.getItem(PREFERENCES_SOUND) || 'yes') === 'yes';
  showNewBadge.value =
    moduleStorage.getItem(VIEW_OPTIONS_NEW_SEEN_KEY, false) !== true;
});

defineExpose({
  isOpen,
  sound,
  showNewBadge,
  changeSound,
  openFlowsTrigger,
  openQuickMessage,
});
</script>

<style lang="scss" scoped>
section.chats-layout .sidebar .chats-layout-footer {
  padding-right: 0;
}
</style>

<style lang="scss">
.view-options {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }

  &__item .unnnic-button {
    width: 100%;
    justify-content: flex-start;
    padding: $unnnic-space-2 $unnnic-space-4;

    .unnnic-button__label {
      font-weight: $unnnic-font-weight-medium;
      color: $unnnic-color-fg-emphasized;
    }
  }

  &__separator {
    margin: 0;
    border: none;
    border-top: 1px solid $unnnic-color-border-soft;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }

  &__group-label {
    margin: 0;

    font-family: $unnnic-font-family-secondary;
    font-size: $unnnic-font-size-body-gt;
    font-weight: $unnnic-font-weight-regular;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
    color: $unnnic-color-fg-base;
  }

  &__theme {
    display: flex;
    gap: $unnnic-space-2;
  }

  &__theme-button {
    flex: 1 0 0;

    .unnnic-button {
      width: 100%;
      padding: $unnnic-space-3 $unnnic-space-4;

      .unnnic-button__label {
        color: $unnnic-color-fg-emphasized;
      }
    }

    &--selected .unnnic-button.unnnic-button--secondary {
      background-color: $unnnic-color-bg-accent-plain;
      box-shadow: inset 0 0 0 1px $unnnic-color-border-accent-strong;

      &:hover:enabled,
      &:active:enabled {
        background-color: $unnnic-color-bg-accent-plain;
        box-shadow: inset 0 0 0 1px $unnnic-color-border-accent-strong;
      }
    }
  }
}
</style>
