<template>
  <UnnnicDialog
    v-model:open="isOpen"
    class="modal-variable-mapping"
    data-testid="modal-variable-mapping"
  >
    <UnnnicDialogContent size="large">
      <UnnnicDialogHeader>
        <UnnnicDialogTitle>
          {{ $t('flows_trigger.variable_mapping.title') }}
        </UnnnicDialogTitle>
      </UnnnicDialogHeader>

      <section
        class="modal-variable-mapping__content"
        data-testid="modal-variable-mapping-content"
      >
        <p class="modal-variable-mapping__description">
          {{ $t('flows_trigger.variable_mapping.description') }}
        </p>

        <section class="modal-variable-mapping__scroll-area">
          <section class="modal-variable-mapping__columns">
            <section class="modal-variable-mapping__form">
              <p class="modal-variable-mapping__form-title">
                {{ $t('flows_trigger.variable_mapping.define_variables') }}
              </p>
              <UnnnicInput
                v-for="(variableName, index) in variables"
                :key="variableName"
                v-model="variableValues[variableName]"
                :label="
                  $t('flows_trigger.variable_mapping.variable_label', {
                    index: index + 1,
                  })
                "
                :placeholder="
                  $t('flows_trigger.variable_mapping.input_placeholder')
                "
                :data-testid="`modal-variable-mapping-input-${index}`"
              />
            </section>

            <MetaTemplatePreview
              class="modal-variable-mapping__preview"
              :template="template"
              :variables="variables"
              :variableValues="variableValues"
            />
          </section>
        </section>

        <section class="modal-variable-mapping__confirmation">
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
        <UnnnicButton
          :text="$t('cancel')"
          type="tertiary"
          data-testid="modal-variable-mapping-cancel"
          @click="onCancel"
        />
        <UnnnicButton
          :text="$t('send')"
          type="primary"
          :disabled="!canConfirm"
          :loading="isLoading"
          data-testid="modal-variable-mapping-confirm"
          @click="onConfirm"
        />
      </UnnnicDialogFooter>
    </UnnnicDialogContent>
  </UnnnicDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

import MetaTemplatePreview from './MetaTemplatePreview.vue';

import type { MetaTemplate } from './types';

defineOptions({
  name: 'ModalVariableMapping',
});

interface Props {
  template: MetaTemplate;
  variables: string[];
  isLoading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
});

const emit = defineEmits<{
  close: [];
  confirm: [params: Record<string, string>];
}>();

const isOpen = ref(true);
const isConfirmed = ref(false);
const variableValues = ref<Record<string, string>>(
  props.variables.reduce<Record<string, string>>((acc, name) => {
    acc[name] = '';
    return acc;
  }, {}),
);

const areAllVariablesFilled = computed(() =>
  props.variables.every(
    (name) => (variableValues.value[name] ?? '').trim().length > 0,
  ),
);

const canConfirm = computed(
  () => isConfirmed.value && areAllVariablesFilled.value,
);

watch(isOpen, (value) => {
  if (!value) emit('close');
});

const onCancel = () => {
  isOpen.value = false;
};

const onConfirm = () => {
  if (!canConfirm.value) return;
  emit('confirm', { ...variableValues.value });
};
</script>

<style lang="scss" scoped>
.modal-variable-mapping {
  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-sm;

    padding: $unnnic-spacing-md;

    text-align: start;

    flex: 1 1 auto;
    min-height: 0;
  }

  &__description {
    flex: 0 0 auto;

    color: $unnnic-color-neutral-dark;
    font: $unnnic-font-body;
  }

  &__scroll-area {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
  }

  &__columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: $unnnic-spacing-xs;
    align-items: start;
  }

  &__form {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-xs;
  }

  &__form-title {
    color: $unnnic-color-neutral-darkest;
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
    gap: $unnnic-spacing-ant;
  }

  &__confirmation-helper {
    color: $unnnic-color-neutral-dark;
    font: $unnnic-font-body;
  }
}
</style>
