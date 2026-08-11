<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-variable-mapping"
    data-testid="modal-variable-mapping"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          <span class="modal-variable-mapping__title">
            {{ $t('flows_trigger.variable_mapping.title') }}
            <UnnnicTag
              scheme="blue"
              type="default"
              size="medium"
              :text="tagText"
              data-testid="modal-variable-mapping-tag"
            />
          </span>
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>

      <section
        class="modal-variable-mapping__content"
        data-testid="modal-variable-mapping-content"
      >
        <UnnnicDisclaimer
          type="neutral"
          :description="$t('flows_trigger.variable_mapping.description')"
          data-testid="modal-variable-mapping-disclaimer"
        />

        <section class="modal-variable-mapping__scroll-area">
          <section class="modal-variable-mapping__columns">
            <section class="modal-variable-mapping__form">
              <p class="modal-variable-mapping__form-title">
                {{ defineVariablesLabel }}
              </p>
              <VariableInput
                v-for="(variableName, index) in currentVariables"
                :key="`${currentIndex}-${variableName}`"
                v-model="values[variableName]"
                :label="
                  $t('flows_trigger.variable_mapping.variable_label', {
                    name: variableName,
                  })
                "
                :placeholder="
                  $t('flows_trigger.variable_mapping.input_placeholder')
                "
                :localVariables="localVariables"
                :disabled="isVariableLocked(variableName)"
                :dataTestid="`modal-variable-mapping-input-${index}`"
              />
            </section>

            <MetaTemplatePreview
              class="modal-variable-mapping__preview"
              :template="currentTemplateData"
              :variables="currentVariables"
              :variableValues="previewValues"
              :titleLabel="previewTitleLabel"
            />
          </section>
        </section>

        <section
          v-if="isLastStep"
          class="modal-variable-mapping__confirmation"
        >
          <p class="modal-variable-mapping__confirmation-helper">
            {{ $t('flows_trigger.variable_mapping.confirmation_helper') }}
          </p>
          <UnnnicCheckbox
            v-model="isConfirmed"
            :textRight="
              $t('flows_trigger.variable_mapping.confirmation_checkbox')
            "
            data-testid="modal-variable-mapping-confirmation"
          />
        </section>
      </section>

      <UnnnicDialogFooter>
        <section class="modal-variable-mapping__footer">
          <UnnnicButton
            v-if="isFirstStep"
            :text="$t('cancel')"
            type="tertiary"
            data-testid="modal-variable-mapping-cancel"
            @click="onCancel"
          />
          <UnnnicButton
            v-else
            :text="$t('back')"
            type="tertiary"
            data-testid="modal-variable-mapping-back"
            @click="onBack"
          />
          <UnnnicButton
            v-if="!isLastStep"
            :text="$t('flows_trigger.variable_mapping.next_template')"
            type="primary"
            :disabled="!canAdvance"
            data-testid="modal-variable-mapping-next"
            @click="onNext"
          />
          <UnnnicButton
            v-else
            :text="sendLabel"
            type="primary"
            :disabled="!canConfirm"
            :loading="isLoading"
            data-testid="modal-variable-mapping-confirm"
            @click="onConfirm"
          />
        </section>
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import i18n from '@/plugins/i18n';

import MetaTemplatePreview from './MetaTemplatePreview.vue';
import VariableInput from './VariableInput.vue';

import { formatOrdinal } from '@/utils/ordinal';

import type { FlowTemplate, MetaTemplate } from './types';
import type { LocalVariable } from '@/utils/localVariables';

defineOptions({
  name: 'ModalVariableMapping',
});

interface Props {
  templates: FlowTemplate[];
  totalTemplateQty?: number;
  localVariables?: LocalVariable[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  totalTemplateQty: undefined,
  localVariables: () => [],
  isLoading: false,
});

const emit = defineEmits<{
  close: [];
  confirm: [params: Record<string, string>];
}>();

// Variables are global by name: the same name reused across templates shares a
// single value. Initialize one entry per unique variable name across all
// templates.
const buildInitialValues = (templates: FlowTemplate[]) => {
  const values: Record<string, string> = {};
  templates.forEach((template) => {
    (template.variables ?? []).forEach((name) => {
      if (!(name in values)) values[name] = '';
    });
  });
  return values;
};

const isOpen = ref(true);
const isConfirmed = ref(false);
const currentIndex = ref(0);
const values = ref<Record<string, string>>(buildInitialValues(props.templates));

const totalQty = computed(
  () => props.totalTemplateQty ?? props.templates.length,
);

const currentTemplate = computed<FlowTemplate | undefined>(
  () => props.templates[currentIndex.value],
);

const currentTemplateData = computed<MetaTemplate>(
  () => currentTemplate.value?.data ?? ({} as MetaTemplate),
);

const currentVariables = computed<string[]>(
  () => currentTemplate.value?.variables ?? [],
);

// First template index where each variable name appears. A variable is editable
// only on its first appearance and locked (read-only, prefilled) afterwards.
const firstStepIndexByVariable = computed<Record<string, number>>(() => {
  const indexes: Record<string, number> = {};
  props.templates.forEach((template, index) => {
    (template.variables ?? []).forEach((name) => {
      if (!(name in indexes)) indexes[name] = index;
    });
  });
  return indexes;
});

const isVariableLocked = (name: string): boolean =>
  firstStepIndexByVariable.value[name] !== currentIndex.value;

const isFirstStep = computed(() => currentIndex.value === 0);

const isLastStep = computed(
  () => currentIndex.value >= props.templates.length - 1,
);

const ordinalLabel = computed(() =>
  formatOrdinal(currentIndex.value + 1, i18n.global.locale.value as string),
);

const tagText = computed(() =>
  i18n.global.t('flows_trigger.variable_mapping.title_tag', {
    current: currentIndex.value + 1,
    total: totalQty.value,
  }),
);

const defineVariablesLabel = computed(() =>
  i18n.global.t('flows_trigger.variable_mapping.define_variables_ordinal', {
    ordinal: ordinalLabel.value,
  }),
);

const previewTitleLabel = computed(() =>
  i18n.global.t('flows_trigger.variable_mapping.preview_title_ordinal', {
    ordinal: ordinalLabel.value,
  }),
);

const sendLabel = computed(() =>
  i18n.global.t('flows_trigger.variable_mapping.send_templates', {
    count: totalQty.value,
  }),
);

const areCurrentVariablesFilled = computed(() =>
  currentVariables.value.every(
    (name) => (values.value[name] ?? '').trim().length > 0,
  ),
);

const canAdvance = computed(() => areCurrentVariablesFilled.value);

const canConfirm = computed(
  () => isConfirmed.value && areCurrentVariablesFilled.value,
);

const previewValues = computed<Record<string, string>>(() => {
  const result: Record<string, string> = {};
  currentVariables.value.forEach((name) => {
    let resolved = values.value[name] ?? '';
    props.localVariables.forEach((lv) => {
      if (resolved.includes(lv.token)) {
        resolved = resolved.split(lv.token).join(lv.previewValue);
      }
    });
    result[name] = resolved;
  });
  return result;
});

// Variables are shared across templates, so a single map keyed by name is the
// final payload (one value per variable name).
const buildConfirmParams = (): Record<string, string> => ({ ...values.value });

watch(
  () => props.templates,
  (templates) => {
    currentIndex.value = 0;
    isConfirmed.value = false;
    values.value = buildInitialValues(templates);
  },
);

watch(isOpen, (value) => {
  if (!value) emit('close');
});

const onCancel = () => {
  isOpen.value = false;
};

const onBack = () => {
  if (!isFirstStep.value) currentIndex.value -= 1;
};

const onNext = () => {
  if (canAdvance.value && !isLastStep.value) currentIndex.value += 1;
};

const onConfirm = () => {
  if (!canConfirm.value) return;
  emit('confirm', buildConfirmParams());
};
</script>

<style lang="scss" scoped>
.modal-variable-mapping {
  &__title {
    display: inline-flex;
    align-items: center;
    gap: $unnnic-space-2;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;

    padding: $unnnic-space-6;

    text-align: start;

    flex: 1 1 auto;
    min-height: 0;
  }

  &__scroll-area {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }

  &__columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $unnnic-space-2;
    align-items: start;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
  }

  &__form-title {
    color: $unnnic-color-fg-emphasized;
    font: $unnnic-font-emphasis;
  }

  &__preview {
    align-self: stretch;
    position: sticky;
    top: 0;
  }

  &__confirmation {
    flex: 0 0 auto;

    display: flex;
    flex-direction: column;
    gap: $unnnic-space-3;
  }

  &__confirmation-helper {
    color: $unnnic-color-fg-base;
    font: $unnnic-font-body;
  }

  &__footer {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: $unnnic-space-2;

    width: 100%;
  }
}
</style>
