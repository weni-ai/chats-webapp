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
          data-testid="copilot-switch"
          @update:model-value="handleCopilotActive($event)"
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
          data-testid="copilot-custom-rules-switch"
          @update:model-value="handleCustomRulesActive($event)"
        />
        <UnnnicTextArea
          v-if="copilotActive && copilotCustomRulesActive && !isLoading"
          v-model="copilotCustomRules"
          :label="$t('settings.messages.copilot.custom_rules.title')"
          :placeholder="
            $t('settings.messages.copilot.custom_rules.explanation')
          "
          :maxLength="1500"
          data-testid="copilot-custom-rules-textarea"
          @update:model-value="handleCustomRules($event)"
        />
      </div>
    </section>
    <section class="sector-messages-form-grid">
      <UnnnicCard
        class="sector-messages-form__new-message"
        type="blank"
        :text="$t('quick_messages.new')"
        icon="add"
        data-testid="create-quick-message-card"
        @click.stop="openMessageCreate()"
      />
      <UnnnicSimpleCard
        v-for="message in sectorQuickMessagesShared"
        :key="message.uuid"
        class="sector-messages-form__quick-message-card"
        type="blank"
        :title="message.title"
        :text="message.text"
        :titleTooltip="
          !isMobile() &&
          $t('quick_messages.shortcut_tooltip', {
            shortcut: message.shortcut || message.title.toLowerCase(),
          })
        "
        clickable
        data-testid="quick-message-card"
        @click="openMessageToEdit(message)"
      >
        <template #headerSlot>
          <UnnnicDropdown>
            <template #trigger>
              <UnnnicToolTip
                v-if="!isMobile()"
                enabled
                :text="$t('quick_messages.delete_or_edit')"
                side="left"
              >
                <UnnnicButton
                  iconCenter="more_vert"
                  type="secondary"
                />
              </UnnnicToolTip>
              <UnnnicButton
                v-else
                iconCenter="more_vert"
                type="secondary"
              />
            </template>

            <UnnnicDropdownItem @click="openMessageToEdit(message)">
              <section class="dropdown-item-content">
                <UnnnicIconSvg
                  class="icon"
                  icon="edit_square"
                  size="sm"
                />
                <p>{{ $t('edit') }}</p>
              </section>
            </UnnnicDropdownItem>

            <UnnnicDropdownItem @click="deleteMessage(message)">
              <section class="dropdown-item-content">
                <UnnnicIconSvg
                  class="icon"
                  icon="delete"
                  size="sm"
                />
                <p>{{ $t('exclude') }}</p>
              </section>
            </UnnnicDropdownItem>
          </UnnnicDropdown>
        </template>
      </UnnnicSimpleCard>
    </section>
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { useConfig } from '@/store/modules/config';
import { mapActions, mapState } from 'pinia';
import isMobile from 'is-mobile';

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
      isMobile,
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

    ...mapActions(useQuickMessageShared, {
      deleteQuickMessage: 'delete',
    }),

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

    openMessageToEdit(message) {
      // TODO
    },

    openMessageCreate() {
      // TODO
    },

    async deleteMessage(message) {
      this.deleteQuickMessage(message.uuid);
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
    &__integration {
      display: grid;
      gap: $unnnic-spacing-sm;
    }
    .title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-lg;
      line-height: 1.5rem;
    }
    .without-messages {
      font-size: $unnnic-font-size-body-gt;
      color: $unnnic-color-neutral-dark;

      margin-top: $unnnic-spacing-sm;

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
  }
  &-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: $unnnic-spacing-sm;
    margin-top: $unnnic-spacing-md;
  }

  &__new-message:hover {
    box-shadow: $unnnic-shadow-level-far;
  }
  &__new-message:active {
    border: 1px solid $unnnic-color-neutral-cleanest;
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
  .dropdown-item-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;

    white-space: nowrap;
  }
}
</style>
