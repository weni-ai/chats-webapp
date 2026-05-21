<template>
  <section
    v-if="enableAutomaticCsatFeature"
    class="satisfaction-survey-section"
  >
    <h2
      class="satisfaction-survey-section__title"
      data-testid="satisfaction-survey-title"
    >
      {{ $t('sector.additional_options.csat.section_title') }}
    </h2>

    <UnnnicSwitch
      :modelValue="sector.is_csat_enabled"
      :textRight="$t('sector.additional_options.csat.label')"
      :helper="$t('sector.additional_options.csat.hint')"
      size="small"
      data-testid="satisfaction-survey-switch"
      @update:model-value="handleEnabledChange"
    />

    <section
      v-if="sector.is_csat_enabled"
      class="satisfaction-survey-section__options"
      data-testid="satisfaction-survey-options"
    >
      <section class="satisfaction-survey-section__group">
        <section
          class="satisfaction-survey-section__group__label"
          data-testid="csat-type-label"
        >
          {{ $t('sector.additional_options.csat.type.label') }}
          <UnnnicToolTip
            enabled
            side="right"
            :text="$t('sector.additional_options.csat.type.tooltip')"
            maxWidth="23rem"
          >
            <UnnnicIconSvg
              icon="ri:question-line"
              scheme="fg-base"
              size="sm"
            />
          </UnnnicToolTip>
        </section>
        <section class="satisfaction-survey-section__radios">
          <UnnnicRadio
            :modelValue="csatType"
            value="default"
            data-testid="csat-type-default"
            @update:model-value="handleTypeChange"
          >
            {{ $t('sector.additional_options.csat.type.default') }}
          </UnnnicRadio>
          <UnnnicRadio
            :modelValue="csatType"
            value="custom"
            data-testid="csat-type-custom"
            @update:model-value="handleTypeChange"
          >
            {{ $t('sector.additional_options.csat.type.custom') }}
          </UnnnicRadio>
        </section>
      </section>

      <template v-if="csatType === 'custom'">
        <SelectFlow
          :modelValue="sector.custom_csat_flow_uuid || ''"
          data-testid="csat-flow-select"
          @update:model-value="handleFlowChange"
        />
        <UnnnicDisclaimer
          type="attention"
          :description="
            $t('sector.additional_options.csat.custom.flow_disclaimer')
          "
          data-testid="csat-custom-disclaimer"
        />
      </template>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { storeToRefs } from 'pinia';

import SelectFlow from '@/components/chats/FlowsTrigger/SelectFlow.vue';

import { useFeatureFlag } from '@/store/modules/featureFlag';

import type { Sector } from '@/types/Sector';

type CsatType = 'default' | 'custom';

defineOptions({
  name: 'SatisfactionSurveySection',
});

const props = defineProps<{
  modelValue: Sector;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: Sector];
  'change-is-valid': [value: boolean];
}>();

const { featureFlags } = storeToRefs(useFeatureFlag());

const sector = computed<Sector>({
  get: () => props.modelValue,
  set: (value: Sector) => emit('update:modelValue', value),
});

const enableAutomaticCsatFeature = computed<boolean>(() =>
  Boolean(featureFlags.value.active_features?.includes('weniChatsCSAT')),
);

const csatType = ref<CsatType>(
  props.modelValue.custom_csat_flow_uuid ? 'custom' : 'default',
);

watch(
  () => props.modelValue.custom_csat_flow_uuid,
  (uuid) => {
    if (uuid && csatType.value !== 'custom') csatType.value = 'custom';
  },
);

watch(
  () => props.modelValue.is_csat_enabled,
  (enabled) => {
    if (!enabled) csatType.value = 'default';
  },
);

const isValid = computed<boolean>(
  () =>
    !sector.value.is_csat_enabled ||
    csatType.value === 'default' ||
    (csatType.value === 'custom' && !!sector.value.custom_csat_flow_uuid),
);

watch(
  isValid,
  (value) => {
    emit('change-is-valid', value);
  },
  { immediate: true },
);

const handleEnabledChange = (value: boolean): void => {
  csatType.value = 'default';
  sector.value = {
    ...sector.value,
    is_csat_enabled: value,
    custom_csat_flow_uuid: null,
  };
};

const handleTypeChange = (value: CsatType): void => {
  csatType.value = value;

  if (value === 'default' && sector.value.custom_csat_flow_uuid !== null) {
    sector.value = {
      ...sector.value,
      custom_csat_flow_uuid: null,
    };
  }
};

const handleFlowChange = (value: string): void => {
  sector.value = {
    ...sector.value,
    custom_csat_flow_uuid: value || null,
  };
};

defineExpose({
  csatType,
  enableAutomaticCsatFeature,
  isValid,
  handleEnabledChange,
  handleTypeChange,
  handleFlowChange,
});
</script>

<style lang="scss" scoped>
.satisfaction-survey-section {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-2;

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-base;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
    margin-top: $unnnic-space-1;
  }

  &__group {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;

    &__label {
      display: flex;
      align-items: center;
      gap: $unnnic-space-1;
      color: $unnnic-color-fg-base;
      font: $unnnic-font-body;

      :deep(.unnnic-tooltip) {
        display: flex;
      }
    }
  }

  &__radios {
    display: flex;
    gap: $unnnic-space-6;
  }
}
</style>
