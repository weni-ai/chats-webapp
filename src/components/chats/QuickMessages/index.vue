<template>
  <AsideSlotTemplate
    v-if="!isEditing && !isCreating"
    :title="$t('quick_message')"
    icon="bolt"
    :close="() => $emit('close')"
  >
    <AsideSlotTemplateSection class="messages-section__container">
      <QuickMessagesList
        @select-quick-message="selectQuickMessage"
        @edit-quick-message="quickMessageToEdit = $event"
        @delete-quick-message="quickMessageToDelete = $event"
      />

      <UnnnicButton
        v-if="isMobile"
        class="quick-messages__mobile-new"
        float
        type="primary"
        iconCenter="add"
        size="extra-large"
        @click="openQuickMessageCreation"
      />
      <UnnnicButton
        v-else
        iconLeft="add"
        :text="$t('quick_messages.new')"
        type="secondary"
        size="small"
        class="fill-w"
        @click="openQuickMessageCreation"
      />
    </AsideSlotTemplateSection>

    <template v-slot:modals>
      <UnnnicModal
        class="quick-messages__modal-delete"
        :text="$t('quick_messages.delete')"
        :description="$t('action_cannot_be_reversed')"
        scheme="feedback-red"
        modalIcon="error"
        :closeIcon="isMobile"
        @close="quickMessageToDelete = null"
        :showModal="!!quickMessageToDelete"
      >
        <template #options>
          <UnnnicButton
            :text="$t('cancel')"
            type="tertiary"
            @click="quickMessageToDelete = null"
          />
          <UnnnicButton
            :text="$t('delete')"
            type="warning"
            @click="deleteQuickMessage"
          />
        </template>
      </UnnnicModal>
    </template>
  </AsideSlotTemplate>

  <AsideSlotTemplate
    v-else
    :title="$t('quick_message')"
    icon="bolt"
    :back="() => (quickMessageToEdit = null)"
    :close="() => $emit('close')"
  >
    <AsideSlotTemplateSection class="fill-h fill-w">
      <section class="fill-h quick-messages-form">
        <h1 class="quick-messages-form__title">{{ quickMessageFormTitle }}</h1>
        <QuickMessageForm
          v-model="quickMessageToEdit"
          class="quick-messages-form__form"
          @submit="
            !!quickMessageToEdit.uuid
              ? updateQuickMessage(quickMessageToEdit)
              : createQuickMessage(quickMessageToEdit)
          "
          @cancel="quickMessageToEdit = null"
        />
      </section>
    </AsideSlotTemplateSection>
  </AsideSlotTemplate>
</template>

<script>
import isMobile from 'is-mobile';
import { mapActions } from 'vuex';

import AsideSlotTemplate from '@/components/layouts/chats/AsideSlotTemplate';
import AsideSlotTemplateSection from '@/components/layouts/chats/AsideSlotTemplate/Section';

import callUnnnicAlert from '@/utils/callUnnnicAlert';

import QuickMessagesList from './QuickMessagesList';
import QuickMessageForm from './QuickMessageForm';

export default {
  name: 'QuickMessages',

  components: {
    AsideSlotTemplate,
    AsideSlotTemplateSection,
    QuickMessagesList,
    QuickMessageForm,
  },

  data: () => ({
    isMobile: isMobile(),

    quickMessageToDelete: null,
    quickMessageToEdit: null,
  }),

  computed: {
    isEditing() {
      const { quickMessageToEdit } = this;
      return quickMessageToEdit && quickMessageToEdit.uuid;
    },
    isCreating() {
      const { quickMessageToEdit } = this;
      return quickMessageToEdit && !quickMessageToEdit.uuid;
    },

    quickMessageFormTitle() {
      if (this.isEditing) {
        return this.$t('quick_messages.edit');
      }

      if (this.isCreating) {
        return this.$t('quick_messages.add');
      }

      return '';
    },

    emptyQuickMessage() {
      return { title: '', text: '', shortcut: null };
    },
  },

  methods: {
    ...mapActions({
      actionCreateQuickMessage: 'chats/quickMessages/create',
      actionUpdateQuickMessage: 'chats/quickMessages/update',
      actionDeleteQuickMessage: 'chats/quickMessages/delete',
    }),

    async createQuickMessage({ title, text, shortcut }) {
      this.actionCreateQuickMessage({ title, text, shortcut });

      callUnnnicAlert({
        props: {
          text: this.$t('quick_messages.successfully_added'),
          type: 'success',
          scheme: 'feedback-green',
          onClose: this.$t('close'),
        },
        seconds: 5,
      });

      this.quickMessageToEdit = null;
    },
    async updateQuickMessage({ uuid, title, text, shortcut }) {
      this.actionUpdateQuickMessage({ uuid, title, text, shortcut });

      callUnnnicAlert({
        props: {
          text: this.$t('quick_messages.successfully_updated'),
          type: 'success',
        },
        seconds: 5,
      });

      this.quickMessageToEdit = null;
    },
    openQuickMessageCreation() {
      this.quickMessageToEdit = this.emptyQuickMessage;
    },
    async deleteQuickMessage() {
      const { uuid } = this.quickMessageToDelete;

      this.actionDeleteQuickMessage(uuid);
      this.quickMessageToDelete = null;
    },
    selectQuickMessage(quickMessage) {
      if (this.isMobile) {
        this.quickMessageToEdit = quickMessage;
      } else {
        this.$emit('select-quick-message', quickMessage);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.fill-h {
  height: 100%;
}

.fill-w {
  width: 100%;
}

.messages-section__container {
  height: 100%;
  width: 100%;

  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-sm;

  overflow: hidden;
}

.quick-messages__modal-delete {
  :deep(.unnnic-modal-container) .unnnic-modal-container-background {
    &-body-description {
      text-align: center;
    }
    &-button :first-child {
      margin-right: $unnnic-spacing-xs;
    }
  }
}

.quick-messages-form {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-sm;

  &__title {
    font-size: $unnnic-font-size-body-lg;
    font-weight: $unnnic-font-weight-regular;
    color: $unnnic-color-neutral-dark;
  }

  &__form {
    flex: 1 1;
  }
}
.quick-messages__mobile-new {
  margin: 0 $unnnic-spacing-ant $unnnic-spacing-md 0;
}
</style>
