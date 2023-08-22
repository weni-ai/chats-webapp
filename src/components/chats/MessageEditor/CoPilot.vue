<template>
  <div
    class="co-pilot"
    :class="{ loading: isLoading }"
    v-click-outside="close"
    @keydown.esc="close"
  >
    <header class="co-pilot__header">
      <div class="co-pilot__header__title">
        <unnnic-icon icon="study-light-idea-1" />
        <h1>{{ isLoading ? $t('copilot.loading') : $t('copilot.suggestion') }}</h1>
      </div>
      <button
        class="co-pilot__header__close"
        ref="closeButton"
        @click="close"
        @keypress.esc="close"
      >
        <unnnic-icon icon="close-1" size="xs" class="clickable" />
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
        class="co-pilot__response__suggestion clickable"
        @click="select('Para pagar seu boleto basta acessar seu aplicativo e gerar um novo boleto')"
        ref="suggestion"
      >
        Para pagar seu boleto basta acessar seu aplicativo e gerar um novo boleto
      </button>
    </section>
  </div>
</template>
<script>
import vClickOutside from 'v-click-outside';
import { mapActions, mapState } from 'vuex';

export default {
  name: 'CoPilot',
  data() {
    return {
      isLoading: true,
    };
  },
  mounted() {
    this.getCopilotSuggestion();
    this.$nextTick(() => {
      this.$refs.closeButton.focus();
    });
    setTimeout(() => {
      this.isLoading = false;
    }, 3000);
  },
  directives: {
    clickOutside: vClickOutside.directive,
  },
  computed: {
    ...mapState({
      copilotSuggestion: (state) => state.rooms.copilotSuggestion,
    }),
  },
  methods: {
    ...mapActions({
      getCopilotSuggestion: 'rooms/getCopilotSuggestion',
    }),
    close() {
      this.$emit('close');
    },
    select(suggestion) {
      this.$emit('select', suggestion);
      this.close();
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
    padding: $unnnic-spacing-sm;

    .co-pilot__header {
      padding-bottom: $unnnic-spacing-xs;

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

  &:not(.loading) {
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

      .unnnic-icon {
        width: 20px;
        height: 20px;
        min-width: 20px;
        min-height: 20px;
      }

      h1 {
        color: $unnnic-color-weni-600;
        font-weight: $unnnic-font-weight-bold;
        font-size: $unnnic-font-size-body-md;
      }

      :deep(svg > path) {
        fill: $unnnic-color-weni-600;
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
