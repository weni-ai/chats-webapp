<template>
  <section class="sector-messages-form">
    <section class="sector-messages-form__copilot">
      <p class="title">
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
          :label="$t('settings.messages.copilot.custom_rules.title')"
          :placeholder="
            $t('settings.messages.copilot.custom_rules.explanation')
          "
          :maxLength="1500"
          @update:model-value="handleCustomRules"
        />
      </div>
    </section>
    <section class="sector-messages-form-grid">
      <UnnnicCard
        class="sector-messages-form__new-message"
        type="blank"
        :text="$t('quick_messages.new')"
        icon="add"
        data-testid="create=sector-card"
        @click.stop="openNewQueueDrawer()"
      />
    </section>
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import { useConfig } from '@/store/modules/config';
import { mapActions, mapState } from 'pinia';

export default {
  name: 'MessagesForm',
  props: {
    sector: {
      type: Object,
      required: true,
    },
  },
  data: () => {
    return {
      isLoading: false,
      copilotShowIntegrationsMessage: false,
    };
  },
  computed: {
    ...mapState(useConfig, {
      copilotActive: (store) => store.copilot.active,
      copilotCustomRulesActive: (store) => store.copilot.customRulesActive,
      copilotCustomRules: (store) => store.copilot.customRules,
    }),
  },
  beforeUnmount() {
    this.saveSector();
  },
  methods: {
    ...mapActions(useConfig, {
      setCopilotActive: 'setCopilotActive',
      setCopilotCustomRulesActive: 'setCopilotCustomRulesActive',
      setCopilotCustomRules: 'setCopilotCustomRules',
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
.sector-messages-form {
  &__copilot:hover {
    box-shadow: $unnnic-shadow-level-far;
  }
  &__copilot {
    border: 1px solid $unnnic-color-neutral-soft;
    border-radius: $unnnic-border-radius-md;
    padding: $unnnic-spacing-sm;
    display: grid;
    gap: $unnnic-spacing-sm;
  }
  &-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $unnnic-spacing-sm;
  }

  &__new-message {
    min-height: 140px;
    :deep(.unnnic-card-blank__content) {
      flex-direction: row;
    }
    :deep(.unnnic-card-blank__content__icon) {
      font-size: $unnnic-font-size-title-md;
    }
  }
}
</style>
