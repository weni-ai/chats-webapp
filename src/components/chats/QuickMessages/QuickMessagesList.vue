<template>
  <section class="quick-messages-list">
    <header class="quick-messages-list__header">
      <p class="quick-messages-list__header-title">{{ title }}</p>
      <UnnnicButton
        v-if="showNewButton"
        iconLeft="add"
        type="secondary"
        size="small"
        :text="$t('message')"
        @click="$emit('open-new-quick-message')"
      />
    </header>
    <Transition name="expand-with-fade">
      <section
        v-show="openQuickMessages"
        class="quick-messages-list__cards"
      >
        <p
          v-if="withoutQuickMessages"
          class="quick-messages-list__without-messages-text"
          v-html="withoutMessagesText"
        />
        <QuickMessageCard
          v-for="(quickMessage, index) in quickMessages"
          v-else
          :key="quickMessage.uuid"
          :quickMessage="quickMessage"
          :withActions="withHandlers"
          :showTooltip="quickMessage.text.length > 70"
          :tooltipSide="index > 2 ? 'top' : 'left'"
          clickable
          @select="emitSelectQuickMessage"
          @edit="emitEditQuickMessage"
          @delete="emitDeleteQuickMessage"
        />
        <div
          v-if="infiniteScroll && !withoutQuickMessages"
          ref="infiniteScrollSentinel"
          data-testid="sentinel"
          class="quick-messages-list__sentinel"
        />
        <UnnnicIconLoading
          v-if="infiniteScroll && loadingMore"
          class="quick-messages-list__loading"
        />
      </section>
    </Transition>
    <section
      v-if="showExpand && !withoutQuickMessages"
      class="quick-messages-list__slide"
    >
      <UnnnicIcon
        :icon="openQuickMessages ? 'expand_less' : 'expand_more'"
        clickable
        @click="openQuickMessages = !openQuickMessages"
      />
    </section>
  </section>
</template>

<script>
import QuickMessageCard from './QuickMessageCard.vue';

export default {
  name: 'QuickMessagesList',

  components: {
    QuickMessageCard,
  },

  props: {
    withHandlers: {
      type: Boolean,
      default: false,
    },
    isEmpty: {
      type: Boolean,
    },
    title: {
      type: String,
      default: '',
    },
    showNewButton: {
      type: Boolean,
      default: false,
    },
    quickMessages: {
      type: Array,
      required: true,
    },
    showExpand: {
      type: Boolean,
      default: false,
    },
    withoutMessagesText: {
      type: String,
      default: '',
    },
    infiniteScroll: {
      type: Boolean,
      default: false,
    },
    loadingMore: {
      type: Boolean,
      default: false,
    },
    hasMore: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'update:isEmpty',
    'select-quick-message',
    'edit-quick-message',
    'delete-quick-message',
    'open-new-quick-message',
    'load-more',
  ],

  data() {
    return {
      openQuickMessages: true,
      intersectionObserver: null,
    };
  },

  computed: {
    withoutQuickMessages() {
      return this.quickMessages?.length === 0;
    },
    infiniteScrollReady() {
      return this.infiniteScroll && !this.withoutQuickMessages;
    },
  },
  watch: {
    withoutQuickMessages: {
      immediate: true,
      handler(newWithoutQuickMessages) {
        this.$emit('update:isEmpty', newWithoutQuickMessages);
      },
    },
    infiniteScrollReady: {
      handler(isReady) {
        if (isReady) {
          this.$nextTick(() => this.setupInfiniteScroll());
          return;
        }

        this.teardownInfiniteScroll();
      },
    },
    loadingMore(isLoading, wasLoading) {
      if (!isLoading && wasLoading && this.infiniteScrollReady) {
        this.$nextTick(() => this.checkSentinelVisibility());
      }
    },
    hasMore(isAvailable) {
      if (isAvailable && this.infiniteScrollReady && !this.loadingMore) {
        this.$nextTick(() => this.checkSentinelVisibility());
      }
    },
  },

  mounted() {
    if (this.infiniteScrollReady) {
      this.$nextTick(() => this.setupInfiniteScroll());
    }
  },

  beforeUnmount() {
    this.teardownInfiniteScroll();
  },

  methods: {
    findScrollRoot(element) {
      let parent = element?.parentElement;

      while (parent) {
        const { overflowY } = window.getComputedStyle(parent);

        if (overflowY === 'auto' || overflowY === 'scroll') {
          return parent;
        }

        parent = parent.parentElement;
      }

      return null;
    },
    checkSentinelVisibility() {
      if (!this.hasMore || this.loadingMore) return;

      const sentinel = this.$refs.infiniteScrollSentinel;
      if (!sentinel) return;

      const scrollRoot = this.findScrollRoot(sentinel);
      const sentinelRect = sentinel.getBoundingClientRect();

      const isVisible = scrollRoot
        ? this.isElementVisibleInContainer(sentinelRect, scrollRoot)
        : sentinelRect.top <= window.innerHeight + 120 &&
          sentinelRect.bottom >= -120;

      if (isVisible) {
        this.$emit('load-more');
      }
    },
    isElementVisibleInContainer(elementRect, container) {
      const containerRect = container.getBoundingClientRect();

      return (
        elementRect.top <= containerRect.bottom + 120 &&
        elementRect.bottom >= containerRect.top - 120
      );
    },
    setupInfiniteScroll() {
      this.teardownInfiniteScroll();

      const sentinel = this.$refs.infiniteScrollSentinel;
      if (!sentinel) return;

      const scrollRoot = this.findScrollRoot(sentinel);

      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const isVisible = entries.some((entry) => entry.isIntersecting);
          if (isVisible && this.hasMore && !this.loadingMore) {
            this.$emit('load-more');
          }
        },
        {
          root: scrollRoot,
          rootMargin: '120px',
        },
      );

      this.intersectionObserver.observe(sentinel);
    },
    teardownInfiniteScroll() {
      if (this.intersectionObserver) {
        this.intersectionObserver.disconnect();
        this.intersectionObserver = null;
      }
    },
    emitSelectQuickMessage(quickMessage) {
      this.$emit('select-quick-message', quickMessage);
    },
    emitEditQuickMessage(quickMessage) {
      this.$emit('edit-quick-message', quickMessage);
    },
    emitDeleteQuickMessage(quickMessage) {
      this.$emit('delete-quick-message', quickMessage);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '@/styles/animations';

.quick-messages-list {
  padding: $unnnic-space-2;
  border-top: 1px solid $unnnic-color-border-soft;
  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    padding: $unnnic-space-2 0;

    &-title {
      font: $unnnic-font-display-4;
      color: $unnnic-color-fg-emphasized;
    }
  }
  &__cards {
    display: flex;
    flex-direction: column;
    gap: $unnnic-space-2;
    padding: $unnnic-space-2 0;
  }
  &__slide {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  &__without-messages-text {
    font: $unnnic-font-body;
    color: $unnnic-color-fg-base;
  }
  &__sentinel {
    width: 100%;
    height: 1px;
  }
  &__loading {
    display: flex;
    justify-content: center;
    padding: $unnnic-space-2 0;
  }
}
</style>
