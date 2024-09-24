<template>
  <section class="sector-queues-form">
    <p class="sector-queues-form__info">{{ $t('config_chats.queues.info') }}</p>

    <section class="sector-queues-form-grid">
      <!-- TODO ajustar hover e click do componente -->
      <UnnnicCard
        class="sector-queues-form-grid__new-queue"
        type="blank"
        :text="$t('config_chats.queues.new')"
        icon="add"
      />
      <UnnnicSimpleCard
        v-for="queue in queues"
        :key="queue.uuid"
        :title="queue.name"
        clickable
        class="sector-queues-form-grid__sector-card"
      >
        <template #headerSlot>
          <p>{{ $t('config_chats.open') }}</p>
        </template>
        <template #footer>
          <p>{{ queue.agents }} {{ $t('config_chats.agent_title') }}</p>
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
    async getQueues() {
      this.loading = true;
      let hasNext = false;
      try {
        const queues = await Queue.list(this.sector.uuid, this.page * 10, 10);
        this.page += 1;
        this.queues = this.queues.concat(queues.results);

        hasNext = queues.next;

        this.loading = false;
      } finally {
        this.loading = false;
      }
      if (hasNext) {
        this.getQueues();
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

    &__new-queue {
      :deep(.unnnic-card-blank__content) {
        flex-direction: row;
      }
      :deep(.unnnic-card-blank__content__icon) {
        font-size: 24px;
      }
    }
  }
}
</style>
