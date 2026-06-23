<template>
  <section
    class="copy-value-button"
    @click="copyValue"
  >
    <UnnnicToolTip
      enabled
      :text="tooltipText"
      :side="side"
    >
      <UnnnicIconSvg
        class="copy-value-button__icon"
        icon="content_copy"
        scheme="fg-base"
        size="ant"
      />
    </UnnnicToolTip>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import i18n from '@/plugins/i18n';

defineOptions({
  name: 'CopyValueButton',
});

const props = defineProps({
  value: {
    type: String,
    default: '',
  },
  copyTooltipKey: {
    type: String,
    default: 'contact_info.copy_value',
  },
  copiedTooltipKey: {
    type: String,
    default: 'contact_info.value_copied',
  },
  side: {
    type: String,
    default: undefined,
  },
});

const isCopied = ref(false);

const tooltipText = computed(() =>
  isCopied.value
    ? i18n.global.t(props.copiedTooltipKey)
    : i18n.global.t(props.copyTooltipKey),
);

const copyValue = () => {
  if (!props.value) {
    return;
  }

  navigator.clipboard
    .writeText(props.value)
    .then(() => {
      isCopied.value = true;
      setTimeout(() => {
        isCopied.value = false;
      }, 3000);
    })
    .catch((err) => {
      console.error('Failed to copy value:', err);
    });
};
</script>

<style lang="scss" scoped>
.copy-value-button {
  &__icon {
    cursor: pointer;
  }
}
</style>
