<template>
  <section
    class="quick-message-card"
    @click="emit('edit', props.quickMessage)"
  >
    <section class="quick-message-card__info">
      <h1 class="quick-message-card__title">
        {{ `/${props.quickMessage.shortcut}` }}
      </h1>
      <p
        :title="props.quickMessage.text"
        class="quick-message-card__text"
      >
        {{ props.quickMessage.text }}
      </p>
    </section>
    <section
      class="quick-message-card__actions"
      @click.stop
    >
      <UnnnicPopover
        :open="openPopover"
        @update:open="openPopover = $event"
      >
        <UnnnicPopoverTrigger>
          <UnnnicButton
            iconCenter="more_vert"
            type="tertiary"
          />
        </UnnnicPopoverTrigger>
        <UnnnicPopoverContent size="small">
          <UnnnicPopoverOption
            :label="$t('edit')"
            icon="edit_square"
            @click="emitEdit"
          />
          <UnnnicPopoverOption
            :label="$t('delete')"
            icon="delete"
            scheme="fg-critical"
            @click="showModalConfirmDelete()"
          />
        </UnnnicPopoverContent>
      </UnnnicPopover>
    </section>
    <ModalConfirmDelete
      v-if="openModalConfirmDelete"
      v-model="openModalConfirmDelete"
      :title="titleModalConfirmDelete"
      :description="
        $t('quick_messages.delete_description', {
          shortcut: '/' + props.quickMessage.shortcut,
        })
      "
      :confirmText="'/' + props.quickMessage.shortcut"
      :isLoading="isLoadingDelete"
      @confirm="deleteQuickMessage"
      @cancel="openModalConfirmDelete = false"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';
import { UnnnicToastManager, UnnnicCallAlert } from '@weni/unnnic-system';

import ModalConfirmDelete from '@/components/ModalConfirmDelete.vue';

import type { QuickMessage } from '@/types/QuickMessages';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

defineOptions({
  name: 'QuickMessageCard',
});

interface Props {
  quickMessage: QuickMessage;
}
const props = defineProps<Props>();

const emit = defineEmits<{
  edit: [QuickMessage];
  delete: [QuickMessage];
}>();

const quickMessageShared = useQuickMessageShared();
const { delete: deleteQuickMessageShared } = quickMessageShared;

const openPopover = ref(false);
const openModalConfirmDelete = ref(false);
const isLoadingDelete = ref(false);

const titleModalConfirmDelete = computed(() => {
  return `${t('delete')} /${props.quickMessage.shortcut}`;
});

const showModalConfirmDelete = () => {
  openPopover.value = false;
  openModalConfirmDelete.value = true;
};

const emitEdit = () => {
  openPopover.value = false;
  emit('edit', props.quickMessage);
};

const deleteQuickMessage = async () => {
  try {
    isLoadingDelete.value = true;
    await deleteQuickMessageShared(props.quickMessage.uuid);
    UnnnicCallAlert({
      props: {
        text: t('quick_messages.successfully_deleted'),
        type: 'success',
      },
    });
  } catch (error) {
    console.error(error);
    UnnnicToastManager.error(t('quick_messages.error_deleting'), '', {
      button: {
        text: t('try_again'),
        action: () => showModalConfirmDelete(),
      },
    });
  } finally {
    openModalConfirmDelete.value = false;
    isLoadingDelete.value = false;
  }
};
</script>

<style lang="scss" scoped>
.quick-message-card {
  display: flex;
  width: 100%;
  height: 100%;
  padding: $unnnic-space-6;

  border-radius: $unnnic-radius-2;
  border: 1px solid $unnnic-color-border-base;

  cursor: pointer;

  &__info {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    width: 100%;
  }
  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    flex: 1;
  }
  &__text {
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;
    -webkit-line-clamp: 1;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
