<template>
  <section class="profile-preferences">
    <UnnnicBreadcrumb :crumbs="breadcrumb" />

    <main>
      <header class="profile-preferences__header">
        <h1 class="profile-preferences__title">
          {{ $t('chats_notifications.title') }}
        </h1>
      </header>

      <section class="profile-preferences__content">
        <p class="profile-preferences__label">
          {{ $t('chats_notifications.label') }}
        </p>

        <section class="profile-preferences__options">
          <UnnnicSwitch
            v-for="option in options"
            :key="option.label"
            v-model="option.value"
            :textRight="option.label"
          />
        </section>
      </section>
    </main>

    <UnnnicButton
      :text="$t('save')"
      type="secondary"
      @click="showConfirmationAlert"
    />
  </section>
</template>

<script>
import unnnic from '@weni/unnnic-system';

export default {
  name: 'ProfilePreferences',

  computed: {
    breadcrumb() {
      return [
        {
          name: this.$t('preferences.title'),
        },
      ];
    },
    options() {
      return [
        {
          label: this.$t('new_messages_song.queue'),
          value: true,
        },
        {
          label: this.$t('new_messages_song.in_progress'),
          value: true,
        },
        {
          label: this.$t('new_messages_song.actions'),
          value: true,
        },
      ];
    },
  },

  methods: {
    showConfirmationAlert() {
      unnnic.unnnicCallAlert({
        props: {
          text: this.$t('updates_saved'),
          type: 'success',
        },
        seconds: 15,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.profile-preferences {
  display: flex;
  flex-direction: column;
  gap: $unnnic-spacing-stack-xl;
  margin: {
    left: $unnnic-spacing-inline-lg;
    right: $unnnic-spacing-inline-xl;
  }

  &__header {
    font-family: $unnnic-font-family-primary;
    margin-bottom: $unnnic-spacing-inline-md;
  }

  &__title {
    font-size: $unnnic-font-size-title-md;
    color: $unnnic-color-neutral-black;
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-md;
  }

  &__label {
    font-family: $unnnic-font-size-body-lg;
    color: $unnnic-color-neutral-cloudy;
  }

  &__options {
    display: flex;
    flex-direction: column;
    gap: $unnnic-spacing-stack-sm;
  }
}
</style>
