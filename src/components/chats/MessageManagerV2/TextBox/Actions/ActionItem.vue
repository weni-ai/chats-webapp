<template>
  <section class="text-box__actions__item">
    <UnnnicToolTip
      :enabled="!!tooltip"
      :text="tooltip"
      side="top"
    >
      <UnnnicButton
        :iconCenter="icon"
        :tooltip="tooltip"
        :disabled="isDisabled"
        type="tertiary"
        size="small"
        :pressed="pressed"
        @click.stop="emit('click')"
      />
    </UnnnicToolTip>
  </section>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useMessageManager } from '@/store/modules/chats/messageManager';
import { computed } from 'vue';

defineOptions({
  name: 'TextBoxActionItem',
});

const props = defineProps<{
  icon: string;
  tooltip?: string;
  disabled?: boolean;
  pressed?: boolean;
  showDivider?: boolean;
  disableFromParent?: boolean;
}>();

const emit = defineEmits<{
  click: [void];
}>();

const messageManager = useMessageManager();
const { isDisabledInput } = storeToRefs(messageManager);

const isDisabled = computed(() => {
  return isDisabledInput.value || props.disabled || props.disableFromParent;
});
</script>
