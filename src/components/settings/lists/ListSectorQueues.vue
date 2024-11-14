<template>
  <section class="sector-queues-form">
    <p class="sector-queues-form__info">{{ $t('config_chats.queues.info') }}</p>

    <section class="sector-queues-form-grid">
      <UnnnicCard
        class="sector-queues-form-grid__new-queue"
        type="blank"
        :text="$t('config_chats.queues.new')"
        icon="add"
        data-testid="create-sector-card"
        @click.stop="openConfigQueueDrawer()"
      />
      <UnnnicSimpleCard
        v-for="queue in queues"
        :key="queue.uuid"
        :title="queue.name"
        clickable
        class="sector-queues-form-grid-sector-card"
        data-testid="queue-card"
        @click="openConfigQueueDrawer(queue)"
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
  <UnnnicDrawer
    ref="queueDrawer"
    :modelValue="showQueueDrawer"
    :title="
      queueToConfig.uuid ? queueToConfig.name : $t('config_chats.queues.new')
    "
    :description="$t('config_chats.queues.in_sector', { sector: sector.name })"
    size="lg"
    :primaryButtonText="$t('save')"
    :disabledPrimaryButton="!queueToConfig.currentAgents?.length"
    :loadingPrimaryButton="loadingQueueConfig"
    :secondaryButtonText="$t('cancel')"
    :disabledSecondaryButton="loadingQueueConfig"
    data-testid="queue-config-drawer"
    @close="closeQueueConfigDrawer()"
    @primary-button-click="handlerSetConfigQueue()"
    @secondary-button-click="$refs.queueDrawer.close()"
  >
    <template #content>
      <FormQueue
        ref="formQueue"
        v-model="queueToConfig"
        :sector="sector"
        data-testid="queue-config-form"
        @update-queue-agents-count="updateAgentsCount($event)"
      />
    </template>
  </UnnnicDrawer>
</template>

<script>
import unnnic from '@weni/unnnic-system';

import FormQueue from '../forms/Queue.vue';
import Queue from '@/services/api/resources/settings/queue';

export default {
  name: 'ListSectorQueues',
  components: {
    FormQueue,
  },
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
      showQueueDrawer: false,
      queueToConfig: {},
      loadingQueueConfig: false,
    };
  },

  mounted() {
    this.listenConnect();
    this.getQueues();
  },
  methods: {
    handleConnectOverlay(active) {
      window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
    },
    listenConnect() {
      window.addEventListener('message', (message) => {
        const { event } = message.data;
        if (event === 'close') this.$refs.queueDrawer?.close();
      });
    },
    openConfigQueueDrawer(queue = {}) {
      this.handleConnectOverlay(true);
      this.showQueueDrawer = true;
      this.queueToConfig = queue;
    },
    closeQueueConfigDrawer() {
      this.handleConnectOverlay(false);
      this.showQueueDrawer = false;
      this.queueToConfig = {};
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
    async handlerSetConfigQueue() {
      try {
        this.loadingQueueConfig = true;
        const { name, default_message } = this.queueToConfig;
        if (this.queueToConfig.uuid) {
          await Promise.all([
            ...this.$refs.formQueue.toAddAgentsUuids.map((agentUuid) =>
              Queue.addAgent(this.queueToConfig.uuid, agentUuid),
            ),
            ...this.$refs.formQueue.toRemoveAgentsUuids.map((agentUuid) =>
              Queue.removeAgent(agentUuid),
            ),
          ]);

          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('config_chats.queues.message.update'),
              type: 'success',
            },
          });
        } else {
          const createdQueue = await Queue.create({
            name,
            default_message,
            sectorUuid: this.sector.uuid,
          });
          await Promise.all(
            this.queueToConfig.currentAgents.map((agent) => {
              Queue.addAgent(createdQueue.uuid, agent.uuid);
            }),
          );
          this.queues.push({
            ...createdQueue,
            agents: this.queueToConfig.currentAgents?.length || 0,
          });
          unnnic.unnnicCallAlert({
            props: {
              text: this.$t('config_chats.queues.message.create'),
              type: 'success',
            },
          });
        }
      } catch (error) {
        console.log(error);
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('config_chats.queues.message.error'),
            type: 'error',
          },
        });
      } finally {
        this.loadingQueueConfig = false;
        this.closeQueueConfigDrawer();
      }
    },
    updateAgentsCount(queue) {
      const queueIndex = this.queues.findIndex((q) => q.uuid === queue.uuid);
      if (queueIndex > -1) this.queues[queueIndex] = queue;
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
