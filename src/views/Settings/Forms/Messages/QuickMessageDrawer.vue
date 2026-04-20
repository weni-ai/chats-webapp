<template>
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
    @close="showQuickMessageDrawer = false"
    @primary-button-click="
      quickMessageToEdit.uuid
        ? handlerUpdateQuickMessage()
        : handlerCreateQuickMessage()
    "
    @secondary-button-click="showQuickMessageDrawer = false"
  >
    <template #content>
      <MessageForm
        v-model="quickMessageToEdit"
        data-testid="quick-message-form"
      />
    </template>
  </UnnnicDrawer>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

import MessageForm from '@/views/Settings/Forms/Messages/MessageInputsForm.vue';

import { useQuickMessageShared } from '@/store/modules/chats/quickMessagesShared';

import { UnnnicCallAlert } from '@weni/unnnic-system';

import i18n from '@/plugins/i18n';

import type { QuickMessage } from '@/types/QuickMessages';

defineOptions({
  name: 'QuickMessageDrawer',
});

const { t } = i18n.global;

const quickMessageSharedStore = useQuickMessageShared();
const { create: createQuickMessageShared, update: updateQuickMessageShared } =
  quickMessageSharedStore;

interface Props {
  modelValue: boolean;
  quickMessage?: QuickMessage;
  sector: string;
}

const props = withDefaults(defineProps<Props>(), {
  quickMessage: () => ({
    text: '',
    shortcut: '',
  }),
});

const emit = defineEmits<{
  'update:modelValue': [value: boolean];
  'update:quickMessageToEdit': [value: QuickMessage];
}>();

const showQuickMessageDrawer = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const quickMessageToEdit = ref<QuickMessage>({ shortcut: '', text: '' });

const validQuickMessage = computed(() => {
  return quickMessageToEdit.value.text && quickMessageToEdit.value.shortcut;
});

const isLoadingQuickMessage = ref(false);

const handlerCreateQuickMessage = async () => {
  try {
    isLoadingQuickMessage.value = true;
    const { shortcut, text } = quickMessageToEdit.value;
    await createQuickMessageShared({
      sectorUuid: props.sector,
      text,
      title: '',
      shortcut,
    });
    UnnnicCallAlert({
      props: {
        text: t('quick_messages.successfully_added'),
        type: 'success',
      },
    });
  } catch (error) {
    console.error('error create quick message', error);
    UnnnicCallAlert({
      props: {
        text: t('quick_messages.error'),
        type: 'error',
      },
    });
  } finally {
    isLoadingQuickMessage.value = false;
    showQuickMessageDrawer.value = false;
  }
};

const handlerUpdateQuickMessage = async () => {
  try {
    isLoadingQuickMessage.value = true;
    const { uuid, shortcut, text } = quickMessageToEdit.value;
    await updateQuickMessageShared({
      title: '',
      quickMessageUuid: uuid,
      shortcut: shortcut.replace('/', ''),
      text,
    });
    UnnnicCallAlert({
      props: {
        text: t('quick_messages.successfully_updated'),
        type: 'success',
      },
    });
  } catch (error) {
    console.error('error update quick message', error);
    UnnnicCallAlert({
      props: {
        text: t('quick_messages.error'),
        type: 'error',
      },
    });
  } finally {
    isLoadingQuickMessage.value = false;
    showQuickMessageDrawer.value = false;
  }
};

onMounted(() => {
  if (props.quickMessage) {
    quickMessageToEdit.value = { ...props.quickMessage };
  }
});
</script>

<style lang="scss" scoped>
.quick-message-drawer {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
}
</style>
