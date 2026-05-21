<template>
  <div
    class="variable-input"
    :data-testid="dataTestid"
  >
    <UnnnicPopover
      v-if="hasLocalVariables"
      v-model:open="isPopoverOpen"
    >
      <UnnnicPopoverTrigger :asChild="true">
        <UnnnicInput
          class="variable-input__input"
          :modelValue="displayValue"
          :label="label"
          :placeholder="placeholder"
          :readonly="isTokenMode"
          iconRight="keyboard_arrow_down"
          iconRightClickable
          :showClear="isTokenMode"
          :data-testid="`${dataTestid}-input`"
          @update:model-value="handleInput"
          @clear="handleClear"
          @click="openPopover"
          @focus="openPopover"
        />
      </UnnnicPopoverTrigger>

      <UnnnicPopoverContent
        side="bottom"
        align="start"
        :sideOffset="4"
        width="var(--reka-popper-anchor-width)"
        class="variable-input__popover"
        :data-testid="`${dataTestid}-popover`"
      >
        <section class="variable-input__options">
          <button
            v-for="lv in localVariables"
            :key="lv.token"
            type="button"
            class="variable-input__option"
            :class="{
              'variable-input__option--active':
                lv.token === selectedToken?.token,
            }"
            :data-testid="`${dataTestid}-option-${lv.token}`"
            @click="selectOption(lv)"
          >
            {{ $t(lv.labelKey) }}
          </button>
        </section>
      </UnnnicPopoverContent>
    </UnnnicPopover>

    <UnnnicInput
      v-else
      class="variable-input__input"
      :modelValue="displayValue"
      :label="label"
      :placeholder="placeholder"
      :data-testid="`${dataTestid}-input`"
      @update:model-value="handleInput"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';

import i18n from '@/plugins/i18n';

import type { LocalVariable } from './localVariables';

defineOptions({
  name: 'VariableInput',
});

interface Props {
  modelValue: string;
  label?: string;
  placeholder?: string;
  localVariables?: LocalVariable[];
  dataTestid?: string;
}

const props = withDefaults(defineProps<Props>(), {
  label: '',
  placeholder: '',
  localVariables: () => [],
  dataTestid: 'variable-input',
});

const emit = defineEmits<{
  'update:modelValue': [value: string];
}>();

const isPopoverOpen = ref(false);

const hasLocalVariables = computed(() => props.localVariables.length > 0);

const selectedToken = computed<LocalVariable | null>(
  () =>
    props.localVariables.find((lv) => lv.token === props.modelValue) ?? null,
);

const isTokenMode = computed(() => selectedToken.value !== null);

const displayValue = computed(() => {
  if (selectedToken.value) return i18n.global.t(selectedToken.value.labelKey);
  return props.modelValue ?? '';
});

const openPopover = () => {
  if (hasLocalVariables.value) isPopoverOpen.value = true;
};

const handleInput = (value: string) => {
  if (isTokenMode.value) return;
  emit('update:modelValue', value);
};

const handleClear = () => {
  emit('update:modelValue', '');
  isPopoverOpen.value = true;
};

const selectOption = (lv: LocalVariable) => {
  emit('update:modelValue', lv.token);
  isPopoverOpen.value = false;
};
</script>

<style lang="scss" scoped>
.variable-input {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-1;
  width: 100%;

  &__input {
    width: 100%;
  }

  &__popover {
    padding: $unnnic-space-4;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    width: 100%;
  }

  &__option {
    appearance: none;
    border: none;
    background: $unnnic-color-bg-base;
    color: $unnnic-color-fg-emphasized;
    font: $unnnic-font-emphasis;
    letter-spacing: $unnnic-font-letter-spacing-emphasis;
    text-align: start;

    padding: $unnnic-space-2 $unnnic-space-4;
    border-radius: $unnnic-radius-1;

    cursor: pointer;

    &:hover {
      background: $unnnic-color-bg-base-soft;
    }

    &--active {
      background: $unnnic-color-bg-accent-strong;
      color: $unnnic-color-fg-on-primary;

      font: $unnnic-font-action;
      letter-spacing: $unnnic-font-letter-spacing-action;

      &:hover {
        background: $unnnic-color-bg-accent-strong;
      }
    }
  }
}
</style>
