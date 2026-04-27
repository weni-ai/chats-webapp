<template>
  <section class="representative-card">
    <section class="representative-card__representative__info">
      <UnnnicCheckbox
        :modelValue="props.selected"
        @update:model-value="emit('update:selected', $event)"
        @click.stop
      />
      <section class="representative-card__representative__container">
        <UnnnicToolTip
          enabled
          :text="statusTooltip"
        >
          <UnnnicIcon
            icon="icon-park-outline:dot"
            size="sm"
            :scheme="statusColor"
          />
        </UnnnicToolTip>
        <section class="representative-card__representative__name-container">
          <p class="representative-card__representative__name">
            {{ props.representative.name }}
          </p>
          <p class="representative-card__representative__email">
            {{ props.representative.email }}
          </p>
        </section>
      </section>
    </section>
    <section class="representative-card__representative__sectors">
      <RepresentativeSectorList
        v-if="hasSectors"
        :sectors="props.representative.sector"
      />
      <p
        v-else
        class="representative-card__representative__sectors--empty"
      >
        {{ $t('config_chats.representatives.sectors.empty') }}
      </p>
    </section>
    <section
      v-if="hasSectors"
      class="representative-card__representative__chats-limit"
    >
      <UnnnicTag
        scheme="blue"
        :text="
          $t('config_chats.representatives.chats_limit.label', {
            count: props.representative.chats_limit.active
              ? props.representative.chats_limit.total
              : props.representative.sector_chats_total_limit,
          })
        "
      />
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import RepresentativeSectorList from './SectorList.vue';

import i18n from '@/plugins/i18n';

defineOptions({
  name: 'RepresentativeCard',
});

interface RepresentativeSector {
  name: string;
  queues: string[];
}

interface Representative {
  name: string;
  status: string;
  chats_limit: {
    active: boolean;
    total: number | null;
  };
  email: string;
  sector: RepresentativeSector[];
  sector_chats_total_limit: number;
}

interface Props {
  selected: boolean;
  representative: Representative;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  'update:selected': [value: boolean];
}>();

const hasSectors = computed(() => {
  return props.representative.sector.length > 0;
});

const statusColor = computed(() => {
  const colorMap = {
    online: 'green-400',
    offline: 'gray-300',
    custom: 'orange-400',
  };
  return colorMap[
    ['online', 'offline'].includes(props.representative.status)
      ? props.representative.status
      : 'custom'
  ];
});

const statusTooltip = computed(() => {
  const isDefaultStatus = ['online', 'offline'].includes(
    props.representative.status,
  );
  return isDefaultStatus
    ? i18n.global.t(`status.${props.representative.status}`)
    : props.representative.status;
});
</script>

<style lang="scss" scoped>
.representative-card {
  display: flex;
  gap: $unnnic-space-4;
  align-items: center;
  padding: $unnnic-space-3 $unnnic-space-4;

  border-radius: $unnnic-radius-2;
  border: 1px solid $unnnic-color-border-base;
  background-color: $unnnic-color-bg-base;

  cursor: pointer;

  &:hover {
    background-color: $unnnic-color-bg-base-soft;
  }

  &__representative {
    &__info {
      display: flex;
      align-items: center;
      gap: $unnnic-space-2;
    }
    &__container {
      display: flex;
      align-items: center;
      gap: $unnnic-space-1;
    }
    &__name-container {
      display: flex;
      flex-direction: column;
    }
    &__name {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-emphasized;
    }
    &__email {
      font: $unnnic-font-caption-2;
      color: $unnnic-color-fg-base;
    }
    &__sectors {
      display: flex;
      flex: 1;
      overflow: hidden;
      &--empty {
        font: $unnnic-font-body;
        font-style: italic;
        color: $unnnic-color-fg-base;
      }
    }
  }
}
</style>
