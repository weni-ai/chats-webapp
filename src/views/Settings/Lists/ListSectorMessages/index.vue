<template>
  <section class="sector-messages-form">
    <section class="sector-messages-form-grid">
      <QuickMessageCard
        v-for="message in sectorQuickMessagesShared"
        :key="message.uuid"
        :quickMessage="message"
        @edit="openConfigMessageDrawer(message)"
        @delete="deleteMessage(message)"
      />
    </section>
    <QuickMessageDrawer
      v-if="showQuickMessageDrawer"
      :modelValue="showQuickMessageDrawer"
      :sector="sector.uuid"
      :quickMessage="quickMessageToEdit"
      @update:model-value="closeConfigMessageDrawer()"
    />
  </section>
</template>

<script>
import { mapActions, mapState } from 'pinia';

import QuickMessageDrawer from '@/views/Settings/Forms/Messages/QuickMessageDrawer.vue';
import QuickMessageCard from './QuickMessageCard.vue';

import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { useConfig } from '@/store/modules/config';

import Sector from '@/services/api/resources/settings/sector';

import isMobile from 'is-mobile';

export default {
  name: 'ListSectorMessages',
  components: {
    QuickMessageDrawer,
    QuickMessageCard,
  },
  props: {
    sector: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      isLoading: false,
      copilotShowIntegrationsMessage: false,
      isMobile,
      quickMessageToEdit: { title: '', text: '', shortcut: '' },
      showQuickMessageDrawer: false,
      isLoadingQuickMessage: false,
    };
  },
  computed: {
    ...mapState(useConfig, {
      copilotActive: (store) => store.copilot.active,
      copilotCustomRulesActive: (store) => store.copilot.customRulesActive,
      copilotCustomRules: (store) => store.copilot.customRules,
    }),
    ...mapState(useQuickMessageShared, ['quickMessagesShared']),
    sectorQuickMessagesShared() {
      return this.quickMessagesShared.filter(
        (message) => message.sector === this.sector.uuid,
      );
    },
    validQuickMessage() {
      const { shortcut, text } = this.quickMessageToEdit;
      return !!(shortcut && text);
    },
  },
  mounted() {
    this.listenConnect();
  },
  methods: {
    ...mapActions(useConfig, {
      setCopilotActive: 'setCopilotActive',
      setCopilotCustomRulesActive: 'setCopilotCustomRulesActive',
      setCopilotCustomRules: 'setCopilotCustomRules',
    }),

    ...mapActions(useQuickMessageShared, {
      deleteQuickMessage: 'delete',
    }),

    handleConnectOverlay(active) {
      window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
    },
    listenConnect() {
      window.addEventListener('message', (message) => {
        const { event } = message.data;
        if (event === 'close') this.$refs.queueDrawer?.close();
      });
    },

    handleCopilotActive(copilotStatus) {
      this.setCopilotActive(copilotStatus);
      this.saveSector();
    },

    handleCustomRulesActive(boolean) {
      this.setCopilotCustomRulesActive(boolean);
    },

    handleCustomRules(customRules) {
      this.setCopilotCustomRules(customRules);
    },

    redirectToIntegrations() {
      window.parent.postMessage(
        { event: 'redirect', path: 'integrations:apps/chatgpt/details' },
        '*',
      );
    },

    async saveSector() {
      const { uuid, name } = this.sector;

      const newSector = {
        name,
        config: {
          can_use_chat_completion: this.copilotActive,
          can_input_context: this.copilotCustomRulesActive,
          completion_context: this.copilotCustomRules,
        },
      };

      this.isLoading = true;
      const response = await Sector.update(uuid, newSector);

      if (
        response.status === 400 ||
        response.config?.can_use_chat_completion === undefined
      ) {
        this.copilotShowIntegrationsMessage = true;
        this.setCopilotActive(false);
      } else {
        this.copilotShowIntegrationsMessage = false;
        this.setCopilotActive(response.config.can_use_chat_completion);
        this.setCopilotCustomRulesActive(response.config.can_input_context);
        this.setCopilotCustomRules(response.config.completion_context);
      }

      this.isLoading = false;
    },

    openConfigMessageDrawer(message = { title: '', text: '', shortcut: '' }) {
      this.handleConnectOverlay(true);
      this.quickMessageToEdit = { ...message };
      this.showQuickMessageDrawer = true;
    },

    closeConfigMessageDrawer() {
      this.handleConnectOverlay(false);
      this.quickMessageToEdit = { title: '', text: '', shortcut: '' };
      this.showQuickMessageDrawer = false;
    },

    async deleteMessage(message) {
      this.deleteQuickMessage(message.uuid);
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-messages-form {
  &-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-space-4;
  }
}
</style>
