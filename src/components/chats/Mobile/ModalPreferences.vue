<template>
  <unnnic-modal @close="$emit('close')" :text="$t('preferences.title')" class="modal-preferences">
    <unnnic-label label="Status" />
    <unnnic-switch
      :value="configStatus"
      @input="updateStatus"
      :disabled="loadingStatus"
      :text-right="storeStatus === 'ONLINE' ? $t('status.online') : $t('status.offline')"
      size="medium"
    />

    <unnnic-label :label="$t('preferences.notifications.title')" />
    <unnnic-switch
      v-model="configSound"
      @input="updateSound"
      :text-right="$t('preferences.notifications.sound')"
      size="medium"
    />

    <unnnic-label :label="$t('language')" />
    <unnnic-language-select
      :value="$i18n.locale"
      @input="updateLanguage"
      :supportedLanguages="supportedLanguages"
      position="top"
    />

    <template #options>
      <unnnic-button
        :text="$t('quick_messages.title')"
        iconLeft="bolt"
        type="secondary"
        size="large"
        @click="$emit('open-quick-messages')"
      />
    </template>
  </unnnic-modal>
</template>

<script>
import { PREFERENCES_SOUND } from '@/services/api/websocket/soundNotification.js';

import { mapActions, mapState } from 'vuex';

export default {
  name: 'ModalPreferences',

  data() {
    return {
      loadingStatus: false,
      configStatus: false,
      configSound: false,
      supportedLanguages: ['pt-br', 'en', 'es'],
    };
  },

  async created() {
    this.getStatus();

    this.configStatus = this.storeStatus === 'ONLINE';
    this.configSound = localStorage.getItem(PREFERENCES_SOUND) === 'yes';
  },

  computed: {
    ...mapState({
      storeStatus: (state) => state.config.status,
    }),
  },

  methods: {
    ...mapActions({
      getStatus: 'config/getStatus',
      storeUpdateStatus: 'config/updateStatus',
    }),

    updateLanguage(language) {
      const { supportedLanguages } = this;
      if (!supportedLanguages.includes(language)) {
        throw new Error(
          `Invalid selected language. Try any for these: ${supportedLanguages.join(', ')}`,
        );
      }

      this.$i18n.locale = language;
    },

    updateSound() {
      localStorage.setItem(PREFERENCES_SOUND, this.configSound ? 'yes' : 'no');
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
    .unnnic-modal-container-background-body {
      &-description {
        padding: 0;

        &-container {
          padding-bottom: 0;
        }
      }
    }
  }
}
</style>
