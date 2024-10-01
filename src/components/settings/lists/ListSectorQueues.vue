<template>
  <section class="sector-queues-form">
    <p class="sector-queues-form__info">{{ $t('config_chats.queues.info') }}</p>

    <section class="sector-queues-form-grid">
      <UnnnicCard
        class="sector-queues-form-grid__new-queue"
        type="blank"
        :text="$t('config_chats.queues.new')"
        icon="add"
        data-testid="create=sector-card"
        @click.stop="openNewQueueDrawer()"
      />
      <UnnnicSimpleCard
        v-for="queue in queues"
        :key="queue.uuid"
        :title="queue.name"
        clickable
        class="sector-queues-form-grid-sector-card"
        data-testid="queue-card"
        @click="openEditQueueDrawer(queue)"
      >
        <template #headerSlot>
          <p class="sector-queues-form-grid-sector-card__open-label">
            {{ $t('config_chats.open') }}
          </p>
        </template>
        <template #footer>
          <section class="sector-queues-form-grid-sector-card-footer">
            <b class="sector-queues-form-grid-sector-card-footer__agent-count">
              {{ queue.agents }}
            </b>
            <p class="sector-queues-form-grid-sector-card-footer__agent-label">
              {{ $t('config_chats.agent_title') }}
            </p>
          </section>
        </template>
      </UnnnicSimpleCard>
    </section>
  </section>
</template>

<script>
import Queue from '@/services/api/resources/settings/queue';

export default {
  name: 'FormQueue',
  props: {
    sector: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      queues: [],
      page: 0,
    };
  },

  mounted() {
    this.getQueues();
  },
  methods: {
    openNewQueueDrawer() {
      // TODO
    },
    openEditQueueDrawer(queue) {
      // TODO
    },
    async getQueues() {
      let hasNext = false;
      try {
        const queues = await Queue.list(this.sector.uuid, this.page * 10, 10);
        this.page += 1;
        this.queues = this.queues.concat(queues.results);

        hasNext = queues.next;
      } finally {
        if (hasNext) {
          this.getQueues();
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.sector-queues-form {
  display: grid;
  gap: $unnnic-spacing-ant;

  &__info {
    color: $unnnic-color-neutral-dark;
    font-size: $unnnic-font-size-body-gt;
    line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-spacing-xs;

    &-sector-card {
      &__open-label {
        color: $unnnic-color-neutral-dark;
        font-family: $unnnic-font-family-secondary;
        font-size: $unnnic-font-size-body-gt;
        line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
      }
      &-footer {
        display: flex;
        gap: $unnnic-spacing-nano;
        &__agent-count {
          color: $unnnic-color-neutral-dark;
          font-family: $unnnic-font-family-secondary;
          font-size: $unnnic-font-size-body-gt;
          font-weight: $unnnic-font-weight-bold;
          line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
        }
        &__agent-label {
          color: $unnnic-color-neutral-cloudy;
          font-family: $unnnic-font-family-secondary;
          font-size: $unnnic-font-size-body-gt;
          line-height: $unnnic-font-size-body-gt + $unnnic-line-height-md;
        }
      }
    }

    &__new-queue:hover {
      box-shadow: $unnnic-shadow-level-far;
    }
    &__new-queue:active {
      border: 1px solid $unnnic-color-neutral-cleanest;
    }
    &__new-queue {
      min-height: 120px;
      :deep(.unnnic-card-blank__content) {
        flex-direction: row;
      }
      :deep(.unnnic-card-blank__content__icon) {
        font-size: $unnnic-font-size-title-md;
      }
    }
  }
}
</style>
