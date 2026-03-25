<template>
  <section
    v-if="protocol?.length > 0"
    class="protocol-text"
    @click="copyProtocol"
  >
    <UnnnicToolTip
      enabled
      :text="tooltipProtocolText"
      side="left"
    >
      <section class="protocol-text__ticket">
        <p class="protocol-text__ticket-title">
          {{ $t('contact_info.ticket') }}:
        </p>
        <p class="protocol-text__ticket-value">
          {{ protocol }}
        </p>
        <UnnnicIconSvg
          icon="content_copy"
          scheme="neutral-cloudy"
          size="sm"
        />
      </section>
    </UnnnicToolTip>
  </section>
</template>

<script setup>
import { ref, computed } from 'vue';
import i18n from '@/plugins/i18n';

const props = defineProps({
  protocol: {
    type: String,
    required: true,
  },
});

const isCopyProtocol = ref(false);

const tooltipProtocolText = computed(() => {
  return isCopyProtocol.value
    ? i18n.global.t('contact_info.protocol_copied')
    : i18n.global.t('contact_info.copy_protocol');
});

const copyProtocol = () => {
  if (!props.protocol) return;

  navigator.clipboard
    .writeText(props.protocol)
    .then(() => {
      isCopyProtocol.value = true;
      setTimeout(() => {
        isCopyProtocol.value = false;
      }, 3000);
    })
    .catch((err) => {
      console.error('Failed to copy protocol:', err);
    });
};
</script>

<style lang="scss" scoped>
.protocol-text {
  .protocol-text__ticket {
    display: flex;
    align-items: center;
    gap: $unnnic-space-1;
    cursor: pointer;

    &-title {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-base;
    }

    &-value {
      font: $unnnic-font-body;
      color: $unnnic-color-fg-base;
    }
  }
}
</style>
