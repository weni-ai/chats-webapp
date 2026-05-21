<template>
  <section
    class="meta-template-preview"
    data-testid="meta-template-preview"
  >
    <header class="meta-template-preview__header">
      <p
        class="meta-template-preview__header-title"
        data-testid="meta-template-preview-title"
      >
        <span>{{ $t('flows_trigger.variable_mapping.preview_title') }}</span>
        <template v-if="templateName">: {{ templateName }}</template>
      </p>
    </header>

    <section class="meta-template-preview__body">
      <article
        class="meta-template-preview__card"
        data-testid="meta-template-preview-card"
      >
        <section class="meta-template-preview__card-content">
          <h2
            v-if="headerText"
            class="meta-template-preview__card-header"
            data-testid="meta-template-preview-header"
          >
            {{ headerText }}
          </h2>

          <p
            v-if="bodySegments.length > 0"
            class="meta-template-preview__card-body"
            data-testid="meta-template-preview-body"
          >
            <template
              v-for="(segment, index) in bodySegments"
              :key="index"
            >
              <UnnnicToolTip
                v-if="segment.type === 'variable'"
                enabled
                :text="getVariableTooltip(segment)"
                side="top"
                maxWidth="20rem"
              >
                <span
                  class="meta-template-preview__variable"
                  data-testid="meta-template-preview-variable"
                  >{{ segment.text }}</span
                >
              </UnnnicToolTip>
              <span
                v-else
                class="meta-template-preview__text"
                >{{ segment.text }}</span
              >
            </template>
          </p>

          <p
            v-if="footerText"
            class="meta-template-preview__card-footer"
            data-testid="meta-template-preview-footer"
          >
            {{ footerText }}
          </p>
        </section>

        <section
          v-for="(button, index) in buttons"
          :key="index"
          class="meta-template-preview__card-button"
          data-testid="meta-template-preview-button"
        >
          <UnnnicIconSvg
            v-if="button.icon"
            :icon="button.icon"
            scheme="aux-blue-500"
            size="sm"
          />
          <span class="meta-template-preview__card-button-text">
            {{ button.text }}
          </span>
        </section>
      </article>
    </section>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import i18n from '@/plugins/i18n';

import type {
  MetaTemplate,
  MetaTemplateButtonType,
  TemplateBodySegment,
} from './types.ts';

defineOptions({
  name: 'MetaTemplatePreview',
});

interface Props {
  template?: MetaTemplate;
  variables?: string[];
  variableValues?: Record<string, string>;
}

const props = withDefaults(defineProps<Props>(), {
  template: () => ({}) as MetaTemplate,
  variables: () => [],
  variableValues: () => ({}),
});

const templateName = computed(() => props.template?.name || '');

const components = computed(() =>
  Array.isArray(props.template?.components) ? props.template.components : [],
);

const headerComponent = computed(() =>
  components.value.find((c) => c?.type === 'HEADER'),
);

const headerText = computed(() => {
  const header = headerComponent.value;
  if (!header) return '';
  if (header.format && header.format !== 'TEXT') return '';
  return header.text || '';
});

const bodyComponent = computed(() =>
  components.value.find((c) => c?.type === 'BODY'),
);

const footerComponent = computed(() =>
  components.value.find((c) => c?.type === 'FOOTER'),
);

const footerText = computed(() => footerComponent.value?.text || '');

const buttonsComponent = computed(() =>
  components.value.find((c) => c?.type === 'BUTTONS'),
);

const getButtonIcon = (buttonType: MetaTemplateButtonType | undefined) => {
  const buttonMapper: Record<MetaTemplateButtonType, string> = {
    PHONE_NUMBER: 'phone',
    URL: 'open_in_new',
    COPY_CODE: 'content_copy',
    FLOW: '',
    QUICK_REPLY: 'reply',
  };

  return buttonType ? buttonMapper[buttonType] || '' : '';
};

const buttons = computed(() => {
  const list = buttonsComponent.value?.buttons || [];
  return list.map((button) => ({
    ...button,
    icon: getButtonIcon(button.type),
  }));
});

const bodySegments = computed<TemplateBodySegment[]>(() => {
  const rawText = bodyComponent.value?.text || '';
  if (!rawText) return [];

  const sanitized = rawText.replace(/<!--.*?-->/g, '');

  const segments: TemplateBodySegment[] = [];
  const regex = /\{\{(\d+)\}\}/g;
  let lastIndex = 0;
  let match = regex.exec(sanitized);

  while (match !== null) {
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        text: sanitized.slice(lastIndex, match.index),
      });
    }

    const positionalNumber = Number(match[1]);
    const positionalIndex = positionalNumber - 1;
    const variableName = props.variables?.[positionalIndex];
    const filledValue =
      variableName && props.variableValues?.[variableName]
        ? String(props.variableValues[variableName])
        : '';

    segments.push({
      type: 'variable',
      text: filledValue || `{{${match[1]}}}`,
      filled: Boolean(filledValue),
      positionalNumber,
      value: filledValue,
    });

    lastIndex = regex.lastIndex;
    match = regex.exec(sanitized);
  }

  if (lastIndex < sanitized.length) {
    segments.push({
      type: 'text',
      text: sanitized.slice(lastIndex),
    });
  }

  return segments;
});

const getVariableTooltip = (segment: TemplateBodySegment) => {
  const placeholder = `{{${segment.positionalNumber ?? ''}}}`;
  const label = i18n.global.t(
    'flows_trigger.variable_mapping.preview_variable_tooltip',
    { placeholder },
  );
  const trimmedValue = segment.value?.trim();
  return trimmedValue ? `${label} | ${trimmedValue}` : label;
};
</script>

<style lang="scss" scoped>
.meta-template-preview {
  display: flex;
  flex-direction: column;

  background-color: $unnnic-color-background-grass;
  border: 1px solid $unnnic-color-border-soft;
  border-radius: $unnnic-border-radius-sm;

  overflow: hidden;

  &__header {
    background-color: $unnnic-color-background-snow;
    padding: $unnnic-spacing-xs;
  }

  &__header-title {
    color: $unnnic-color-neutral-darkest;
    font: $unnnic-font-emphasis;
  }

  &__body {
    display: flex;
    flex-direction: column;
    padding: $unnnic-spacing-xs;
  }

  &__card {
    display: flex;
    flex-direction: column;
    background-color: $unnnic-color-background-snow;
    border-radius: $unnnic-border-radius-md;
    box-shadow: $unnnic-shadow-level-near;
    overflow: hidden;
  }

  &__card-content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-ant;

    padding: $unnnic-spacing-ant $unnnic-spacing-sm;
  }

  &__card-header {
    color: $unnnic-color-neutral-darkest;
    font: $unnnic-font-action;
  }

  &__card-body {
    color: $unnnic-color-neutral-dark;
    font: $unnnic-font-body;
    white-space: pre-wrap;
    word-break: break-word;
  }

  &__card-footer {
    color: $unnnic-color-neutral-cloudy;
    font: $unnnic-font-caption-2;
  }

  &__variable {
    color: $unnnic-color-aux-baby-blue;
    font-weight: $unnnic-font-weight-bold;
  }

  &__card-button {
    display: flex;
    gap: $unnnic-spacing-xs;
    align-items: center;
    justify-content: center;

    padding: $unnnic-spacing-ant;

    border-top: 1px solid $unnnic-color-border-soft;

    color: $unnnic-color-aux-blue-500;
  }

  &__card-button-text {
    color: $unnnic-color-aux-blue-500;
    font: $unnnic-font-action;
  }
}
</style>
