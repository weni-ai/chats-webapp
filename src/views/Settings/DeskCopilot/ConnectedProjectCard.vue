<template>
  <article
    class="desk-copilot-connected-card"
    data-testid="desk-copilot-connected-card"
  >
    <section class="desk-copilot-connected-card__header">
      <section class="desk-copilot-connected-card__identity">
        <span
          class="desk-copilot-connected-card__avatar"
          aria-hidden="true"
        >
          <UnnnicIcon
            icon="bi:stars"
            size="sm"
            scheme="fg-accent"
          />
        </span>
        <section class="desk-copilot-connected-card__identity-text">
          <section class="desk-copilot-connected-card__title-row">
            <h2
              class="desk-copilot-connected-card__name"
              data-testid="desk-copilot-connected-name"
            >
              {{ linkedProject.name }}
            </h2>
            <UnnnicTag
              :text="$t('config_chats.desk_copilot.connected.badge')"
              scheme="bg-muted"
              type="next"
              data-testid="desk-copilot-connected-badge"
            />
          </section>
          <p class="desk-copilot-connected-card__description">
            {{ $t('config_chats.desk_copilot.connected.description') }}
          </p>
        </section>
      </section>

      <section class="desk-copilot-connected-card__actions">
        <UnnnicButton
          type="secondary"
          size="large"
          iconLeft="arrow_outward"
          :text="$t('config_chats.desk_copilot.connected.open')"
          data-testid="desk-copilot-open-button"
          @click="openProject"
        />
        <UnnnicButton
          type="tertiary"
          size="small"
          iconCenter="more_vert"
          data-testid="desk-copilot-more-button"
        />
      </section>
    </section>

    <dl class="desk-copilot-connected-card__metadata">
      <div
        v-for="item in metadata"
        :key="item.labelKey"
        class="desk-copilot-connected-card__metadata-item"
      >
        <dt>{{ $t(item.labelKey) }}</dt>
        <dd :data-testid="item.testId">{{ item.value }}</dd>
      </div>
    </dl>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import moment from 'moment';

import type { CopilotProject } from '@/services/api/resources/chats/copilotProject';
import { buildCopilotProjectUrl } from '@/utils/copilotProject';

defineOptions({
  name: 'DeskCopilotConnectedProjectCard',
});

const props = defineProps<{
  linkedProject: CopilotProject;
}>();

function formatDate(value: string) {
  if (!value) return '–';
  const date = moment(value);
  return date.isValid() ? date.format('L') : '–';
}

const metadata = computed(() => [
  {
    labelKey: 'config_chats.desk_copilot.connected.created_on',
    value: formatDate(props.linkedProject.created_on),
    testId: 'desk-copilot-created-on',
  },
  {
    labelKey: 'config_chats.desk_copilot.connected.connected_to',
    value: formatDate(props.linkedProject.connected_on),
    testId: 'desk-copilot-connected-on',
  },
  {
    labelKey: 'config_chats.desk_copilot.connected.connected_by',
    value: props.linkedProject.connected_by || '–',
    testId: 'desk-copilot-connected-by',
  },
  {
    labelKey: 'config_chats.desk_copilot.connected.assigned_agents',
    value: String(props.linkedProject.assigned_agents ?? '–'),
    testId: 'desk-copilot-assigned-agents',
  },
]);

function openProject() {
  window.open(
    buildCopilotProjectUrl(props.linkedProject.uuid),
    '_blank',
    'noopener,noreferrer',
  );
}
</script>

<style lang="scss" scoped>
.desk-copilot-connected-card {
  display: flex;
  flex-direction: column;
  gap: $unnnic-space-4;
  padding: $unnnic-space-4;
  border: 1px solid $unnnic-color-border-base;
  border-radius: $unnnic-radius-4;
  background-color: $unnnic-color-bg-base;
  width: 100%;

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: $unnnic-space-4;
  }

  &__identity {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
    min-width: 0;
  }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: $unnnic-space-12;
    height: $unnnic-space-12;
    border-radius: $unnnic-border-radius-pill;
    background-color: $unnnic-color-bg-accent-plain;
  }

  &__identity-text {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    min-width: 0;
  }

  &__title-row {
    display: flex;
    align-items: center;
    gap: $unnnic-space-2;
  }

  &__name {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    margin: 0;
  }

  &__description {
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;
    margin: 0;
  }

  &__actions {
    display: flex;
    align-items: flex-start;
    gap: $unnnic-space-2;
    flex-shrink: 0;
  }

  &__metadata {
    display: flex;
    gap: $unnnic-space-2;
    margin: 0;
  }

  &__metadata-item {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    flex: 1;
    min-width: 0;

    dt {
      font: $unnnic-font-body;
      color: $unnnic-color-fg-base;
    }

    dd {
      font: $unnnic-font-action;
      color: $unnnic-color-fg-emphasized;
      margin: 0;
    }
  }
}
</style>
