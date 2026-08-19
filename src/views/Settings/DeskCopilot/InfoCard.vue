<template>
  <section
    class="desk-copilot-info-card"
    data-testid="desk-copilot-info-card"
  >
    <header class="desk-copilot-info-card__header">
      <h2 class="desk-copilot-info-card__title">
        {{ $t('config_chats.desk_copilot.info.title') }}
      </h2>
      <UnnnicButton
        type="secondary"
        size="large"
        iconLeft="open_in_new"
        :text="$t('config_chats.desk_copilot.info.learn_more')"
        data-testid="desk-copilot-learn-more"
        @click="openLearnMore"
      />
    </header>

    <ul class="desk-copilot-info-card__features">
      <li
        v-for="feature in features"
        :key="feature.titleKey"
        class="desk-copilot-info-card__feature"
      >
        <UnnnicIcon
          :icon="feature.icon"
          size="sm"
          :scheme="feature.scheme"
        />
        <section class="desk-copilot-info-card__feature-text">
          <p class="desk-copilot-info-card__feature-title">
            {{ $t(feature.titleKey) }}
          </p>
          <p class="desk-copilot-info-card__feature-description">
            {{ $t(feature.descriptionKey) }}
          </p>
        </section>
      </li>
    </ul>
  </section>
</template>

<script setup lang="ts">
import env from '@/utils/env';

defineOptions({
  name: 'DeskCopilotInfoCard',
});

const features = [
  {
    icon: 'bi:stars',
    scheme: 'fg-accent',
    titleKey: 'config_chats.desk_copilot.info.ai_assistance.title',
    descriptionKey: 'config_chats.desk_copilot.info.ai_assistance.description',
  },
  {
    icon: 'workspaces',
    scheme: 'fg-accent',
    titleKey: 'config_chats.desk_copilot.info.centralized_agents.title',
    descriptionKey:
      'config_chats.desk_copilot.info.centralized_agents.description',
  },
  {
    icon: 'copy_all',
    scheme: 'fg-accent',
    titleKey: 'config_chats.desk_copilot.info.shared_across_projects.title',
    descriptionKey:
      'config_chats.desk_copilot.info.shared_across_projects.description',
  },
  {
    icon: 'autorenew',
    scheme: 'fg-accent',
    titleKey: 'config_chats.desk_copilot.info.automatic_updates.title',
    descriptionKey:
      'config_chats.desk_copilot.info.automatic_updates.description',
  },
] as const;

function openLearnMore() {
  const url = env('DESK_COPILOT_LEARN_MORE_URL');
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}
</script>

<style lang="scss" scoped>
.desk-copilot-info-card {
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
    align-items: center;
    justify-content: space-between;
    gap: $unnnic-space-4;
  }

  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
    margin: 0;
  }

  &__features {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-4;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  &__feature {
    display: flex;
    align-items: center;
    gap: $unnnic-space-4;
  }

  &__feature-text {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-1;
    min-width: 0;
  }

  &__feature-title {
    font: $unnnic-font-action;
    color: $unnnic-color-fg-emphasized;
    margin: 0;
  }

  &__feature-description {
    font: $unnnic-font-caption-2;
    color: $unnnic-color-fg-base;
    margin: 0;
  }
}
</style>
