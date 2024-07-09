<template>
  <div
    v-click-outside="close"
    class="co-pilot"
    :class="{ loading: isLoading, error: isError }"
    @keydown.esc="close"
  >
    <header class="co-pilot__header">
      <div class="co-pilot__header__title">
        <UnnnicIcon
          v-if="isError"
          icon="alert-circle-1"
        />
        <UnnnicIcon
          v-else
          icon="wb_incandescent"
          class="co-pilot__header__title__light-icon"
        />
        <h1>
          {{
            isLoading
              ? $t('copilot.loading')
              : copilotSuggestion
                ? $t('copilot.suggestion')
                : $t('copilot.error')
          }}
        </h1>
      </div>
      <button
        ref="closeButton"
        class="co-pilot__header__close"
        @click="close"
        @keypress.esc="close"
      >
        <UnnnicIcon
          icon="close"
          size="xs"
          class="clickable"
        />
      </button>
    </header>
    <section class="co-pilot__response">
      <img
        v-if="isLoading"
        class="co-pilot__response__loading"
        src="@/assets/LogoWeniAnimada4.svg"
        alt="Loading"
      />
      <button
        v-else
        ref="suggestion"
        class="co-pilot__response__suggestion clickable"
        @click="select(copilotSuggestion)"
      >
        {{ copilotSuggestion || $t('copilot.try_again') }}
      </button>
    </section>
  </div>
</template>
<script>
import vClickOutside from 'v-click-outside';

import { mapActions, mapState } from 'pinia';
import { useRooms } from '@/store/modules/chats/rooms';

export default {
  name: 'CoPilot',
  directives: {
    clickOutside: vClickOutside.directive,
  },
  emits: ['close', 'select'],
  data() {
    return {
      isLoading: true,
      suggestionTimeout: null,
    };
  },
  computed: {
    ...mapState(useRooms, ['copilotSuggestion']),
    isError() {
      return !this.isLoading && !this.copilotSuggestion;
    },
  },
  watch: {
    isLoading(newIsLoading) {
      if (newIsLoading === false) {
        this.$nextTick(() => {
          this.$refs.suggestion.focus();
        });
      }
    },
    copilotSuggestion(newValue) {
      if (newValue) {
        clearInterval(this.suggestionTimeout);
        this.isLoading = false;
      }
    },
  },
  async mounted() {
    this.$nextTick(() => {
      this.$refs.closeButton.focus();
    });

    const SUGGESTION__TIMEOUT = 1000 * 45; // 45 secs
    this.suggestionTimeout = setTimeout(() => {
      this.isLoading = false;
    }, SUGGESTION__TIMEOUT);

    const responseCopilotStatus = await this.getCopilotSuggestion();
    if (responseCopilotStatus && responseCopilotStatus !== 200) {
      clearInterval(this.suggestionTimeout);
      this.isLoading = false;
    }
  },
  methods: {
    ...mapActions(useRooms, ['getCopilotSuggestion', 'clearCopilotSuggestion']),
    close() {
      this.$emit('close');
    },
    select(suggestion) {
      this.$emit('select', suggestion);
      this.clearCopilotSuggestion();
      this.close();
    },
  },
};
</script>
<style lang="scss" scoped>
.co-pilot {
  position: absolute;
  bottom: calc(100% + $unnnic-spacing-xs);

  background-color: $unnnic-color-background-snow;
  border-radius: $unnnic-border-radius-md;
  box-shadow: $unnnic-shadow-level-near;

  width: calc(100% - $unnnic-spacing-sm);
  max-height: 40vh;
  overflow: hidden;

  &.loading {
    .co-pilot__header {
      &__title h1 {
        &::after {
          overflow: hidden;
          display: inline-block;
          vertical-align: bottom;
          animation: ellipsis steps(4, end) 2.2s infinite;
          content: '\2026'; /* ascii code for the ellipsis character */
          width: 0px;
        }

        @keyframes ellipsis {
          to {
            width: $unnnic-font-size-body-md;
          }
        }
      }
    }
  }

  &.error {
    background-color: $unnnic-color-neutral-lightest;

    .co-pilot__header {
      &__title {
        h1 {
          color: $unnnic-color-neutral-dark;
        }
        :deep(svg > path) {
          fill: $unnnic-color-aux-red-500;
        }
      }
      &__close {
        background-color: $unnnic-color-neutral-lightest;
      }
    }

    .co-pilot__response {
      &__suggestion {
        padding: 0;
        padding-top: $unnnic-spacing-xs;

        background-color: $unnnic-color-neutral-lightest;

        text-align: center;
      }
    }
  }

  &.loading,
  &.error {
    padding: $unnnic-spacing-sm;

    .co-pilot__header {
      padding-bottom: $unnnic-spacing-xs;
    }
  }

  &:not(.loading, .error) {
    .co-pilot__header {
      padding: $unnnic-spacing-xs $unnnic-spacing-sm;
    }
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    border-bottom: 1px solid $unnnic-color-neutral-soft;

    &__title {
      display: flex;
      align-items: center;
      gap: $unnnic-spacing-nano;

      :deep(.co-pilot__header__title__light-icon) {
        rotate: 180deg;

        color: $unnnic-color-weni-600;
        font-size: 20px;
      }

      h1 {
        color: $unnnic-color-weni-600;
        font-weight: $unnnic-font-weight-bold;
        font-size: $unnnic-font-size-body-md;
      }
    }

    &__close {
      margin: 0;
      outline: none;
      border: none;
      padding: 0;
      background-color: $unnnic-color-background-snow;
    }
  }

  &__response {
    display: flex;
    justify-content: center;

    &__loading {
      margin-top: $unnnic-spacing-xs;

      width: auto;
      height: 42px;
    }

    &__suggestion {
      margin: 0;
      padding: 0;
      border: none;
      outline: none;
      text-align: start;

      width: 100%;
      padding: $unnnic-spacing-ant $unnnic-spacing-sm;
      line-height: $unnnic-font-size-body-lg + $unnnic-spacing-nano;

      color: $unnnic-color-neutral-dark;
      font-size: $unnnic-font-size-body-md;
      background-color: $unnnic-color-weni-50;

      &:active {
        background-color: $unnnic-color-weni-100;
      }
    }
  }
}
</style>
