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
        @click.stop="openConfigMessageDrawer()"
      />
      <UnnnicSimpleCard
        v-for="message in sectorQuickMessagesShared"
        :key="message.uuid"
        class="sector-messages-form__quick-message-card"
        type="blank"
        :title="'/' + message.shortcut"
        :text="message.text"
        clickable
        data-testid="quick-message-card"
        @click="openConfigMessageDrawer(message)"
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
                  data-testid="open-dropdown-menu-button"
                />
              </UnnnicToolTip>
              <UnnnicButton
                v-else
                iconCenter="more_vert"
                type="secondary"
              />
            </template>

            <UnnnicDropdownItem
              data-testid="dropdown-edit"
              @click="openConfigMessageDrawer(message)"
            >
              <section class="dropdown-item-content">
                <UnnnicIconSvg
                  class="icon"
                  icon="edit_square"
                  size="sm"
                />
                <p>{{ $t('edit') }}</p>
              </section>
            </UnnnicDropdownItem>

            <UnnnicDropdownItem
              data-testid="dropdown-delete"
              @click="deleteMessage(message)"
            >
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
    <UnnnicDrawer
      ref="quickMessageDrawer"
      :modelValue="showQuickMessageDrawer"
      :title="
        quickMessageToEdit.uuid
          ? $t('quick_messages.edit')
          : $t('quick_messages.new')
      "
      size="lg"
      :primaryButtonText="$t('save')"
      :disabledPrimaryButton="!validQuickMessage"
      :loadingPrimaryButton="isLoadingQuickMessage"
      :secondaryButtonText="$t('cancel')"
      :disabledSecondaryButton="isLoadingQuickMessage"
      data-testid="quick-message-config-drawer"
      @close="closeConfigMessageDrawer()"
      @primary-button-click="
        quickMessageToEdit.uuid
          ? handlerUpdateQuickMessage()
          : handlerCreateQuickMessage()
      "
      @secondary-button-click="$refs.quickMessageDrawer.close()"
    >
      <template #content>
        <MessageForm
          v-model="quickMessageToEdit"
          data-testid="quick-message-form"
        />
      </template>
    </UnnnicDrawer>
  </section>
</template>

<script>
import Sector from '@/services/api/resources/settings/sector';
import MessageForm from '../forms/Messages.vue';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { useConfig } from '@/store/modules/config';
import { mapActions, mapState } from 'pinia';
import unnnic from '@weni/unnnic-system';
import isMobile from 'is-mobile';

export default {
  name: 'ListSectorMessages',
  components: {
    MessageForm,
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
      createQuickMessage: 'create',
      updateQuickMessage: 'update',
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
      this.showQuickMessageDrawer = true;

      this.quickMessageToEdit = { ...message };
    },

    closeConfigMessageDrawer() {
      this.handleConnectOverlay(false);
      this.showQuickMessageDrawer = false;

      this.quickMessageToEdit = { title: '', text: '', shortcut: '' };
    },

    async handlerCreateQuickMessage() {
      try {
        this.isLoadingQuickMessage = true;
        const { shortcut, title, text } = this.quickMessageToEdit;
        await this.createQuickMessage({
          sectorUuid: this.sector.uuid,
          text,
          title,
          shortcut,
        });
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('quick_messages.successfully_added'),
            type: 'success',
          },
        });
      } catch (error) {
        console.log(error);
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('quick_messages.error'),
            type: 'error',
          },
        });
      } finally {
        this.isLoadingQuickMessage = false;
        this.closeConfigMessageDrawer();
      }
    },

    async handlerUpdateQuickMessage() {
      try {
        this.isLoadingQuickMessage = true;
        const { uuid, shortcut, title, text } = this.quickMessageToEdit;
        await this.updateQuickMessage({
          quickMessageUuid: uuid,
          shortcut: shortcut.replace('/', ''),
          title,
          text,
        });
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('quick_messages.successfully_updated'),
            type: 'success',
          },
        });
      } catch (error) {
        console.log(error);
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('quick_messages.error'),
            type: 'error',
          },
        });
      } finally {
        this.isLoadingQuickMessage = false;
        this.closeConfigMessageDrawer();
      }
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
      line-height: $unnnic-line-height-large + $unnnic-line-height-md;
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

  &__quick-message-card {
    height: 140px;
    :deep(.unnnic-simple-card-header-container__title) {
      color: $unnnic-color-neutral-darkest;
    }
  }

  &__new-message:hover {
    box-shadow: $unnnic-shadow-level-far;
  }
  &__new-message:active {
    border: 1px solid $unnnic-color-neutral-cleanest;
  }

  &__new-message {
    height: 140px;
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
    gap: $unnnic-spacing-xs;

    white-space: nowrap;
  }
}
</style>
