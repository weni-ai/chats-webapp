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
      class="protocol-text__ticket"
    >
      <p class="protocol-text__ticket-title">
        {{ $t('contact_info.ticket') }}
      </p>
      <p class="protocol-text__ticket-value">
        {{ protocol }}
      </p>
      <UnnnicIconSvg
        icon="content_copy"
        scheme="neutral-cloudy"
        size="sm"
      />
    </UnnnicToolTip>
  </section>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import i18n from '@/plugins/i18n';

interface Props {
  protocol: string;
}

const props = defineProps<Props>();

const isCopyProtocol = ref<boolean>(false);

const tooltipProtocolText = computed(() => {
  return isCopyProtocol.value
    ? i18n.global.t('contact_info.protocol_copied')
    : i18n.global.t('contact_info.copy_protocol');
});

const copyProtocol = (): void => {
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
    gap: $unnnic-spacing-nano;
    cursor: pointer;

    &-title {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-lg;
      font-weight: $unnnic-font-weight-bold;
      line-height: $unnnic-font-size-body-lg + $unnnic-line-height-md;
    }

    &-value {
      font-weight: $unnnic-font-weight-bold;
      color: $unnnic-color-neutral-dark;
      font-family: $unnnic-font-family-secondary;
      font-size: $unnnic-font-size-body-lg;
      font-weight: $unnnic-font-weight-regular;
      line-height: $unnnic-font-size-body-lg + $unnnic-line-height-md;
    }
  }
}
</style>
