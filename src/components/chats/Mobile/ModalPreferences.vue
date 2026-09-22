<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-preferences"
  >
    <UnnnicDialogContent>
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('preferences.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>
      <section class="modal-preferences__content">
        <UnnnicLabel label="Status" />
        <div
          class="agent-status"
          :class="{ 'agent-status--disabled': isUpdatingStatus }"
        >
          <button
            type="button"
            class="agent-status__trigger"
            data-testid="agent-status-trigger"
            :disabled="isUpdatingStatus"
            @click="toggleStatusList"
          >
            <span
              class="agent-status__icon"
              data-testid="agent-status-icon"
              :class="`agent-status--${selectedStatus.color}`"
            />
            <span
              class="agent-status__label"
              data-testid="agent-status-label"
              :title="selectedStatus.label"
            >
              {{ selectedStatus.label }}
            </span>
            <UnnnicIcon
              size="md"
              :icon="isStatusListOpen ? 'expand_less' : 'expand_more'"
              scheme="fg-base"
            />
          </button>
          <ul
            v-if="isStatusListOpen"
            class="agent-status__list"
            data-testid="agent-status-list"
          >
            <li
              v-for="status in filteredStatuses"
              :key="status.value"
              class="agent-status__item"
              data-testid="agent-status-item"
              @click="selectStatus(status)"
            >
              <span
                class="agent-status__icon"
                :class="`agent-status--${status.color}`"
              />
              <span
                class="agent-status__item-label"
                :title="status.label"
              >
                {{ status.label }}
              </span>
            </li>
          </ul>
        </div>

        <UnnnicLabel :label="$t('preferences.notifications.title')" />
        <UnnnicSwitch
          v-model="configSound"
          :textRight="$t('preferences.notifications.sound')"
          size="medium"
          @update:model-value="updateSound"
        />

        <UnnnicLabel :label="$t('language')" />
        <UnnnicLanguageSelect
          v-model="$i18n.locale"
          :supportedLanguages="supportedLanguages"
          position="top"
          @update:model-value="updateLanguage"
        />
      </section>
      <UnnnicDialogFooter>
        <UnnnicButton
          :text="$t('quick_messages.title')"
          iconLeft="bolt"
          type="secondary"
          size="large"
          @click="$emit('open-quick-messages')"
        />
        <UnnnicButton
          :text="$t('back_to_home_page')"
          iconLeft="arrow_back"
          type="tertiary"
          size="large"
          @click="$emit('back-to-home')"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script>
import { ref } from 'vue';
import { unnnicToastManager } from '@weni/unnnic-system';

import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';

import { moduleStorage } from '@/utils/storage';
import { useAgentStatus } from '@/composables/useAgentStatus';

export default {
  name: 'ModalPreferences',
  emits: ['close', 'open-quick-messages', 'back-to-home'],

  setup() {
    const isStatusListOpen = ref(false);
    const agentStatus = useAgentStatus({
      notify: ({ props }) => {
        const showToast =
          props.scheme === 'feedback-red'
            ? unnnicToastManager.error
            : unnnicToastManager.success;

        showToast(props.text);
      },
      onStatusApplied: () => {
        isStatusListOpen.value = false;
      },
    });

    const toggleStatusList = () => {
      if (agentStatus.isUpdatingStatus.value) return;
      isStatusListOpen.value = !isStatusListOpen.value;
    };

    return {
      isStatusListOpen,
      toggleStatusList,
      ...agentStatus,
    };
  },

  data() {
    return {
      isOpen: true,
      configSound: false,
      supportedLanguages: ['pt-br', 'en', 'es'],
    };
  },

  watch: {
    isOpen(value) {
      if (!value) this.$emit('close');
    },
  },

  created() {
    this.refreshData();
    this.configSound = moduleStorage.getItem(PREFERENCES_SOUND) === 'yes';
  },

  methods: {
    updateLanguage(language) {
      const { supportedLanguages } = this;
      if (!supportedLanguages.includes(language)) {
        throw new Error(
          `Invalid selected language. Try any for these: ${supportedLanguages.join(
            ', ',
          )}`,
        );
      }

      this.$i18n.locale = language;
    },

    updateSound() {
      moduleStorage.setItem(PREFERENCES_SOUND, this.configSound ? 'yes' : 'no');
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-preferences {
  &__content {
    display: grid;
    gap: $unnnic-space-4;
    padding: $unnnic-space-6;
  }
}

.agent-status {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;
  min-width: 0;

  &--disabled {
    opacity: 0.6;
    pointer-events: none;
  }

  &__trigger {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    width: 100%;
    padding: 0;
    border: 0;
    background: transparent;
    cursor: pointer;
    text-align: left;
  }

  &__icon {
    width: $unnnic-space-2;
    height: $unnnic-space-2;
    border-radius: $unnnic-radius-full;
    flex-shrink: 0;
    background-color: $unnnic-color-fg-base;
  }

  &--green {
    background-color: $unnnic-color-bg-green-strong;
  }

  &--gray {
    background-color: $unnnic-color-bg-muted;
  }

  &--brown {
    background-color: $unnnic-color-bg-orange-strong;
  }

  &__label,
  &__item-label {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: $unnnic-color-fg-base;
  }

  &__label {
    flex: 1;
    font: $unnnic-font-action;
  }

  &__item-label {
    font: $unnnic-font-body;
  }

  &__list {
    list-style: none;
    margin: 0;
    padding: $unnnic-space-2;
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    max-height: 140px;
    overflow-y: auto;
    border: 1px solid $unnnic-color-border-base;
    border-radius: $unnnic-radius-4;
    background: $unnnic-color-bg-base;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    padding: $unnnic-space-2;
    cursor: pointer;
    min-width: 0;

    &:hover {
      background: $unnnic-color-bg-base-soft;
      border-radius: $unnnic-radius-1;
    }
  }
}
</style>
