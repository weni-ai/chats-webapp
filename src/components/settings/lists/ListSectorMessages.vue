<template>
  <section class="list-sector-messages">
    <section class="list-sector-messages__copilot">
      <p
        v-if="sector"
        class="title"
      >
        {{ $t('copilot.name') }}
      </p>
      <div class="list-sector-messages__copilot__integration">
        <UnnnicSwitch
          v-model="copilotActive"
          size="small"
          :textRight="
            $t(
              `settings.messages.copilot.status.${
                copilotActive ? 'on' : 'off'
              }`,
            )
          "
          @update:model-value="handleCopilotActive"
        />
        <p
          v-if="copilotShowIntegrationsMessage"
          class="without-messages"
        >
          {{ $t('settings.messages.copilot.integration.start') }}
          <button @click="redirectToIntegrations">
            {{ $t('settings.messages.copilot.integration.middle') }}
          </button>
          {{ $t('settings.messages.copilot.integration.end') }}
        </p>
        <UnnnicSwitch
          v-if="copilotActive && !copilotShowIntegrationsMessage && !isLoading"
          v-model="copilotCustomRulesActive"
          size="small"
          :textRight="
            $t(
              `settings.messages.copilot.custom_rules.status.${
                copilotCustomRulesActive ? 'on' : 'off'
              }`,
            )
          "
          @update:model-value="handleCustomRulesActive"
        />
        <UnnnicTextArea
          v-if="copilotActive && copilotCustomRulesActive && !isLoading"
          v-model="copilotCustomRules"
          @update:model-value="handleCustomRules"
          :label="$t('settings.messages.copilot.custom_rules.title')"
          :placeholder="
            $t('settings.messages.copilot.custom_rules.explanation')
          "
          :maxLength="1500"
        />
      </div>
    </section>

    <section>
      <p
        v-if="sector"
        class="title"
      >
        {{ $t('quick_messages.title_by_sector', { sector: sector.name }) }}
      </p>
      <p
        v-if="quickMessagesShared.length === 0"
        class="without-messages"
      >
        {{ $t('quick_messages.without_messages_shared.start') }}
        <button @click="$emit('create-quick-message')">
          {{ $t('quick_messages.without_messages_shared.middle') }}
        </button>
        {{ $t('quick_messages.without_messages_shared.end') }}
      </p>

      <QuickMessageCard
        v-for="message in quickMessagesShared"
        :key="message.uuid"
        :quickMessage="message"
        clickable
        @select="$emit('edit-quick-message', message)"
        @edit="$emit('edit-quick-message', message)"
        @delete="$emit('delete-quick-message', message.uuid)"
      />
    </section>
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import QuickMessageCard from '@/components/chats/QuickMessages/QuickMessageCard.vue';

import { mapActions, mapState } from 'pinia';
import { useConfig } from '@/store/modules/config';

export default {
  name: 'ListSectorQuickMessages',

  components: {
    QuickMessageCard,
  },

  props: {
    quickMessagesShared: {
      type: Array,
      default: () => [],
    },
    sector: {
      type: Object,
      default: null,
    },
  },

  data: () => {
    return {
      isLoading: false,
      copilotShowIntegrationsMessage: false,
    };
  },

  beforeDestroy() {
    this.saveSector();
  },

  computed: {
    ...mapState(useConfig, {
      copilotActive: (store) => store.copilot.active,
      copilotCustomRulesActive: (store) => store.copilot.customRulesActive,
      copilotCustomRules: (store) => store.copilot.customRules,
    }),
  },

  methods: {
    ...mapActions({
      setCopilotActive: 'config/setCopilotActive',
      setCopilotCustomRulesActive: 'config/setCopilotCustomRulesActive',
      setCopilotCustomRules: 'config/setCopilotCustomRules',
    }),

    handleCopilotActive(boolean) {
      this.setCopilotActive(boolean);
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
        response.config.can_use_chat_completion === undefined
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
  },
};
</script>

<style lang="scss" scoped>
.list-sector-messages {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-md;

  &__copilot {
    &__integration {
      display: grid;
      gap: $unnnic-spacing-sm;
    }
  }

  .title {
    font-weight: $unnnic-font-weight-bold;
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-lg;
    line-height: 1.5rem;

    margin-bottom: 1rem;
  }

  .without-messages {
    font-size: $unnnic-font-size-body-gt;
    color: $unnnic-color-neutral-dark;

    button {
      background: none;
      border: none;
      padding: 0;

      text-decoration: underline;
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;

      cursor: pointer;
    }
  }

  :deep(.quick-message-card) {
    max-width: 100%;

    margin-top: $unnnic-spacing-stack-sm;
  }
}
</style>
