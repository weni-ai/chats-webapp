<template>
  <UnnnicModal
    :text="$t('preferences.title')"
    class="modal-preferences"
    @close="$emit('close')"
  >
    <UnnnicLabel label="Status" />
    <UnnnicSwitch
      v-model="configStatus"
      :disabled="loadingStatus"
      :textRight="
        storeStatus === 'ONLINE' ? $t('status.online') : $t('status.offline')
      "
      size="medium"
      @update:model-value="updateStatus"
    />

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

    <template #options>
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
    </template>
  </UnnnicModal>
</template>

<script>
import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';

import { mapActions, mapState } from 'pinia';
import { useConfig } from '@/store/modules/config';
import { moduleStorage } from '@/utils/storage';

export default {
  name: 'ModalPreferences',
  emits: ['close', 'open-quick-messages', 'back-to-home'],

  data() {
    return {
      loadingStatus: false,
      configStatus: false,
      configSound: false,
      supportedLanguages: ['pt-br', 'en', 'es'],
    };
  },

  computed: {
    ...mapState(useConfig, {
      storeStatus: (store) => store.status,
    }),
  },

  async created() {
    this.getStatus();

    this.configStatus = this.storeStatus === 'ONLINE';
    this.configSound = moduleStorage.getItem(PREFERENCES_SOUND) === 'yes';
  },

  methods: {
    ...mapActions(useConfig, {
      getStatus: 'getStatus',
      storeUpdateStatus: 'updateStatus',
    }),

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

    async updateStatus(status) {
      this.loadingStatus = true;

      await this.storeUpdateStatus(status ? 'ONLINE' : 'OFFLINE');

      this.loadingStatus = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.modal-preferences {
  :deep(.unnnic-modal-container) {
    .unnnic-modal-container-background {
      &-body-description {
        padding: 0;

        &-container {
          padding-bottom: 0;
        }
      }
      &-button {
        flex-direction: column;
        gap: $unnnic-spacing-sm;

        > * {
          margin: 0;
        }
      }
    }
  }
}
</style>
