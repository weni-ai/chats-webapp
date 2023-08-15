<template>
  <section class="list-sector-messages">
    <section class="list-sector-messages__copilot">
      <p v-if="sector" class="title">{{ $t('settings.messages.copilot.title') }}</p>
      <div class="list-sector-messages__copilot__integration">
        <unnnic-switch
          :value="copilotActive"
          size="small"
          :text-right="$t(`settings.messages.copilot.status.${copilotActive ? 'on' : 'off'}`)"
          @input="saveSector($event)"
        />
        <p v-if="copilotShowIntegrationsMessage" class="without-messages">
          {{ $t('settings.messages.copilot.integration.start') }}
          <button @click="redirectToIntegrations">
            {{ $t('settings.messages.copilot.integration.middle') }}
          </button>
          {{ $t('settings.messages.copilot.integration.end') }}
        </p>
        <unnnic-switch
          v-if="copilotActive && !copilotShowIntegrationsMessage"
          :value="copilotCustomRulesActive"
          size="small"
          :text-right="
            $t(`settings.messages.copilot.custom_rules.status.${copilotActive ? 'on' : 'off'}`)
          "
          @input="handleCustomRules"
        />
        <unnnic-text-area
          v-if="copilotCustomRulesActive"
          :label="$t('settings.messages.copilot.custom_rules.title')"
          :placeholder="$t('settings.messages.copilot.custom_rules.explanation')"
          value=""
          :maxLength="1500"
          :disabled="false"
          type="normal"
          :errors="[]"
        />
      </div>
    </section>

    <section>
      <p v-if="sector" class="title">
        {{ $t('quick_messages.title_by_sector', { sector: sector.name }) }}
      </p>
      <p v-if="quickMessagesShared.length === 0" class="without-messages">
        {{ $t('quick_messages.without_messages.start') }}
        <button @click="$emit('create-quick-message')">
          {{ $t('quick_messages.without_messages.middle') }}
        </button>
        {{ $t('quick_messages.without_messages.end') }}
      </p>

      <quick-message-card
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
import QuickMessageCard from '@/components/chats/QuickMessages/QuickMessageCard';

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
      copilotActive: false,
      copilotCustomRulesActive: false,
      copilotShowIntegrationsMessage: false,
    };
  },

  mounted() {
    this.copilotActive = this.sector.config.can_use_chat_completion;
    this.copilotCustomRulesActive = this.sector.config.can_input_context;
  },

  methods: {
    handleCustomRules(event) {
      this.copilotCustomRulesActive = event;
    },
    redirectToIntegrations() {
      window.parent.postMessage(
        { event: 'redirect', path: 'integrations:apps/chatgpt/details' },
        '*',
      );
    },
    async saveSector(copilotActive) {
      this.copilotActive = copilotActive;
      const { uuid, name } = this.sector;

      const newSector = {
        name,
        config: {
          can_use_chat_completion: copilotActive,
        },
      };

      const response = await Sector.update(uuid, newSector);
      if (response.status === 400) {
        this.copilotActive = false;
        this.copilotShowIntegrationsMessage = true;
      }
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
