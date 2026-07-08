<template>
  <section class="csat-info">
    <p class="csat-info__title">{{ $t('contact_info.csat.title') }}:</p>
    <section class="csat-info__content">
      <p class="csat-info__content__note">
        {{ csatLabel }}
      </p>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import i18n from '@/plugins/i18n';

const { t } = i18n.global;

const props = defineProps({
  note: {
    type: Number,
    default: undefined,
  },
  commentary: {
    type: String,
    default: undefined,
  },
});

const csatLabel = computed(() => {
  if (!props.note) return t('contact_info.csat.rating_label.no_response');

  const noteLabel = t(`contact_info.csat.rating_label.${props.note}`);
  const commentaryLabel = props.commentary
    ? `- "${props.commentary}"`
    : `- ${t('contact_info.csat.no_comment')}`;

  const labelValue = `${noteLabel} ${commentaryLabel}`;
  return labelValue;
});
</script>

<style lang="scss" scoped>
.csat-info {
  display: flex;
  align-items: flex-start;
  gap: $unnnic-space-2;

  &__title {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-base;
  }

  &__content {
    display: flex;
    gap: $unnnic-space-1;

    &__note {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-base;
    }
  }
}
</style>
