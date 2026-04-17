<template>
  <section class="sector-queues-form">
    <h1 class="sector-queues-form__title">
      {{ $t('config_chats.queues.title') }}
    </h1>
    <section class="sector-queues-form__filters">
      <UnnnicInput
        v-model="queueNameFilter"
        class="sector-queues-form__filters__input"
        iconLeft="search-1"
        size="md"
        :label="$t('config_chats.queues.filter_by_name')"
        :placeholder="$t('type_to_filter')"
      />
      <ListOrdinator
        v-model="queueOrder"
        :label="$t('order_by.label')"
      />
    </section>
    <section class="sector-queues-form-grid">
      <QueueCard
        v-for="queue in queuesOrdered"
        :key="queue.uuid"
        :queue="queue"
        @edit="openConfigQueueDrawer(queue)"
        @delete="handlerOpenDeleteQueueModal"
      />
    </section>
  </section>
  <UnnnicDrawer
    v-if="showQueueDrawer"
    ref="queueDrawer"
    :modelValue="showQueueDrawer"
    :title="
      queueToConfig[0].uuid ? editQueueTitle : $t('config_chats.queues.new')
    "
    :description="$t('config_chats.queues.in_sector', { sector: sector.name })"
    size="lg"
    :primaryButtonText="$t('save')"
    :disabledPrimaryButton="!validForm"
    :loadingPrimaryButton="loadingQueueConfig"
    :secondaryButtonText="$t('cancel')"
    :disabledSecondaryButton="loadingQueueConfig"
    data-testid="queue-config-drawer"
    closeIcon="close"
    @close="closeQueueConfigDrawer()"
    @primary-button-click="handlerSetConfigQueue()"
    @secondary-button-click="closeQueueConfigDrawer()"
  >
    <template #content>
      <FormQueue
        ref="formQueue"
        v-model="queueToConfig"
        :sector="sector"
        data-testid="queue-config-form"
        @change-is-valid="validForm = $event"
      />
    </template>
  </UnnnicDrawer>
  <ModalDeleteWithTransfer
    v-if="showDeleteQueueModal"
    v-model="showDeleteQueueModal"
    data-testid="delete-queue-modal"
    type="queue"
    :name="queueToDelete.name"
    :excludeQueueUuid="queueToDelete.uuid"
    :inProgressChatsCount="queueRoomsCount"
    :isLoading="isLoadingDeleteQueue"
    @confirm="deleteQueue"
    @cancel="handlerCloseDeleteQueueModal()"
  />
</template>

<script>
import { mapState } from 'pinia';

import FormQueue from '@/views/Settings/Forms/Queue/index.vue';
import ListOrdinator from '@/components/ListOrdinator.vue';
import ModalDeleteWithTransfer from '@/components/ModalDeleteWithTransfer.vue';
import QueueCard from './QueueCard.vue';

import { useFeatureFlag } from '@/store/modules/featureFlag';

import Queue from '@/services/api/resources/settings/queue';

import unnnic from '@weni/unnnic-system';

export default {
  name: 'ListSectorQueues',
  components: {
    FormQueue,
    ListOrdinator,
    ModalDeleteWithTransfer,
    QueueCard,
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
      queueToConfig: [{}],
      editQueueTitle: '',
      loadingQueueConfig: false,
      validForm: false,
      queueNameFilter: '',
      queueOrder: 'alphabetical',
      isLoadingDeleteQueue: false,
      queueRoomsCount: 0,
      showDeleteQueueModal: false,
      queueToDelete: {},
    };
  },

  computed: {
    ...mapState(useFeatureFlag, ['featureFlags']),
    enableQueueLimitFeature() {
      return this.featureFlags.active_features?.includes('weniChatsQueueLimit');
    },
    queuesOrdered() {
      let queuesOrdered = this.queues.slice().sort((a, b) => {
        let first = null;
        let second = null;

        if (this.queueOrder === 'alphabetical') {
          first = a.name.toLowerCase();
          second = b.name.toLowerCase();
        } else if (this.queueOrder === 'newer') {
          first = new Date(b.created_on).getTime();
          second = new Date(a.created_on).getTime();
        } else if (this.queueOrder === 'older') {
          first = new Date(a.created_on).getTime();
          second = new Date(b.created_on).getTime();
        }

        return first === second ? 0 : first > second ? 1 : -1;
      });

      return this.queueNameFilter.trim()
        ? queuesOrdered.filter(({ name }) =>
            name
              .toLowerCase()
              .includes(this.queueNameFilter.trim().toLowerCase()),
          )
        : queuesOrdered;
    },
  },

  mounted() {
    this.listenConnect();
    this.getQueues();
  },
  methods: {
    async deleteQueue(transferPayload) {
      try {
        this.isLoadingDeleteQueue = true;

        const options = {};
        if (transferPayload.action === 'transfer') {
          options.transferToQueue = transferPayload.transferQueueUuid;
        } else if (transferPayload.action === 'end_all') {
          options.endAllChats = true;
        }

        await Queue.delete(this.queueToDelete.uuid, options);
        this.queues = this.queues.filter(
          (queue) => queue.uuid !== this.queueToDelete.uuid,
        );
        unnnic.unnnicCallAlert({
          props: {
            text: this.$t('delete_modal.queue_success'),
            type: 'success',
          },
        });
      } catch (error) {
        const isTransferConflict = error?.response?.status === 409;
        unnnic.unnnicCallAlert({
          props: {
            text: isTransferConflict
              ? this.$t('delete_modal.transfer_error_queue')
              : this.$t('delete_modal.queue_error'),
            type: 'error',
          },
        });
      } finally {
        this.handlerCloseDeleteQueueModal();
        this.isLoadingDeleteQueue = false;
      }
    },
    handlerCloseDeleteQueueModal() {
      this.handleConnectOverlay(false);
      this.queueToDelete = {};
      this.showDeleteQueueModal = false;
    },
    async handlerOpenDeleteQueueModal(queue) {
      this.handleConnectOverlay(true);
      this.queueToDelete = queue;

      try {
        const { waiting, in_service } = await Queue.roomsCount(queue.uuid);
        this.queueRoomsCount = waiting + in_service;
      } catch {
        this.queueRoomsCount = 0;
      }

      this.showDeleteQueueModal = true;
    },
    handleConnectOverlay(active) {
      window.parent.postMessage({ event: 'changeOverlay', data: active }, '*');
    },
    listenConnect() {
      window.addEventListener('message', (message) => {
        const { event } = message.data;
        if (event === 'close') {
          this.$refs.queueDrawer?.close();
        }
      });
    },
    openConfigQueueDrawer(queue = undefined) {
      this.handleConnectOverlay(true);

      if (queue) {
        this.editQueueTitle = queue.name;
        this.queueToConfig = [
          {
            ...queue,
            toAddAgentsUuids: [],
            toRemoveAgentsUuids: [],
            queue_limit: {
              is_active: queue?.queue_limit?.is_active,
              limit: isNaN(parseInt(queue?.queue_limit?.limit))
                ? null
                : String(queue?.queue_limit?.limit),
            },
          },
        ];
      } else {
        this.queueToConfig = [
          {
            toAddAgentsUuids: [],
            toRemoveAgentsUuids: [],
            name: '',
            default_message: '',
            queue_limit: { is_active: false, limit: null },
          },
        ];
      }

      this.showQueueDrawer = true;
    },
    closeQueueConfigDrawer() {
      this.handleConnectOverlay(false);
      this.showQueueDrawer = false;
      this.queueToConfig = [{}];
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
        const {
          name,
          default_message,
          uuid = '',
          queue_limit,
          toAddAgentsUuids,
          toRemoveAgentsUuids,
        } = this.queueToConfig[0];

        if (this.queueToConfig[0].uuid) {
          await Promise.all([
            ...toAddAgentsUuids.map((agentUuid) =>
              Queue.addAgent(this.queueToConfig[0].uuid, agentUuid),
            ),
            ...toRemoveAgentsUuids.map((agentUuid) =>
              Queue.removeAgent(agentUuid),
            ),
          ]);

          const { data: updatedQueue } = await Queue.editQueue({
            name,
            uuid,
            default_message,
            queue_limit: this.enableQueueLimitFeature
              ? queue_limit
              : { is_active: false, limit: null },
          });

          this.queues = this.queues.map((queue) =>
            queue.uuid === updatedQueue.uuid ? updatedQueue : queue,
          );

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
            queue_limit: this.enableQueueLimitFeature
              ? queue_limit
              : { is_active: false, limit: null },
          });
          await Promise.all(
            this.queueToConfig[0].currentAgents.map((agent) => {
              Queue.addAgent(createdQueue.uuid, agent.uuid);
            }),
          );
          this.queues.push({
            ...createdQueue,
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
  },
};
</script>

<style lang="scss" scoped>
.sector-queues-form {
  display: grid;
  gap: $unnnic-space-3;

  &__filters {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: $unnnic-space-4 $unnnic-space-6;

    &__input {
      flex: 1;
    }
  }
  &__title {
    font: $unnnic-font-display-3;
    color: $unnnic-color-fg-emphasized;
  }

  &-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: $unnnic-space-2;
  }
}
</style>
