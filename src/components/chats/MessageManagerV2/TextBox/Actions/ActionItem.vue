<template>
  <section class="text-box__actions__item">
    <UnnnicToolTip
      :enabled="!!tooltip"
      :text="tooltip"
      side="top"
    >
      <UnnnicButton
        :iconCenter="icon"
        :tooltip="tooltip"
        :disabled="disabled || disableFromParent"
        type="tertiary"
        size="small"
        :pressed="pressed"
        @click.stop="emit('click')"
      />
    </UnnnicToolTip>
  </section>
</template>

<script setup lang="ts">
defineOptions({
  name: 'TextBoxActionItem',
});

defineProps<{
  icon: string;
  tooltip?: string;
  disabled?: boolean;
  pressed?: boolean;
  showDivider?: boolean;
  disableFromParent?: boolean;
}>();

const emit = defineEmits<{
  click: [void];
}>();
</script>
