<template>
  <section
    class="copy-value-button"
    @click="copyValue"
  >
    <UnnnicToolTip
      enabled
      :text="i18n.global.t(props.copyTooltipKey)"
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
import { UnnnicCallAlert } from '@weni/unnnic-system';
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
  side: {
    type: String,
    default: undefined,
  },
});

const fireErrorToast = () => {
  UnnnicCallAlert({
    props: {
      text: i18n.global.t('contact_info.error_copying_value'),
      type: 'error',
    },
  });
};

const copyValue = () => {
  if (!props.value) {
    return;
  }

  if (!navigator.clipboard) {
    console.error('Clipboard API not available');
    fireErrorToast();
    return;
  }

  navigator.clipboard
    .writeText(props.value)

    .then(() => {
      UnnnicCallAlert({
        props: {
          text: i18n.global.t('contact_info.value_copied'),
          type: 'success',
        },
      });
    })
    .catch((err) => {
      console.error('Failed to copy value:', err);
      fireErrorToast();
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
